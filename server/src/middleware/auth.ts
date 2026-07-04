import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { isSuperadminEmail } from "../services/superadminService";
import { userManagementService } from "../services/userManagementService";

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export const tryGetAuthenticatedUser = (req: Request): JwtPayload | undefined => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return undefined;
  }

  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch {
    return undefined;
  }
};

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const payload = tryGetAuthenticatedUser(req);
  if (!payload) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

export const superadminMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const payload = tryGetAuthenticatedUser(req);
  if (!payload) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await userManagementService.getUserById(payload.userId).catch(() => null);
  const isRoleSuperadmin = Boolean(user?.roles?.includes("superadmin"));

  if (!isSuperadminEmail(payload.email) && !isRoleSuperadmin) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  req.user = payload;
  next();
};

