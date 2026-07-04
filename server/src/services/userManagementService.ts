import { randomUUID } from "crypto";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getDbClient } from "../db/connection";
import {
  clearCorporateHierarchyChildren,
  COELBA_COMPANY_ID,
  COELBA_CORPORATE_SUPERINTENDENCE_ID,
  isCentralCorporateApprover,
  isCoelbaCorporateSuperintendenceId,
  normalizeCoelbaHierarchy,
  shouldHideCoelbaSuperintendenceFromActiveOptions,
} from "../data/coelbaHierarchyRules";
import { defaultHierarchyCatalog } from "../data/defaultHierarchyCatalog";
import { reportCatalogFileQueryService } from "./reportCatalogFileQueryService";

export const hierarchyJobTitles = [
  "Estagiario",
  "Analista",
  "Especialista",
  "Tecnico",
  "Supervisor",
  "Gerente",
  "Gestor",
  "Superintendente",
  "Diretor"
] as const;

export type HierarchyJobTitle = (typeof hierarchyJobTitles)[number];
export type AccessProfileCode = "admin" | "supervisor" | "analyst" | "viewer";
export type UserRoleCode = "superadmin" | AccessProfileCode;

const approvalJobTitles = new Set<HierarchyJobTitle>(["Gestor", "Gerente", "Superintendente", "Diretor"]);
const approvalRoutingPriority: Record<HierarchyJobTitle, number> = {
  Estagiario: 99,
  Analista: 99,
  Especialista: 99,
  Tecnico: 99,
  Supervisor: 99,
  Gestor: 1,
  Gerente: 2,
  Superintendente: 3,
  Diretor: 4
};

const userStatusSchema = z.enum(["active", "inactive"]);

export const userRegistrationSchema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  employeeId: z.string().min(2).max(80),
  password: z.string().min(8).max(120),
  companyId: z.string().min(1),
  companyName: z.string().min(1),
  superintendenceId: z.string().min(1),
  superintendenceName: z.string().min(1),
  managementId: z.string().optional().nullable(),
  managementName: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  projectName: z.string().optional().nullable(),
  jobTitle: z.enum(hierarchyJobTitles),
  managerUserId: z.string().uuid().optional().nullable(),
  accessProfile: z.enum(["admin", "supervisor", "analyst", "viewer"]).optional(),
  status: userStatusSchema,
  phone: z.string().optional().nullable()
}).superRefine((value, ctx) => {
  const normalized = clearCorporateHierarchyChildren({
    superintendenceId: value.superintendenceId,
    superintendenceName: value.superintendenceName,
    managementId: value.managementId ?? null,
    managementName: value.managementName ?? null,
    projectId: value.projectId ?? null,
    projectName: value.projectName ?? null,
  });

  const requiresFullHierarchy = !isCoelbaCorporateSuperintendenceId(normalized.superintendenceId);
  if (requiresFullHierarchy && !normalized.managementId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["managementId"],
      message: "Selecione a gerência.",
    });
  }

  if (requiresFullHierarchy && !normalized.projectId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["projectId"],
      message: "Selecione a unidade.",
    });
  }
});

type UserScope = {
  company_id?: string | null;
  superintendence_id?: string | null;
  management_id?: string | null;
  project_id?: string | null;
};

type UserRow = {
  id: string;
  email: string;
  name: string;
  employee_id: string | null;
  company_id: string | null;
  company_name: string | null;
  superintendence_id: string | null;
  superintendence_name: string | null;
  management_id: string | null;
  management_name: string | null;
  project_id: string | null;
  project_name: string | null;
  job_title: string | null;
  hierarchy_level: number | null;
  manager_user_id: string | null;
  approver_user_id: string | null;
  status: string | null;
  phone: string | null;
  department: string | null;
  created_at: string;
  updated_at: string;
};

let hierarchyColumnsEnsured = false;

const ensureUserHierarchyColumns = async (): Promise<void> => {
  if (hierarchyColumnsEnsured) return;

  hierarchyColumnsEnsured = true;
};

const jobTitleRank: Record<HierarchyJobTitle, number> = {
  Estagiario: 1,
  Analista: 2,
  Especialista: 3,
  Tecnico: 4,
  Supervisor: 5,
  Gerente: 6,
  Gestor: 7,
  Superintendente: 8,
  Diretor: 9
};

