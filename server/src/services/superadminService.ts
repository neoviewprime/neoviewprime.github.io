import path from "node:path";
import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { getDbClient } from "../db/connection";
import { reportCatalogService } from "./reportCatalogService";
import { reportCatalogFileQueryService } from "./reportCatalogFileQueryService";
import { reportJsonFileService } from "./reportJsonFileService";
import { userManagementService } from "./userManagementService";

export const SUPERADMIN_EMAILS = [
  "joao.paes@neoenergia.com",
  "gabriel.nogueira@neoenergia.com"
] as const;

export const DEFAULT_SUPERADMIN_PASSWORD = "neoview2026";

export const isSuperadminEmail = (email?: string | null): boolean =>
  Boolean(email && SUPERADMIN_EMAILS.includes(email.trim().toLowerCase() as (typeof SUPERADMIN_EMAILS)[number]));

const buildDisplayName = (email: string): string => {
  const localPart = email.split("@")[0] ?? "superadmin";
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
};

const GENERATED_REPORT_PREFIXES = ["manual-", "demo-pending-"];
const GENERATED_REPORTS_DIR = path.resolve(process.cwd(), "data/reports/catalog");

const listFilesRecursive = async (dir: string): Promise<string[]> => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return listFilesRecursive(fullPath);
      return [fullPath];
    })
  );
  return files.flat();
};

export const deleteGeneratedCatalogFiles = async (): Promise<number> => {
  try {
    const files = await listFilesRecursive(GENERATED_REPORTS_DIR);
    const targets = files.filter((file) => {
      const base = path.basename(file);
      return GENERATED_REPORT_PREFIXES.some((prefix) => base.startsWith(prefix));
    });

    await Promise.all(targets.map((file) => fs.unlink(file)));
    return targets.length;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return 0;
    throw error;
  }
};

