import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDbClient } from "../db/connection";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";
import { env } from "../config/env";
import { randomUUID } from "crypto";
import { userManagementService } from "../services/userManagementService";
import { isSuperadminEmail } from "../services/superadminService";
import { superadminService } from "../services/superadminService";

const toHeaderString = (value: string | string[] | undefined): string | null =>
  Array.isArray(value) ? value.join("; ") : value ?? null;

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1)
});

const signToken = (userId: string, email: string): string =>
  jwt.sign({ userId, email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]
  });

const buildDisplayName = (email: string): string => {
  const base = email.split("@")[0] || "usuario";
  const parts = base.split(/[._-]+/).filter(Boolean);
  if (parts.length === 0) return "Usuario NeoView";
  return parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
};

const mergeRoles = (email: string, roles: string[]) => {
  const next = new Set(roles);
  if (isSuperadminEmail(email)) next.add("superadmin");
  return Array.from(next);
};

const findUserByEmail = async (
  identifier: string
): Promise<{
  db: Awaited<ReturnType<typeof getDbClient>>;
  user?: { id: string; email: string; name: string; employee_id?: string | null };
}> => {
  const db = await getDbClient();
  const normalized = identifier.trim().toLowerCase();
  const existing = await db.query<{ id: string; email: string; name: string; employee_id?: string | null }>(
    `SELECT id, email, name, employee_id
     FROM users
     WHERE LOWER(email) = $1 OR LOWER(COALESCE(employee_id, '')) = $1
     LIMIT 1`,
    [normalized]
  );

  return { db, user: existing.rows[0] };
};

export const authRoutes = Router();

authRoutes.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    return;
  }

  const db = await getDbClient();
  const existing = await db.query("SELECT id FROM users WHERE email = $1 LIMIT 1", [parsed.data.email]);
  if (existing.rows.length > 0) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const createdUserId = randomUUID();
  await db.query("INSERT INTO users (id, email, name) VALUES ($1, $2, $3)", [
    createdUserId,
    parsed.data.email,
    parsed.data.name
  ]);
  const userData = {
    id: createdUserId,
    email: parsed.data.email,
    name: parsed.data.name
  };
  const hash = await bcrypt.hash(parsed.data.password, 10);

  await db.query("INSERT INTO user_credentials (user_id, password_hash) VALUES ($1, $2)", [userData.id, hash]);

  res.status(201).json({
    token: signToken(userData.id, userData.email),
    user: userData
  });
  await superadminService.logAudit({
    userId: userData.id,
    action: "create",
    entityType: "user",
    entityId: userData.id,
    newValues: userData,
    ipAddress: req.ip,
    userAgent: toHeaderString(req.headers["user-agent"])
  });
});

authRoutes.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    return;
  }

  const { db, user } = await findUserByEmail(parsed.data.email);
  if (!user) {
    res.status(401).json({ error: "Usuario ou senha invalidos" });
    return;
  }

  const credentials = await db.query<{ password_hash: string }>(
    "SELECT password_hash FROM user_credentials WHERE user_id = $1 LIMIT 1",
    [user.id]
  );
  const passwordHash = credentials.rows[0]?.password_hash;
  if (!passwordHash) {
    res.status(401).json({ error: "Credencial de acesso nao configurada para este usuario" });
    return;
  }

  const passwordMatches = await bcrypt.compare(parsed.data.password, passwordHash);
  if (!passwordMatches) {
    res.status(401).json({ error: "Usuario ou senha invalidos" });
    return;
  }

  const fullUser = await userManagementService.getUserById(user.id);
  await superadminService.logAudit({
    userId: user.id,
    action: "login",
    entityType: "auth",
    entityId: user.id,
    newValues: { email: user.email },
    ipAddress: req.ip,
    userAgent: toHeaderString(req.headers["user-agent"])
  });

  res.json({
    token: signToken(user.id, user.email),
    roles: mergeRoles(user.email, fullUser?.roles ?? ["viewer"]),
    user: fullUser ?? {
      id: user.id,
      email: user.email,
      full_name: user.name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  });
});

authRoutes.get("/me", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const db = await getDbClient();
  const result = await db.query("SELECT id FROM users WHERE id = $1 LIMIT 1", [userId]);
  if (!result.rows[0]) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const user = await userManagementService.getUserById(userId);
  res.json({ user, roles: mergeRoles(user?.email ?? "", user?.roles ?? []) });
});