export const deriveAccessProfileRole = (jobTitle: HierarchyJobTitle): AccessProfileCode =>
  approvalJobTitles.has(jobTitle) ? "supervisor" : "analyst";

export const isApprovalJobTitle = (jobTitle?: string | null): boolean =>
  approvalJobTitles.has((jobTitle ?? "") as HierarchyJobTitle);

export const canDeleteReportsByJobTitle = (jobTitle?: string | null): boolean =>
  isApprovalJobTitle(jobTitle);

const normalizeHierarchyScope = (scope: UserScope): UserScope =>
  (() => {
    const normalized = clearCorporateHierarchyChildren(
      normalizeCoelbaHierarchy({
        companyId: scope.company_id ?? null,
        superintendenceId: scope.superintendence_id ?? null,
        managementId: scope.management_id ?? null,
        projectId: scope.project_id ?? null,
      })
    );

    return {
      company_id: normalized.companyId ?? null,
      superintendence_id: normalized.superintendenceId ?? null,
      management_id: normalized.managementId ?? null,
      project_id: normalized.projectId ?? null,
    };
  })();

const getScopeMatchScore = (base: UserScope, candidate: UserScope): number => {
  if (base.project_id && candidate.project_id === base.project_id) return 4;
  if (base.management_id && candidate.management_id === base.management_id) return 3;
  if (base.superintendence_id && candidate.superintendence_id === base.superintendence_id) return 2;
  if (base.company_id && candidate.company_id === base.company_id) return 1;
  return 0;
};

