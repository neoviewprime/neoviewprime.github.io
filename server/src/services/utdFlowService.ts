import { randomUUID } from "crypto";
import { isCoelbaUtdHierarchy } from "../data/coelbaHierarchyRules";
import { DbClient, getDbClient } from "../db/connection";
import { fromDbJson } from "../db/providerUtils";

type UtdHierarchy = {
  companyId?: string | null;
  superintendenceId?: string | null;
  managementId?: string | null;
  projectId?: string | null;
};

type UtdDraftInput = UtdHierarchy & {
  userId: string;
  reportName?: string | null;
  reportDescription?: string | null;
  reportUrl?: string | null;
  reportDate?: string | null;
  indicatorsText?: string | null;
  payload?: Record<string, unknown> | null;
};

type UtdSubmittedReportInput = UtdHierarchy & {
  reportCatalogId: string;
  reportSubmissionId: string;
  sourceReportId: string;
  projectName?: string | null;
  reportName: string;
  reportStatus: string;
  submittedBy?: string | null;
  approverUserId?: string | null;
  approverName?: string | null;
  approvalMode: "direct_publish" | "approval_queue";
  path: string[];
  payload: Record<string, unknown>;
};

const isUtdHierarchy = (input: UtdHierarchy) =>
  isCoelbaUtdHierarchy({
    companyId: input.companyId,
    superintendenceId: input.superintendenceId,
    managementId: input.managementId,
  });

export const utdFlowService = {
  isUtdHierarchy,

  async upsertDraft(input: UtdDraftInput & { db?: DbClient }) {
    if (!isUtdHierarchy(input)) return false;

    const db = input.db ?? await getDbClient();
    await db.query(
      `INSERT INTO utd_submission_drafts (
        id,
        user_id,
        company_id,
        superintendence_id,
        management_id,
        project_id,
        report_name,
        report_description,
        report_url,
        report_date,
        indicators_text,
        payload,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
      )
      ON CONFLICT(user_id, project_id) DO UPDATE SET
        company_id = excluded.company_id,
        superintendence_id = excluded.superintendence_id,
        management_id = excluded.management_id,
        report_name = excluded.report_name,
        report_description = excluded.report_description,
        report_url = excluded.report_url,
        report_date = excluded.report_date,
        indicators_text = excluded.indicators_text,
        payload = excluded.payload,
        updated_at = NOW()`,
      [
        randomUUID(),
        input.userId,
        input.companyId ?? null,
        input.superintendenceId ?? null,
        input.managementId ?? null,
        input.projectId ?? null,
        input.reportName ?? null,
        input.reportDescription ?? null,
        input.reportUrl ?? null,
        input.reportDate ?? null,
        input.indicatorsText ?? null,
        JSON.stringify(input.payload ?? {}),
      ]
    );

    return true;
  },

  async deleteDraft(input: { userId: string; projectId?: string | null; db?: DbClient }) {
    if (!input.projectId) return false;
    const db = input.db ?? await getDbClient();
    await db.query(`DELETE FROM utd_submission_drafts WHERE user_id = $1 AND project_id = $2`, [
      input.userId,
      input.projectId,
    ]);
    return true;
  },

  async getDraft(input: { userId: string; projectId?: string | null }) {
    if (!input.projectId) return null;
    const db = await getDbClient();
    const result = await db.query<{
      id: string;
      report_name: string | null;
      report_description: string | null;
      report_url: string | null;
      report_date: string | null;
      indicators_text: string | null;
      payload: unknown;
      updated_at: string;
    }>(
      `SELECT id, report_name, report_description, report_url, report_date, indicators_text, payload, updated_at
         FROM utd_submission_drafts
        WHERE user_id = $1 AND project_id = $2
        LIMIT 1`,
      [input.userId, input.projectId]
    );

    const row = result.rows[0];
    if (!row) return null;

    return {
      id: row.id,
      reportName: row.report_name ?? "",
      reportDescription: row.report_description ?? "",
      reportUrl: row.report_url ?? "",
      reportDate: row.report_date ?? "",
      indicatorsText: row.indicators_text ?? "",
      payload: fromDbJson<Record<string, unknown>>(row.payload, {}),
      updatedAt: row.updated_at,
    };
  },

  async registerSubmittedReport(input: UtdSubmittedReportInput & { db?: DbClient }) {
    if (!isUtdHierarchy(input)) return false;

    const db = input.db ?? await getDbClient();
    await db.query(
      `INSERT INTO utd_flow_reports (
        id,
        report_catalog_id,
        report_submission_id,
        source_report_id,
        company_id,
        superintendence_id,
        management_id,
        project_id,
        attribute_name,
        report_name,
        report_status,
        submitted_by,
        approver_user_id,
        approver_name,
        approval_mode,
        storage_path,
        payload,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW()
      )
      ON CONFLICT(report_catalog_id) DO UPDATE SET
        report_submission_id = excluded.report_submission_id,
        source_report_id = excluded.source_report_id,
        company_id = excluded.company_id,
        superintendence_id = excluded.superintendence_id,
        management_id = excluded.management_id,
        project_id = excluded.project_id,
        attribute_name = excluded.attribute_name,
        report_name = excluded.report_name,
        report_status = excluded.report_status,
        submitted_by = excluded.submitted_by,
        approver_user_id = excluded.approver_user_id,
        approver_name = excluded.approver_name,
        approval_mode = excluded.approval_mode,
        storage_path = excluded.storage_path,
        payload = excluded.payload,
        updated_at = NOW()`,
      [
        randomUUID(),
        input.reportCatalogId,
        input.reportSubmissionId,
        input.sourceReportId,
        input.companyId ?? null,
        input.superintendenceId ?? null,
        input.managementId ?? null,
        input.projectId ?? null,
        input.projectName ?? null,
        input.reportName,
        input.reportStatus,
        input.submittedBy ?? null,
        input.approverUserId ?? null,
        input.approverName ?? null,
        input.approvalMode,
        JSON.stringify(input.path),
        JSON.stringify(input.payload),
      ]
    );

    return true;
  },

  async syncReportStatus(input: {
    reportCatalogId: string;
    reportStatus: string;
    approverUserId?: string | null;
    approverName?: string | null;
    db?: DbClient;
  }) {
    const db = input.db ?? await getDbClient();
    await db.query(
      `UPDATE utd_flow_reports
          SET report_status = $2,
              approver_user_id = COALESCE($3, approver_user_id),
              approver_name = COALESCE($4, approver_name),
              updated_at = NOW()
        WHERE report_catalog_id = $1`,
      [input.reportCatalogId, input.reportStatus, input.approverUserId ?? null, input.approverName ?? null]
    );
    return true;
  },
};

export default utdFlowService;