export const superadminService = {
  async ensureDefaultSuperadmins() {
    const db = await getDbClient();
    const passwordHash = await bcrypt.hash(DEFAULT_SUPERADMIN_PASSWORD, 10);

    for (const email of SUPERADMIN_EMAILS) {
      const existing = await db.query<{ id: string }>("SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1", [email]);
      const userId = existing.rows[0]?.id ?? randomUUID();

      if (!existing.rows[0]?.id) {
        await db.query(
          `INSERT INTO users (
            id, email, name, job_title, hierarchy_level, status, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, 'active', NOW(), NOW()
          )`,
          [userId, email, buildDisplayName(email), "Diretor", 9]
        );
      }

      const credentials = await db.query<{ user_id: string }>(
        "SELECT user_id FROM user_credentials WHERE user_id = $1 LIMIT 1",
        [userId]
      );
      if (!credentials.rows[0]?.user_id) {
        await db.query(
          `INSERT INTO user_credentials (user_id, password_hash, created_at, updated_at)
           VALUES ($1, $2, NOW(), NOW())`,
          [userId, passwordHash]
        );
      }

      await userManagementService.ensureUserRole(userId, "superadmin");
    }
  },

  async ensureAuditLogTable() {
    const db = await getDbClient();
    try {
      await db.query("SELECT id FROM audit_logs LIMIT 1");
    } catch {
      await db.query(
        `CREATE COLUMN TABLE audit_logs (
          id NVARCHAR(36) PRIMARY KEY,
          user_id NVARCHAR(36),
          action NVARCHAR(40) NOT NULL,
          entity_type NVARCHAR(120) NOT NULL,
          entity_id NVARCHAR(255),
          old_values NCLOB,
          new_values NCLOB,
          ip_address NVARCHAR(80),
          user_agent NCLOB,
          created_at TIMESTAMP DEFAULT CURRENT_UTCTIMESTAMP
        )`
      );
      await db.query(`CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at)`);
      await db.query(`CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id)`);
    }
  },

  async logAudit(input: {
    userId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    oldValues?: Record<string, unknown> | null;
    newValues?: Record<string, unknown> | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    await this.ensureAuditLogTable();
    const db = await getDbClient();
    await db.query(
      `INSERT INTO audit_logs (
        id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        randomUUID(),
        input.userId ?? null,
        input.action,
        input.entityType,
        input.entityId ?? null,
        input.oldValues ? JSON.stringify(input.oldValues) : null,
        input.newValues ? JSON.stringify(input.newValues) : null,
        input.ipAddress ?? null,
        input.userAgent ?? null
      ]
    );
  },

  async resetBackendDataOnly() {
    const db = await getDbClient();
    const statements = [
      "DELETE FROM auth_sessions",
      "DELETE FROM chat_messages",
      "DELETE FROM chat_sessions",
      "DELETE FROM report_share_monitoring",
      "DELETE FROM report_shares",
      "DELETE FROM report_likes",
      "DELETE FROM report_comments",
      "DELETE FROM report_engagement_events",
      "DELETE FROM report_approvals",
      "DELETE FROM report_submissions",
      "DELETE FROM report_engagement_metrics",
      "DELETE FROM report_chunks",
      "DELETE FROM semantic_cache",
      "DELETE FROM reports",
      "DELETE FROM report_catalog",
    ];

    for (const statement of statements) {
      await db.query(statement);
    }

    const removedFiles = await deleteGeneratedCatalogFiles();
    const sync = await reportCatalogService.syncCatalogFilesToDatabase();
    const demoPending = await reportCatalogService.ensureDemoPendingReports();
    reportCatalogFileQueryService.invalidateCache();
    reportCatalogService.invalidateLookupCaches?.();

    return {
      removedFiles,
      syncedCatalog: sync.upserted,
      deletedCatalog: sync.deleted,
      demoPending: demoPending.created
    };
  },

  async deleteReportByCatalogId(reportId: string) {
    const db = await getDbClient();
    const existing = await db.query<{ id: string; source_report_id: string; report_name: string }>(
      "SELECT id, source_report_id, report_name FROM report_catalog WHERE id = $1 LIMIT 1",
      [reportId]
    );
    const row = existing.rows[0];
    if (!row) throw new Error("Report not found");

    await db.query("DELETE FROM report_share_monitoring WHERE report_catalog_id = $1", [reportId]);
    await db.query("DELETE FROM report_shares WHERE report_catalog_id = $1", [reportId]);
    await db.query("DELETE FROM report_likes WHERE report_catalog_id = $1", [reportId]);
    await db.query("DELETE FROM report_comments WHERE report_catalog_id = $1", [reportId]);
    await db.query("DELETE FROM report_engagement_events WHERE report_catalog_id = $1", [reportId]);
    await db.query("DELETE FROM report_engagement_metrics WHERE report_catalog_id = $1", [reportId]);
    await db.query("DELETE FROM report_approvals WHERE report_id = $1", [reportId]);
    await db.query("DELETE FROM report_submissions WHERE report_catalog_id = $1", [reportId]);

    const relatedReports = await db.query<{ id: string }>(
      `SELECT id
       FROM reports
       WHERE report_catalog_id = $1
          OR source_report_id = $2
          OR original_filename = $3`,
      [reportId, row.source_report_id, row.report_name]
    );

    const relatedReportIds = relatedReports.rows.map((report) => report.id);
    for (const relatedReportId of relatedReportIds) {
      await db.query("DELETE FROM report_chunks WHERE report_id = $1", [relatedReportId]);
      await db.query("DELETE FROM reports WHERE id = $1", [relatedReportId]);
    }

    await db.query("DELETE FROM semantic_cache");
    await db.query("DELETE FROM report_catalog WHERE id = $1", [reportId]);
    const deletedFiles = await reportJsonFileService.deleteReportJson(row.source_report_id, row.report_name);
    reportCatalogFileQueryService.invalidateCache();
    reportCatalogService.invalidateLookupCaches?.();

    return { ...row, deleted_files: deletedFiles };
  },

  async bulkDeleteReports(input: { reportIds?: string[]; companyId?: string; status?: string }) {
    const db = await getDbClient();
    const clauses: string[] = [];
    const params: unknown[] = [];

    if (input.reportIds?.length) {
      const placeholders = input.reportIds.map((_, index) => `$${params.length + index + 1}`);
      params.push(...input.reportIds);
      clauses.push(`id IN (${placeholders.join(", ")})`);
    }
    if (input.companyId) {
      params.push(input.companyId);
      clauses.push(`company_id = $${params.length}`);
    }
    if (input.status) {
      params.push(input.status);
      clauses.push(`report_status = $${params.length}`);
    }
    if (!clauses.length) {
      throw new Error("Select reportIds, companyId or status to delete in bulk");
    }

    const found = await db.query<{ id: string }>(
      `SELECT id FROM report_catalog WHERE ${clauses.join(" AND ")}`,
      params
    );

    for (const row of found.rows) {
      await this.deleteReportByCatalogId(row.id);
    }

    return { deleted: found.rows.length };
  },

  async getOverview() {
    await this.ensureAuditLogTable();
    const db = await getDbClient();
    const [users, reports, approvals, chats] = await Promise.all([
      db.query<{ count: string }>("SELECT COUNT(*) AS count FROM users"),
      db.query<{ count: string }>("SELECT COUNT(*) AS count FROM report_catalog"),
      db.query<{ count: string }>("SELECT COUNT(*) AS count FROM report_approvals"),
      db.query<{ count: string }>("SELECT COUNT(*) AS count FROM chat_messages"),
    ]);

    return {
      users: Number(users.rows[0]?.count ?? 0),
      reports: Number(reports.rows[0]?.count ?? 0),
      approvals: Number(approvals.rows[0]?.count ?? 0),
      chatMessages: Number(chats.rows[0]?.count ?? 0),
      superadmins: [...SUPERADMIN_EMAILS]
    };
  },

  async listActivities(limit = 100) {
    await this.ensureAuditLogTable();
    const db = await getDbClient();
    const result = await db.query<{
      id: string;
      user_id: string | null;
      action: string;
      entity_type: string;
      entity_id: string | null;
      created_at: string;
      ip_address: string | null;
    }>(
      `SELECT id, user_id, action, entity_type, entity_id, created_at, ip_address
       FROM audit_logs
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  },

  async listReports(limit = 1000) {
    const db = await getDbClient();
    const result = await db.query<{
      id: string;
      source_report_id: string;
      report_status: string;
      report_name: string;
      report_date: string | null;
      company_name: string;
      superintendence_name: string;
      management_name: string;
      project_name: string;
      updated_at: string;
      created_at: string;
    }>(
      `SELECT id, source_report_id, report_status, report_name, report_date, company_name, superintendence_name, management_name, project_name, updated_at, created_at
       FROM report_catalog
       ORDER BY report_date DESC NULLS LAST, updated_at DESC, created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }
};