const mapUser = (row: UserRow) => ({
  ...(() => {
    const normalized = clearCorporateHierarchyChildren(
      normalizeCoelbaHierarchy({
        companyId: row.company_id ?? null,
        companyName: row.company_name ?? null,
        superintendenceId: row.superintendence_id ?? null,
        superintendenceName: row.superintendence_name ?? null,
        managementId: row.management_id ?? null,
        managementName: row.management_name ?? null,
        projectId: row.project_id ?? null,
        projectName: row.project_name ?? null,
      })
    );

    return {
      id: row.id,
      email: row.email,
      full_name: row.name,
      employee_id: row.employee_id ?? undefined,
      company_id: normalized.companyId ?? undefined,
      company_name: normalized.companyName ?? undefined,
      superintendence_id: normalized.superintendenceId ?? undefined,
      superintendence_name: normalized.superintendenceName ?? undefined,
      management_id: normalized.managementId ?? undefined,
      management_name: normalized.managementName ?? undefined,
      project_id: normalized.projectId ?? undefined,
      project_name: normalized.projectName ?? undefined,
      job_title: row.job_title ?? undefined,
      hierarchy_level: row.hierarchy_level ?? undefined,
      manager_user_id: row.manager_user_id ?? undefined,
      approver_user_id: row.approver_user_id ?? undefined,
      status: row.status ?? "active",
      can_approve: isApprovalJobTitle(row.job_title),
      department: row.department ?? normalized.managementName ?? normalized.superintendenceName ?? undefined,
      phone: row.phone ?? undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  })(),
});

const fetchUserRoleCodes = async (userId: string): Promise<UserRoleCode[]> => {
  await ensureUserHierarchyColumns();
  const db = await getDbClient();
  const result = await db.query<{ code: UserRoleCode }>(
    `SELECT r.code
     FROM user_roles ur
     INNER JOIN roles r ON r.id = ur.role_id
     WHERE ur.user_id = $1`,
    [userId]
  );
  return result.rows.map((row) => row.code);
};

const upsertUserRole = async (userId: string, roleCode: AccessProfileCode): Promise<void> => {
  await ensureUserHierarchyColumns();
  const db = await getDbClient();
  await db.query("DELETE FROM user_roles WHERE user_id = $1", [userId]);

  const role = await db.query<{ id: string }>("SELECT id FROM roles WHERE code = $1 LIMIT 1", [roleCode]);
  if (!role.rows[0]?.id) {
    throw new Error(`Role ${roleCode} not found`);
  }

  await db.query(
    "INSERT INTO user_roles (id, user_id, role_id) VALUES ($1, $2, $3)",
    [randomUUID(), userId, role.rows[0].id]
  );
};

const ensureUserRole = async (userId: string, roleCode: UserRoleCode): Promise<void> => {
  await ensureUserHierarchyColumns();
  const db = await getDbClient();
  const role = await db.query<{ id: string }>("SELECT id FROM roles WHERE code = $1 LIMIT 1", [roleCode]);
  if (!role.rows[0]?.id) {
    throw new Error(`Role ${roleCode} not found`);
  }

  const existing = await db.query<{ id: string }>(
    "SELECT id FROM user_roles WHERE user_id = $1 AND role_id = $2 LIMIT 1",
    [userId, role.rows[0].id]
  );
  if (existing.rows[0]?.id) return;

  await db.query("INSERT INTO user_roles (id, user_id, role_id) VALUES ($1, $2, $3)", [
    randomUUID(),
    userId,
    role.rows[0].id
  ]);
};

const fetchActiveUsersForScope = async (scope: UserScope, excludeUserId?: string): Promise<UserRow[]> => {
  await ensureUserHierarchyColumns();
  const normalizedScope = normalizeHierarchyScope(scope);
  const db = await getDbClient();
  const clauses = ["status = 'active'"];
  const params: unknown[] = [];

  if (normalizedScope.company_id) {
    params.push(normalizedScope.company_id);
    clauses.push(`company_id = $${params.length}`);
  }

  if (normalizedScope.superintendence_id) {
    params.push(normalizedScope.superintendence_id);
    clauses.push(`(superintendence_id = $${params.length} OR superintendence_id IS NULL)`);
  }

  if (normalizedScope.management_id) {
    params.push(normalizedScope.management_id);
    clauses.push(`(management_id = $${params.length} OR management_id IS NULL)`);
  }

  if (normalizedScope.project_id) {
    params.push(normalizedScope.project_id);
    clauses.push(`(project_id = $${params.length} OR project_id IS NULL)`);
  }

  if (excludeUserId) {
    params.push(excludeUserId);
    clauses.push(`id <> $${params.length}`);
  }

  const result = await db.query<UserRow>(
    `SELECT
      id, email, name, employee_id, company_id, company_name, superintendence_id, superintendence_name,
      management_id, management_name, project_id, project_name, job_title, hierarchy_level, manager_user_id,
      approver_user_id, status, phone, department, created_at, updated_at
     FROM users
     WHERE ${clauses.join(" AND ")}`,
    params
  );

  return result.rows;
};

const findApproverFromManagerChain = async (
  managerUserId: string | null | undefined,
  candidateMap: Map<string, UserRow>
): Promise<UserRow | null> => {
  let currentId = managerUserId ?? null;
  while (currentId) {
    const current = candidateMap.get(currentId);
    if (!current) return null;
    if (isApprovalJobTitle(current.job_title)) return current;
    currentId = current.manager_user_id;
  }
  return null;
};

export const resolveApproverCandidate = async (input: {
  userId?: string;
  jobTitle: HierarchyJobTitle;
  managerUserId?: string | null;
  companyId: string;
  superintendenceId: string;
  managementId?: string | null;
  projectId?: string | null;
}): Promise<UserRow | null> => {
  const sameScopeUsers = await fetchActiveUsersForScope(
    {
      company_id: input.companyId,
      superintendence_id: input.superintendenceId,
      management_id: input.managementId ?? null,
      project_id: input.projectId ?? null
    },
    input.userId
  );

  const byId = new Map(sameScopeUsers.map((user) => [user.id, user]));
  const managerResolved = await findApproverFromManagerChain(input.managerUserId, byId);
  if (managerResolved) return managerResolved;

  const currentRank = jobTitleRank[input.jobTitle];
  const approverCandidates = sameScopeUsers
    .filter((candidate) => isApprovalJobTitle(candidate.job_title))
    .filter((candidate) => {
      const candidateRank = jobTitleRank[(candidate.job_title ?? "Estagiario") as HierarchyJobTitle] ?? 0;
      return candidateRank > currentRank;
    })
    .sort((left, right) => {
      const scopeDelta =
        getScopeMatchScore(
          {
            company_id: input.companyId,
            superintendence_id: input.superintendenceId,
            management_id: input.managementId ?? null,
            project_id: input.projectId ?? null
          },
          left
        ) -
        getScopeMatchScore(
          {
            company_id: input.companyId,
            superintendence_id: input.superintendenceId,
            management_id: input.managementId ?? null,
            project_id: input.projectId ?? null
          },
          right
        );
      if (scopeDelta !== 0) return scopeDelta * -1;
      const leftRank = jobTitleRank[(left.job_title ?? "Estagiario") as HierarchyJobTitle] ?? 0;
      const rightRank = jobTitleRank[(right.job_title ?? "Estagiario") as HierarchyJobTitle] ?? 0;
      const leftPriority = approvalRoutingPriority[(left.job_title ?? "Diretor") as HierarchyJobTitle] ?? 99;
      const rightPriority = approvalRoutingPriority[(right.job_title ?? "Diretor") as HierarchyJobTitle] ?? 99;
      return leftPriority - rightPriority || leftRank - rightRank || left.name.localeCompare(right.name);
    });

  return approverCandidates[0] ?? null;
};

export const resolveApproverByHierarchy = async (input: {
  companyId: string;
  superintendenceId: string;
  managementId?: string | null;
  projectId?: string | null;
}): Promise<UserRow | null> => {
  const sameScopeUsers = await fetchActiveUsersForScope({
    company_id: input.companyId,
    superintendence_id: input.superintendenceId,
    management_id: input.managementId ?? null,
    project_id: input.projectId ?? null
  });

  return sameScopeUsers
    .filter((candidate) => isApprovalJobTitle(candidate.job_title))
    .sort((left, right) => {
      const leftScope = getScopeMatchScore(
        {
          company_id: input.companyId,
          superintendence_id: input.superintendenceId,
          management_id: input.managementId ?? null,
          project_id: input.projectId ?? null
        },
        left
      );
      const rightScope = getScopeMatchScore(
        {
          company_id: input.companyId,
          superintendence_id: input.superintendenceId,
          management_id: input.managementId ?? null,
          project_id: input.projectId ?? null
        },
        right
      );

      if (leftScope !== rightScope) return rightScope - leftScope;

      const leftRank = jobTitleRank[(left.job_title ?? "Diretor") as HierarchyJobTitle] ?? 99;
      const rightRank = jobTitleRank[(right.job_title ?? "Diretor") as HierarchyJobTitle] ?? 99;
      return leftRank - rightRank || left.name.localeCompare(right.name);
    })[0] ?? null;
};

export const userManagementService = {
  async listHierarchyOptions() {
    await ensureUserHierarchyColumns();
    const companies = new Map<
      string,
      {
        id: string;
        name: string;
        superintendences: Map<
          string,
          {
            id: string;
            name: string;
            managements: Map<string, { id: string; name: string; projects: Array<{ id: string; name: string }> }>;
          }
        >;
      }
    >();

    const registerHierarchyRow = (row: {
      company_id: string;
      company_name: string;
      superintendence_id: string;
      superintendence_name: string;
      management_id: string;
      management_name: string;
      project_id: string;
      project_name: string;
    }) => {
      const normalizedRow = clearCorporateHierarchyChildren(
        normalizeCoelbaHierarchy({
          companyId: row.company_id,
          companyName: row.company_name,
          superintendenceId: row.superintendence_id,
          superintendenceName: row.superintendence_name,
          managementId: row.management_id,
          managementName: row.management_name,
          projectId: row.project_id,
          projectName: row.project_name,
        })
      );

      if (
        shouldHideCoelbaSuperintendenceFromActiveOptions({
          companyId: normalizedRow.companyId,
          superintendenceId: normalizedRow.superintendenceId,
          superintendenceName: normalizedRow.superintendenceName,
        })
      ) {
        return;
      }

      const company = companies.get(normalizedRow.companyId ?? row.company_id) ?? {
        id: normalizedRow.companyId ?? row.company_id,
        name: normalizedRow.companyName ?? row.company_name,
        superintendences: new Map()
      };
      companies.set(company.id, company);

      const superintendenceId = normalizedRow.superintendenceId ?? row.superintendence_id;
      const superintendence = company.superintendences.get(superintendenceId) ?? {
        id: superintendenceId,
        name: normalizedRow.superintendenceName ?? row.superintendence_name,
        managements: new Map<string, { id: string; name: string; projects: Array<{ id: string; name: string }> }>()
      };
      company.superintendences.set(superintendence.id, superintendence);

      const managementId = normalizedRow.managementId ?? null;
      const projectId = normalizedRow.projectId ?? null;
      if (!managementId || !projectId) {
        return;
      }

      const management = superintendence.managements.get(managementId) ?? {
        id: managementId,
        name: normalizedRow.managementName ?? row.management_name,
        projects: [] as Array<{ id: string; name: string }>
      };
      superintendence.managements.set(management.id, management);

      if (!management.projects.some((project: { id: string; name: string }) => project.id === projectId)) {
        management.projects.push({ id: projectId, name: normalizedRow.projectName ?? row.project_name });
      }
    };

    defaultHierarchyCatalog.forEach((company) => {
      const companyEntry = companies.get(company.id) ?? {
        id: company.id,
        name: company.name,
        superintendences: new Map()
      };
      companies.set(company.id, companyEntry);

      company.superintendences.forEach((superintendence) => {
        const superintendenceEntry = companyEntry.superintendences.get(superintendence.id) ?? {
          id: superintendence.id,
          name: superintendence.name,
          managements: new Map<string, { id: string; name: string; projects: Array<{ id: string; name: string }> }>()
        };
        companyEntry.superintendences.set(superintendence.id, superintendenceEntry);

        superintendence.managements.forEach((management) => {
          const managementEntry = superintendenceEntry.managements.get(management.id) ?? {
            id: management.id,
            name: management.name,
            projects: [] as Array<{ id: string; name: string }>
          };
          superintendenceEntry.managements.set(management.id, managementEntry);

          management.projects.forEach((project) => {
            if (
              !managementEntry.projects.some(
                (existingProject: { id: string; name: string }) => existingProject.id === project.id
              )
            ) {
              managementEntry.projects.push({ id: project.id, name: project.name });
            }
          });
        });
      });
    });

    try {
      const db = await getDbClient();
      const result = await db.query<{
        company_id: string;
        company_name: string;
        superintendence_id: string;
        superintendence_name: string;
        management_id: string;
        management_name: string;
        project_id: string;
        project_name: string;
      }>(
        `SELECT DISTINCT
          company_id,
          company_name,
          superintendence_id,
          superintendence_name,
          management_id,
          management_name,
          project_id,
          project_name
         FROM report_catalog
         ORDER BY company_name, superintendence_name, management_name, project_name`
      );

      result.rows.forEach(registerHierarchyRow);
    } catch {
      const docs = await reportCatalogFileQueryService.listAll();
      docs.forEach((doc) =>
        registerHierarchyRow({
          company_id: doc.hierarchy.company.id,
          company_name: doc.hierarchy.company.name,
          superintendence_id: doc.hierarchy.superintendence.id,
          superintendence_name: doc.hierarchy.superintendence.name,
          management_id: doc.hierarchy.management.id,
          management_name: doc.hierarchy.management.name,
          project_id: doc.hierarchy.project.id,
          project_name: doc.hierarchy.project.name
        })
      );
    }

    return {
      jobTitles: [...hierarchyJobTitles],
      approvalJobTitles: [...approvalJobTitles],
      accessProfiles: [
        { code: "admin", label: "Administrador" },
        { code: "supervisor", label: "Aprovador" },
        { code: "analyst", label: "Analista" },
        { code: "viewer", label: "Visualizador" }
      ],
      companies: Array.from(companies.values())
        .sort((left, right) => left.name.localeCompare(right.name))
        .map((company) => ({
        id: company.id,
        name: company.name,
        superintendences: Array.from(company.superintendences.values())
          .sort((left, right) => left.name.localeCompare(right.name))
          .map((superintendence) => ({
          id: superintendence.id,
          name: superintendence.name,
          managements: Array.from(superintendence.managements.values())
            .sort((left, right) => left.name.localeCompare(right.name))
            .map((management) => ({
            id: management.id,
            name: management.name,
            projects: [...management.projects].sort((left, right) => left.name.localeCompare(right.name))
          }))
        }))
      }))
    };
  },

  async listUsers(filters?: {
    companyId?: string;
    superintendenceId?: string;
    managementId?: string;
    projectId?: string;
    approvalOnly?: boolean;
    activeOnly?: boolean;
  }) {
    await ensureUserHierarchyColumns();
    const db = await getDbClient();
    const clauses: string[] = [];
    const params: unknown[] = [];

    if (filters?.companyId) {
      params.push(filters.companyId);
      clauses.push(`company_id = $${params.length}`);
    }

    if (filters?.superintendenceId) {
      params.push(filters.superintendenceId);
      clauses.push(`superintendence_id = $${params.length}`);
    }

    if (filters?.managementId) {
      params.push(filters.managementId);
      clauses.push(`management_id = $${params.length}`);
    }

    if (filters?.projectId) {
      params.push(filters.projectId);
      clauses.push(`project_id = $${params.length}`);
    }

    if (filters?.activeOnly !== false) {
      params.push("active");
      clauses.push(`status = $${params.length}`);
    }

    const result = await db.query<UserRow>(
      `SELECT
        id, email, name, employee_id, company_id, company_name, superintendence_id, superintendence_name,
        management_id, management_name, project_id, project_name, job_title, hierarchy_level, manager_user_id,
        approver_user_id, status, phone, department, created_at, updated_at
       FROM users
       ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""}
       ORDER BY name ASC`,
      params
    );

    const users = await Promise.all(
      result.rows.map(async (row) => ({
        ...mapUser(row),
        roles: await fetchUserRoleCodes(row.id)
      }))
    );

    return filters?.approvalOnly ? users.filter((user) => user.can_approve) : users;
  },

  async getUserById(userId: string) {
    await ensureUserHierarchyColumns();
    const db = await getDbClient();
    const result = await db.query<UserRow>(
      `SELECT
        id, email, name, employee_id, company_id, company_name, superintendence_id, superintendence_name,
        management_id, management_name, project_id, project_name, job_title, hierarchy_level, manager_user_id,
        approver_user_id, status, phone, department, created_at, updated_at
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [userId]
    );
    const row = result.rows[0];
    if (!row) return null;

    return {
      ...mapUser(row),
      roles: await fetchUserRoleCodes(row.id)
    };
  },

  async createUser(payload: unknown) {
    await ensureUserHierarchyColumns();
    const parsed = clearCorporateHierarchyChildren(
      normalizeCoelbaHierarchy(userRegistrationSchema.parse(payload))
    );
    const db = await getDbClient();

    const existing = await db.query<{ id: string }>(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1) OR employee_id = $2 LIMIT 1",
      [parsed.email, parsed.employeeId]
    );
    if (existing.rows[0]?.id) {
      throw new Error("Já existe um usuário com este e-mail ou matrícula.");
    }

    const derivedRoleCode = deriveAccessProfileRole(parsed.jobTitle);
    const approver = approvalJobTitles.has(parsed.jobTitle)
      ? null
      : await resolveApproverCandidate({
          jobTitle: parsed.jobTitle,
          managerUserId: parsed.managerUserId,
          companyId: parsed.companyId,
          superintendenceId: parsed.superintendenceId,
          managementId: parsed.managementId ?? null,
          projectId: parsed.projectId ?? null
        });

    const userId = randomUUID();
    const passwordHash = await bcrypt.hash(parsed.password, 10);
    await db.query(
      `INSERT INTO users (
        id, email, name, employee_id, company_id, company_name, superintendence_id, superintendence_name,
        management_id, management_name, project_id, project_name, job_title, hierarchy_level, manager_user_id,
        approver_user_id, status, phone, department, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, NOW(), NOW()
      )`,
      [
        userId,
        parsed.email.toLowerCase(),
        parsed.fullName,
        parsed.employeeId,
        parsed.companyId,
        parsed.companyName,
        parsed.superintendenceId,
        parsed.superintendenceName,
        parsed.managementId ?? null,
        parsed.managementName ?? null,
        parsed.projectId ?? null,
        parsed.projectName ?? null,
        parsed.jobTitle,
        jobTitleRank[parsed.jobTitle],
        parsed.managerUserId ?? null,
        approver?.id ?? null,
        parsed.status,
        parsed.phone ?? null,
        null
      ]
    );
    await db.query(
      `INSERT INTO user_credentials (user_id, password_hash, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())`,
      [userId, passwordHash]
    );

    await upsertUserRole(userId, derivedRoleCode);

    return {
      id: userId,
      approver: approver
        ? {
            id: approver.id,
            name: approver.name,
            jobTitle: approver.job_title
          }
        : null
    };
  },

  async resolveApproverForUser(userId?: string | null) {
    if (!userId) return null;
    const user = await this.getUserById(userId);
    if (!user?.approver_user_id) return null;
    const approver = await this.getUserById(user.approver_user_id);
    return approver
      ? {
          id: approver.id,
          name: approver.full_name,
          email: approver.email,
          jobTitle: approver.job_title
        }
      : null;
  },

  async resolveApproverForHierarchy(input: {
    companyId: string;
    superintendenceId: string;
    managementId?: string | null;
    projectId?: string | null;
  }) {
    const normalizedInput = clearCorporateHierarchyChildren(normalizeCoelbaHierarchy(input));
    const approver = await resolveApproverByHierarchy(normalizedInput);

    const resolvedApprover = approver
      ? {
          id: approver.id,
          email: approver.email,
          job_title: approver.job_title ?? undefined,
          name: approver.name
        }
      : null;

    return resolvedApprover
      ? {
          id: resolvedApprover.id,
          name: resolvedApprover.name,
          email: resolvedApprover.email,
          jobTitle: resolvedApprover.job_title
        }
      : null;
  },

  async listSuperadminUsers() {
    const db = await getDbClient();
    const result = await db.query<UserRow>(
      `SELECT
        u.id, u.email, u.name, u.employee_id, u.company_id, u.company_name, u.superintendence_id, u.superintendence_name,
        u.management_id, u.management_name, u.project_id, u.project_name, u.job_title, u.hierarchy_level, u.manager_user_id,
        u.approver_user_id, u.status, u.phone, u.department, u.created_at, u.updated_at
       FROM users u
       INNER JOIN user_roles ur ON ur.user_id = u.id
       INNER JOIN roles r ON r.id = ur.role_id
       WHERE r.code = 'superadmin'
         AND COALESCE(u.status, 'active') = 'active'
       ORDER BY u.name ASC`
    );

    return Promise.all(
      result.rows.map(async (row) => ({
        ...mapUser(row),
        roles: await fetchUserRoleCodes(row.id),
      }))
    );
  },

  async listCentralCorporateApprovers(companyId = COELBA_COMPANY_ID) {
    const users = await this.listUsers({
      companyId,
      superintendenceId: COELBA_CORPORATE_SUPERINTENDENCE_ID,
      approvalOnly: true,
      activeOnly: true,
    });

    return users.filter((user) => isCentralCorporateApprover(user));
  },

  async updatePassword(input: { userId: string; currentPassword: string; newPassword: string }) {
    await ensureUserHierarchyColumns();
    const db = await getDbClient();
    const credentials = await db.query<{ password_hash: string }>(
      "SELECT password_hash FROM user_credentials WHERE user_id = $1 LIMIT 1",
      [input.userId]
    );

    const currentHash = credentials.rows[0]?.password_hash;
    if (!currentHash) {
      throw new Error("Credencial de acesso não configurada para este usuário.");
    }

    const passwordMatches = await bcrypt.compare(input.currentPassword, currentHash);
    if (!passwordMatches) {
      throw new Error("A senha atual informada esta incorreta.");
    }

    const nextHash = await bcrypt.hash(input.newPassword, 10);
    await db.query(
      `UPDATE user_credentials
       SET password_hash = $2, updated_at = NOW()
       WHERE user_id = $1`,
      [input.userId, nextHash]
    );

    return { success: true };
  },

  async updateOwnProfile(
    userId: string,
    input: { full_name?: string; department?: string | null; phone?: string | null }
  ) {
    await ensureUserHierarchyColumns();
    const db = await getDbClient();
    const current = await this.getUserById(userId);
    if (!current) {
      throw new Error("Usuario nao encontrado.");
    }

    await db.query(
      `UPDATE users
       SET
         name = $2,
         department = $3,
         phone = $4,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [
        userId,
        input.full_name?.trim() || current.full_name,
        input.department === undefined ? (current.department ?? null) : input.department?.trim() || null,
        input.phone === undefined ? (current.phone ?? null) : input.phone?.trim() || null
      ]
    );

    return this.getUserById(userId);
  },

  async ensureUserRole(userId: string, roleCode: UserRoleCode) {
    await ensureUserRole(userId, roleCode);
  }
};
