import { randomUUID } from "crypto";
import { z } from "zod";
import { getDbClient } from "../db/connection";
import {
  clearCorporateHierarchyChildren,
  COELBA_COMPANY_ID,
  COELBA_CORPORATE_SUPERINTENDENCE_ID,
  isCoelbaUtdHierarchy,
  isCoelbaCompanyId,
  normalizeCoelbaHierarchy,
} from "../data/coelbaHierarchyRules";
import { fromDbArray, fromDbJson, readInsertedId, toDbArray } from "../db/providerUtils";
import { reportJsonFileService } from "./reportJsonFileService";
import { reportEngagementService } from "./reportEngagementService";
import { reportCatalogFileQueryService } from "./reportCatalogFileQueryService";
import { isApprovalJobTitle, userManagementService } from "./userManagementService";
import { approvalDelegationService } from "./approvalDelegationService";
import { notificationService } from "./notificationService";
import { utdFlowService } from "./utdFlowService";
import { logger } from "../utils/logger";
import { reportCatalogSemanticSyncService } from "./reportCatalogSemanticSyncService";

const indicatorInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  value: z.string().optional(),
  unit: z.string().optional(),
  trend: z.string().optional()
});

const BLOCKED_REPORT_URL_PROTOCOLS = new Set(["javascript:", "data:", "file:", "vbscript:"]);

const isAcceptedReportUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value.trim());
    return !BLOCKED_REPORT_URL_PROTOCOLS.has(parsed.protocol.toLowerCase());
  } catch {
    return false;
  }
};

export const reportSubmissionSchema = z.object({
  assetType: z.literal("hyperlink").optional().default("hyperlink"),
  reportName: z.string().min(2),
  reportDescription: z.string().optional().default(""),
  reportDate: z.string().optional(),
  reportSizeLabel: z.string().optional().default(""),
  reportUrl: z
    .string()
    .min(1, "O link do relatorio e obrigatorio.")
    .refine(isAcceptedReportUrl, "Informe um link externo válido."),
  companyId: z.string().min(1),
  companyName: z.string().min(1),
  superintendenceId: z.string().min(1),
  superintendenceName: z.string().min(1),
  managementId: z.string().optional().nullable(),
  managementName: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  projectName: z.string().optional().nullable(),
  submittedByName: z.string().optional(),
  submittedByEmail: z.string().optional(),
  indicators: z.array(indicatorInputSchema).min(1),
  metrics: z
    .object({
      views: z.number().int().nonnegative().default(0),
      comments: z.number().int().nonnegative().default(0),
      likes: z.number().int().nonnegative().default(0),
      shares: z.number().int().nonnegative().default(0)
    })
    .default({ views: 0, comments: 0, likes: 0, shares: 0 })
}).superRefine((value, ctx) => {
  const normalized = clearCorporateHierarchyChildren(
    normalizeCoelbaHierarchy({
      companyId: value.companyId,
      companyName: value.companyName,
      superintendenceId: value.superintendenceId,
      superintendenceName: value.superintendenceName,
      managementId: value.managementId ?? null,
      managementName: value.managementName ?? null,
      projectId: value.projectId ?? null,
      projectName: value.projectName ?? null,
    })
  );

  const requiresLowerHierarchy = normalized.superintendenceId !== COELBA_CORPORATE_SUPERINTENDENCE_ID;
  if (requiresLowerHierarchy && !normalized.managementId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["managementId"],
      message: "Selecione a gestão.",
    });
  }

  if (requiresLowerHierarchy && !normalized.projectId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["projectId"],
      message: "Selecione a unidade.",
    });
  }
});

const normalizeDate = (value?: string): string | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
};

const parseSizeToBytes = (sizeLabel: string): number => {
  const match = sizeLabel.trim().match(/^([\d.,]+)\s*(B|KB|MB|GB)$/i);
  if (!match) return 0;
  const value = Number(match[1].replace(",", "."));
  const unit = match[2].toUpperCase();
  const map: Record<string, number> = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
  return Number.isNaN(value) ? 0 : Math.round(value * (map[unit] ?? 1));
};

const normalizeLoose = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const buildFtsQuery = (value: string): string =>
  normalizeLoose(value)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((token) => `${token}*`)
    .join(" AND ");

const stopWords = new Set(["de", "da", "do", "das", "dos", "e", "em", "com", "para", "por", "a", "o", "as", "os"]);
const LOOKUP_CACHE_TTL_MS = 120_000;

const indicatorAcronym = (value: string): string =>
  normalizeLoose(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token && !stopWords.has(token))
    .map((token) => token[0])
    .join("");

const knownIndicatorAliases: Record<string, string[]> = {
  iar: ["iar", "i a r"],
  ipce: ["ipce", "i p c e"],
  dce: ["dce", "d c e"],
  dec: ["dec", "duracao equivalente por consumidor"],
  fec: ["fec", "frequencia equivalente por consumidor"],
  gd: ["gd", "geracao distribuida"],
  sla: ["sla", "nivel de servico", "service level agreement"],
  isqp: ["isqp", "indice de satisfacao", "indice de satisfacao com a qualidade percebida"],
  tma: ["tma", "tempo medio de atendimento"],
  mtbf: ["mtbf", "tempo medio entre falhas"],
  mttr: ["mttr", "tempo medio de reparo"]
};

const compactIndicatorValue = (value: string): string => normalizeLoose(value).replace(/[^a-z0-9]+/g, "");

const indicatorVariants = (value: string): Set<string> => {
  const normalized = normalizeLoose(value);
  const variants = new Set<string>([normalized, compactIndicatorValue(value)]);
  const acronym = indicatorAcronym(value);
  if (acronym) variants.add(acronym);

  Object.entries(knownIndicatorAliases).forEach(([canonical, aliases]) => {
    if (normalized === canonical || aliases.some((alias) => normalizeLoose(alias) === normalized)) {
      variants.add(canonical);
      aliases.forEach((alias) => {
        variants.add(normalizeLoose(alias));
        variants.add(compactIndicatorValue(alias));
      });
    }
  });

  return variants;
};

const indicatorMatchesTerm = (indicatorName: string, term: string): boolean => {
  const normalizedTerm = normalizeLoose(term);
  const compactTerm = compactIndicatorValue(term);
  const variants = indicatorVariants(indicatorName);
  return variants.has(normalizedTerm) || variants.has(compactTerm);
};

interface TimedLookupCache<T> {
  value: T;
  expiresAt: number;
}

let knownIndicatorsCache: TimedLookupCache<string[]> | null = null;
let knownCompaniesCache: TimedLookupCache<string[]> | null = null;

const readTimedCache = <T>(cache: TimedLookupCache<T> | null): T | null =>
  cache && cache.expiresAt > Date.now() ? cache.value : null;

const writeTimedCache = <T>(value: T): TimedLookupCache<T> => ({
  value,
  expiresAt: Date.now() + LOOKUP_CACHE_TTL_MS
});

type NormalizedSubmissionPayload = z.infer<typeof reportSubmissionSchema>;

type ApprovalRecipient = {
  id: string;
  name: string;
  email?: string;
  jobTitle?: string;
  kind: "corporate_approver" | "superadmin" | "hierarchy_approver";
};

const normalizeSubmissionPayload = (payload: z.infer<typeof reportSubmissionSchema>): NormalizedSubmissionPayload =>
  clearCorporateHierarchyChildren(normalizeCoelbaHierarchy(payload));

const buildReportPath = (payload: NormalizedSubmissionPayload): string[] =>
  [
    payload.companyName,
    payload.superintendenceName,
    payload.managementName ?? null,
    payload.projectName ?? null,
    payload.reportName,
  ].filter((value): value is string => Boolean(value));

const reportStatusPriority: Record<string, number> = {
  draft: 1,
  pending_approval: 2,
  rejected: 3,
  approved: 4,
};

const mergeCatalogStatus = (currentStatus?: string | null, incomingStatus?: string | null): string => {
  const current = String(currentStatus ?? "").trim() || "draft";
  const incoming = String(incomingStatus ?? "").trim() || "draft";
  return (reportStatusPriority[current] ?? 0) >= (reportStatusPriority[incoming] ?? 0) ? current : incoming;
};

const dedupeApprovalRecipients = (items: ApprovalRecipient[]): ApprovalRecipient[] => {
  const unique = new Map<string, ApprovalRecipient>();
  items.forEach((item) => {
    if (!item.id) return;
    if (!unique.has(item.id)) unique.set(item.id, item);
  });
  return Array.from(unique.values());
};

const resolveApprovalRecipients = async (input: {
  payload: NormalizedSubmissionPayload;
  userId?: string;
  submitter: Awaited<ReturnType<typeof userManagementService.getUserById>> | null;
}): Promise<ApprovalRecipient[]> => {
  if (isCoelbaCompanyId(input.payload.companyId)) {
    const [corporateApprovers, superadmins] = await Promise.all([
      userManagementService.listCentralCorporateApprovers(input.payload.companyId),
      userManagementService.listSuperadminUsers(),
    ]);

    return dedupeApprovalRecipients([
      ...corporateApprovers.map((user) => ({
        id: user.id,
        name: user.full_name,
        email: user.email,
        jobTitle: user.job_title,
        kind: "corporate_approver" as const,
      })),
      ...superadmins.map((user) => ({
        id: user.id,
        name: user.full_name,
        email: user.email,
        jobTitle: user.job_title,
        kind: "superadmin" as const,
      })),
    ]);
  }

  const hierarchyApprover =
    (await userManagementService.resolveApproverForUser(input.userId)) ??
    (await userManagementService.resolveApproverForHierarchy({
      companyId: input.payload.companyId,
      superintendenceId: input.payload.superintendenceId,
      managementId: input.payload.managementId ?? null,
      projectId: input.payload.projectId ?? null,
    }));

  return hierarchyApprover
    ? [
        {
          id: hierarchyApprover.id,
          name: hierarchyApprover.name,
          email: hierarchyApprover.email,
          jobTitle: hierarchyApprover.jobTitle,
          kind: "hierarchy_approver",
        },
      ]
    : [];
};

export const reportCatalogService = {
  invalidateLookupCaches(): void {
    knownIndicatorsCache = null;
    knownCompaniesCache = null;
    reportCatalogFileQueryService.invalidateCache();
  },

  async resolveSourceIdFromCatalogFiles(sourceId: string, reportName?: string): Promise<string | null> {
    const docs = await reportCatalogFileQueryService.listAll();
    const source = sourceId.trim();
    const name = (reportName ?? "").trim();
    const candidates = Array.from(
      new Set([
        source,
        `mock-${source}`,
        source.startsWith("mock-") ? source.slice(5) : source,
        source.startsWith("manual-") ? source.slice(7) : source
      ].filter(Boolean))
    );

    const bySource = docs.find((doc) => candidates.includes(String(doc.source_report_id)));
    if (bySource?.source_report_id) return bySource.source_report_id;

    if (name) {
      const normalizedName = normalizeLoose(name);
      const byName = docs.find((doc) => normalizeLoose(String(doc.report?.name ?? "")) === normalizedName);
      if (byName?.source_report_id) return byName.source_report_id;
      const looseByName = docs.find((doc) => normalizeLoose(String(doc.report?.name ?? "")).includes(normalizedName));
      if (looseByName?.source_report_id) return looseByName.source_report_id;
    }

    return null;
  },

  async resolveCatalogIdByReportName(reportName: string): Promise<string | null> {
    const db = await getDbClient();
    const cleaned = reportName.trim();
    if (!cleaned) return null;
    const exact = await db.query<{ id: string }>(
      "SELECT id FROM report_catalog WHERE LOWER(report_name) = LOWER($1) LIMIT 1",
      [cleaned]
    );
    if (exact.rows[0]?.id) return exact.rows[0].id;
    const loose = await db.query<{ id: string }>(
      "SELECT id FROM report_catalog WHERE LOWER(report_name) LIKE LOWER($1) ORDER BY updated_at DESC LIMIT 1",
      [`%${cleaned}%`]
    );
    if (loose.rows[0]?.id) return loose.rows[0].id;

    const all = await db.query<{ id: string; report_name: string }>(
      "SELECT id, report_name FROM report_catalog"
    );
    const target = normalizeLoose(cleaned);
    const matched = all.rows.find((row) => normalizeLoose(row.report_name ?? "") === target);
    return matched?.id ?? null;
  },

  async resolveCatalogIdBySourceId(sourceReportId: string): Promise<string | null> {
    const db = await getDbClient();
    const normalized = sourceReportId.trim();
    if (!normalized) return null;

    const candidates = Array.from(
      new Set([
        normalized,
        `mock-${normalized}`,
        normalized.startsWith("mock-") ? normalized.slice(5) : normalized,
        normalized.startsWith("manual-") ? normalized.slice(7) : normalized
      ])
    );

    for (const candidate of candidates) {
      const direct = await db.query<{ id: string }>(
        "SELECT id FROM report_catalog WHERE source_report_id = $1 LIMIT 1",
        [candidate]
      );
      if (direct.rows[0]?.id) return direct.rows[0].id;
    }

    const loose = await db.query<{ id: string }>(
      "SELECT id FROM report_catalog WHERE source_report_id LIKE $1 OR source_report_id LIKE $2 LIMIT 1",
      [`%${normalized}`, `%${candidates[0]}%`]
    );
    return loose.rows[0]?.id ?? null;
  },

  async submitReport(payload: unknown, userId?: string) {
    const parsed = normalizeSubmissionPayload(reportSubmissionSchema.parse(payload));
    const db = await getDbClient();
    const sourceReportId = `manual-${randomUUID()}`;
    const submittedDate = normalizeDate(parsed.reportDate) ?? new Date().toISOString().slice(0, 10);
    const indicatorNames = parsed.indicators.map((x) => x.name);
    const indicatorIds = parsed.indicators.map((x) => x.id ?? "");
    const primary = parsed.indicators[0];
    const path = buildReportPath(parsed);
    const submitter = userId ? await userManagementService.getUserById(userId) : null;
    const submitterCanApprove =
      Boolean(submitter?.roles?.includes("superadmin")) || isApprovalJobTitle(submitter?.job_title);
    const approvalRecipients = submitterCanApprove
      ? []
      : await resolveApprovalRecipients({
          payload: parsed,
          userId,
          submitter,
        });
    const primaryApprover = approvalRecipients[0] ?? null;
    const resolvedApprover = submitterCanApprove
      ? {
          id: submitter?.id ?? null,
          name: submitter?.full_name ?? parsed.submittedByName ?? "Aprovador NeoView",
          jobTitle: submitter?.job_title ?? "Gestor"
        }
      : primaryApprover
        ? {
            id: primaryApprover.id,
            name: primaryApprover.name,
            jobTitle: primaryApprover.jobTitle,
          }
        : null;

    if (userId && !submitter) {
      throw new Error("Usu\u00E1rio autenticado n\u00E3o encontrado para submiss\u00E3o do relat\u00F3rio.");
    }

    if (!submitterCanApprove && approvalRecipients.length === 0) {
      throw new Error("N\u00E3o foi encontrado aprovador ativo para a hierarquia selecionada do relat\u00F3rio.");
    }

    const initialStatus = submitterCanApprove ? "approved" : "pending_approval";

    {
      const notificationRecipients = new Map<string, { title: string; message: string }>();

      if (!submitterCanApprove) {
        for (const recipient of approvalRecipients) {
          const title =
            recipient.kind === "superadmin"
              ? "Nova aprovação pendente para supervisão"
              : recipient.kind === "corporate_approver"
                ? "Novo relatório pendente para aprovação"
                : "Novo relatório pendente para aprovação";
          const message =
            recipient.kind === "superadmin"
              ? `O relatório ${parsed.reportName} entrou em aprovação pendente e também está visível para a supervisão de superadmin.`
              : recipient.kind === "corporate_approver"
                ? `O relatório ${parsed.reportName} entrou em aprovação pendente para superintendências corporativas.`
                : `O relatório ${parsed.reportName} foi enviado para sua fila de aprovação.`;

          notificationRecipients.set(recipient.id, { title, message });

          if (recipient.kind === "hierarchy_approver") {
            const delegates = await approvalDelegationService.listActiveDelegatesForApprover(recipient.id);
            for (const delegation of delegates) {
              notificationRecipients.set(delegation.delegate_user_id, {
                title: 'Nova aprovação delegada para você',
                message: `${recipient.name} possui uma delegação ativa e o relatório ${parsed.reportName} entrou na fila que você pode tratar.`
              });
            }
          }
        }
      }

      let reportCatalogId: string = randomUUID();
      const reportSubmissionId = randomUUID();

      await db.transaction(async (tx) => {
        await tx.query(
          `INSERT INTO report_catalog (
            id, source_report_id, report_status, report_name, report_description, report_date, report_size_label, report_size_bytes, report_url,
            company_id, company_name, superintendence_id, superintendence_name, management_id, management_name,
            project_id, project_name, indicator_id, indicator_name, indicator_ids, indicator_names, indicator_value, indicator_unit, indicator_trend,
            metric_views, metric_comments, metric_likes, metric_shares, path, raw_json, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9,
            $10, $11, $12, $13, $14, $15,
            $16, $17, $18, $19, $20, $21, $22, $23, $24,
            $25, $26, $27, $28, $29, $30, NOW()
          )`,
          [
            reportCatalogId,
            sourceReportId,
            initialStatus,
            parsed.reportName,
            parsed.reportDescription,
            submittedDate,
            parsed.reportSizeLabel,
            parseSizeToBytes(parsed.reportSizeLabel),
            parsed.reportUrl ?? null,
            parsed.companyId,
            parsed.companyName,
            parsed.superintendenceId,
            parsed.superintendenceName,
            parsed.managementId ?? null,
            parsed.managementName ?? null,
            parsed.projectId ?? null,
            parsed.projectName ?? null,
            primary.id ?? "",
            primary.name,
            toDbArray(tx, indicatorIds),
            toDbArray(tx, indicatorNames),
            primary.value ?? "",
            primary.unit ?? "",
            primary.trend ?? "stable",
            parsed.metrics.views,
            parsed.metrics.comments,
            parsed.metrics.likes,
            parsed.metrics.shares,
            toDbArray(tx, path),
            JSON.stringify(parsed)
          ]
        );
        reportCatalogId =
          (await readInsertedId(tx, "report_catalog", "source_report_id", sourceReportId)) ?? reportCatalogId;

        await tx.query(
          `INSERT INTO report_submissions (id, report_catalog_id, submitted_by, approver_user_id, approver_name, approver_job_title, payload)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            reportSubmissionId,
            reportCatalogId,
            userId ?? null,
            submitterCanApprove ? submitter?.id ?? null : primaryApprover?.id ?? null,
            submitterCanApprove ? submitter?.full_name ?? null : primaryApprover?.name ?? null,
            submitterCanApprove ? submitter?.job_title ?? null : primaryApprover?.jobTitle ?? null,
            JSON.stringify({
              ...parsed,
              submittedByName: submitter?.full_name ?? parsed.submittedByName,
              submittedByEmail: submitter?.email ?? parsed.submittedByEmail,
              approverId: submitterCanApprove ? submitter?.id ?? null : primaryApprover?.id ?? null,
              approverName: submitterCanApprove ? submitter?.full_name ?? null : primaryApprover?.name ?? null,
              approverJobTitle: submitterCanApprove ? submitter?.job_title ?? null : primaryApprover?.jobTitle ?? null,
              approvalRecipients,
            })
          ]
        );

        if (
          isCoelbaUtdHierarchy({
            companyId: parsed.companyId,
            superintendenceId: parsed.superintendenceId,
            managementId: parsed.managementId,
          })
        ) {
          await utdFlowService.registerSubmittedReport({
            db: tx,
            reportCatalogId,
            reportSubmissionId,
            sourceReportId,
            companyId: parsed.companyId,
            superintendenceId: parsed.superintendenceId,
            managementId: parsed.managementId,
            projectId: parsed.projectId,
            projectName: parsed.projectName,
            reportName: parsed.reportName,
            reportStatus: initialStatus,
            submittedBy: userId ?? null,
            approverUserId: submitterCanApprove ? submitter?.id ?? null : primaryApprover?.id ?? null,
            approverName: submitterCanApprove ? submitter?.full_name ?? null : primaryApprover?.name ?? null,
            approvalMode: submitterCanApprove ? "direct_publish" : "approval_queue",
            path,
            payload: {
              ...parsed,
              sourceReportId,
              approvalRecipients,
              primaryApproverId: primaryApprover?.id ?? null,
              primaryApproverName: primaryApprover?.name ?? null,
            },
          });

          if (userId && parsed.projectId) {
            await utdFlowService.deleteDraft({
              db: tx,
              userId,
              projectId: parsed.projectId,
            });
          }
        }

        await reportEngagementService.upsertFromInitial(
          reportCatalogId,
          {
            views: parsed.metrics.views ?? 0,
            likes: parsed.metrics.likes ?? 0,
            comments: parsed.metrics.comments ?? 0,
            shares: parsed.metrics.shares ?? 0
          },
          tx
        );

        if (submitterCanApprove) {
          const decisionId = randomUUID();
          const approvedByName = submitter?.full_name ?? parsed.submittedByName ?? "Aprovador NeoView";
          await tx.query(
            `INSERT INTO report_approvals (
              id, report_id, approver_id, approver_name, status, comments, approved_at, report_name, destination_path, submitter_name, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, 'approved', $5, NOW(), $6, $7, $8, NOW(), NOW()
            )`,
            [
              decisionId,
              reportCatalogId,
              submitter?.id ?? userId ?? null,
              approvedByName,
              "Relat\u00F3rio publicado diretamente por usu\u00E1rio com al\u00E7ada de aprova\u00E7\u00E3o.",
              parsed.reportName,
              toDbArray(tx, path),
              approvedByName
            ]
          );
        } else if (notificationRecipients.size > 0) {
          await notificationService.createMany(
            Array.from(notificationRecipients.entries()).map(([recipientUserId, copy]) => ({
              db: tx,
              recipientUserId,
              type: 'approval_request',
              title: copy.title,
              message: copy.message,
              entityType: 'report_catalog',
              entityId: reportCatalogId,
              actionUrl: '/approvals',
              metadata: {
                reportCatalogId,
                reportName: parsed.reportName,
                sourceReportId,
                approvalRecipients,
                primaryApproverId: primaryApprover?.id ?? null,
                primaryApproverName: primaryApprover?.name ?? null,
              },
            }))
          );
        }
      });

      try {
        const fullPath = await reportJsonFileService.writeReportJson({
          sourceReportId,
          reportName: parsed.reportName,
          reportDescription: parsed.reportDescription,
          reportDate: submittedDate,
          reportSizeLabel: parsed.reportSizeLabel,
          reportSizeBytes: parseSizeToBytes(parsed.reportSizeLabel),
          reportUrl: parsed.reportUrl ?? null,
          companyId: parsed.companyId,
          companyName: parsed.companyName,
          superintendenceId: parsed.superintendenceId,
          superintendenceName: parsed.superintendenceName,
          managementId: parsed.managementId ?? undefined,
          managementName: parsed.managementName ?? undefined,
          projectId: parsed.projectId ?? undefined,
          projectName: parsed.projectName ?? undefined,
          indicators: parsed.indicators,
          metrics: parsed.metrics,
          path,
          reportStatus: initialStatus,
          rawJson: parsed as unknown as Record<string, unknown>
        });
        reportCatalogFileQueryService.invalidateCache();
        if (initialStatus === "approved") {
          await reportCatalogSemanticSyncService.syncCatalogDocumentFile({
            fullPath,
            reportCatalogId,
          });
        }
      } catch (error) {
        logger.warn("Report submitted but JSON materialization failed; startup rebuild will recover the catalog file", {
          sourceReportId,
          reportName: parsed.reportName,
          error: (error as Error).message,
        });
      }

      return {
        id: reportCatalogId,
        sourceReportId,
        status: initialStatus,
        approver: resolvedApprover
          ? {
              id: resolvedApprover.id,
              name: resolvedApprover.name,
              jobTitle: resolvedApprover.jobTitle
            }
          : null
      };
    }

    let reportCatalogId: string = randomUUID();
    await db.query(
      `INSERT INTO report_catalog (
        id, source_report_id, report_status, report_name, report_description, report_date, report_size_label, report_size_bytes, report_url,
        company_id, company_name, superintendence_id, superintendence_name, management_id, management_name,
        project_id, project_name, indicator_id, indicator_name, indicator_ids, indicator_names, indicator_value, indicator_unit, indicator_trend,
        metric_views, metric_comments, metric_likes, metric_shares, path, raw_json, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24,
        $25, $26, $27, $28, $29, $30, NOW()
      )`,
        [
          reportCatalogId,
          sourceReportId,
          initialStatus,
          parsed.reportName,
          parsed.reportDescription,
          submittedDate,
          parsed.reportSizeLabel,
          parseSizeToBytes(parsed.reportSizeLabel),
          parsed.reportUrl ?? null,
          parsed.companyId,
          parsed.companyName,
          parsed.superintendenceId,
          parsed.superintendenceName,
          parsed.managementId ?? null,
          parsed.managementName ?? null,
          parsed.projectId ?? null,
          parsed.projectName ?? null,
          primary.id ?? "",
          primary.name,
          toDbArray(db, indicatorIds),
          toDbArray(db, indicatorNames),
          primary.value ?? "",
          primary.unit ?? "",
          primary.trend ?? "stable",
          parsed.metrics.views,
          parsed.metrics.comments,
          parsed.metrics.likes,
          parsed.metrics.shares,
          toDbArray(db, path),
          JSON.stringify(parsed)
        ]
      );
    reportCatalogId = (await readInsertedId(db, "report_catalog", "source_report_id", sourceReportId)) ?? reportCatalogId;

    const reportSubmissionId = randomUUID();

    await db.query(
      `INSERT INTO report_submissions (id, report_catalog_id, submitted_by, approver_user_id, approver_name, approver_job_title, payload)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        reportSubmissionId,
        reportCatalogId,
        userId ?? null,
        submitterCanApprove ? submitter?.id ?? null : primaryApprover?.id ?? null,
        submitterCanApprove ? submitter?.full_name ?? null : primaryApprover?.name ?? null,
        submitterCanApprove ? submitter?.job_title ?? null : primaryApprover?.jobTitle ?? null,
        JSON.stringify({
          ...parsed,
          submittedByName: submitter?.full_name ?? parsed.submittedByName,
          submittedByEmail: submitter?.email ?? parsed.submittedByEmail,
          approverId: submitterCanApprove ? submitter?.id ?? null : primaryApprover?.id ?? null,
          approverName: submitterCanApprove ? submitter?.full_name ?? null : primaryApprover?.name ?? null,
          approverJobTitle: submitterCanApprove ? submitter?.job_title ?? null : primaryApprover?.jobTitle ?? null,
          approvalRecipients,
        })
      ]
    );

    if (
      isCoelbaUtdHierarchy({
        companyId: parsed.companyId,
        superintendenceId: parsed.superintendenceId,
        managementId: parsed.managementId,
      })
    ) {
      await utdFlowService.registerSubmittedReport({
        reportCatalogId,
        reportSubmissionId,
        sourceReportId,
        companyId: parsed.companyId,
        superintendenceId: parsed.superintendenceId,
        managementId: parsed.managementId,
        projectId: parsed.projectId,
        projectName: parsed.projectName,
        reportName: parsed.reportName,
        reportStatus: initialStatus,
        submittedBy: userId ?? null,
        approverUserId: submitterCanApprove ? submitter?.id ?? null : primaryApprover?.id ?? null,
        approverName: submitterCanApprove ? submitter?.full_name ?? null : primaryApprover?.name ?? null,
        approvalMode: submitterCanApprove ? "direct_publish" : "approval_queue",
        path,
        payload: {
          ...parsed,
          sourceReportId,
          approvalRecipients,
          primaryApproverId: primaryApprover?.id ?? null,
          primaryApproverName: primaryApprover?.name ?? null,
        },
      });

      if (userId && parsed.projectId) {
        await utdFlowService.deleteDraft({
          userId: userId!,
          projectId: parsed.projectId,
        });
      }
    }

    await reportEngagementService.upsertFromInitial(reportCatalogId, {
      views: parsed.metrics.views ?? 0,
      likes: parsed.metrics.likes ?? 0,
      comments: parsed.metrics.comments ?? 0,
      shares: parsed.metrics.shares ?? 0
    });

    try {
      const fullPath = await reportJsonFileService.writeReportJson({
        sourceReportId,
        reportName: parsed.reportName,
        reportDescription: parsed.reportDescription,
        reportDate: submittedDate,
        reportSizeLabel: parsed.reportSizeLabel,
        reportSizeBytes: parseSizeToBytes(parsed.reportSizeLabel),
        reportUrl: parsed.reportUrl ?? null,
        companyId: parsed.companyId,
        companyName: parsed.companyName,
        superintendenceId: parsed.superintendenceId,
        superintendenceName: parsed.superintendenceName,
        managementId: parsed.managementId ?? undefined,
        managementName: parsed.managementName ?? undefined,
        projectId: parsed.projectId ?? undefined,
        projectName: parsed.projectName ?? undefined,
        indicators: parsed.indicators,
        metrics: parsed.metrics,
        path,
        reportStatus: initialStatus,
        rawJson: parsed as unknown as Record<string, unknown>
      });
      reportCatalogFileQueryService.invalidateCache();
      if (initialStatus === "approved") {
        await reportCatalogSemanticSyncService.syncCatalogDocumentFile({
          fullPath,
          reportCatalogId,
        });
      }
    } catch (error) {
      logger.warn("Report submitted but JSON materialization failed; startup rebuild will recover the catalog file", {
        sourceReportId,
        reportName: parsed.reportName,
        error: (error as Error).message,
      });
    }

    if (submitterCanApprove) {
      const decisionId = randomUUID();
      const approvedByName = submitter?.full_name ?? parsed.submittedByName ?? "Aprovador NeoView";
      await db.query(
        `INSERT INTO report_approvals (
          id, report_id, approver_id, approver_name, status, comments, approved_at, report_name, destination_path, submitter_name, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, 'approved', $5, NOW(), $6, $7, $8, NOW(), NOW()
        )`,
        [
          decisionId,
          reportCatalogId,
          submitter?.id ?? userId ?? null,
          approvedByName,
          "Relat\u00F3rio publicado diretamente por usu\u00E1rio com al\u00E7ada de aprova\u00E7\u00E3o.",
          parsed.reportName,
          toDbArray(db, path),
          approvedByName
        ]
      );
    } else if (approvalRecipients.length > 0) {
      const recipients = new Map<string, { title: string; message: string }>();

      for (const recipient of approvalRecipients) {
        const title =
          recipient.kind === "superadmin"
            ? "Nova aprovação pendente para supervisão"
            : recipient.kind === "corporate_approver"
              ? "Novo relatório pendente para aprovação"
              : "Novo relatório pendente para aprovação";
        const message =
          recipient.kind === "superadmin"
            ? `O relatório ${parsed.reportName} entrou em aprovação pendente e também está visível para a supervisão de superadmin.`
            : recipient.kind === "corporate_approver"
              ? `O relatório ${parsed.reportName} entrou em aprovação pendente para superintendências corporativas.`
              : `O relatório ${parsed.reportName} foi enviado para sua fila de aprovação.`;

        recipients.set(recipient.id, { title, message });

        if (recipient.kind === "hierarchy_approver") {
          const delegates = await approvalDelegationService.listActiveDelegatesForApprover(recipient.id);
          for (const delegation of delegates) {
            recipients.set(delegation.delegate_user_id, {
              title: 'Nova aprovação delegada para você',
              message: `${recipient.name} possui uma delegação ativa e o relatório ${parsed.reportName} entrou na fila que você pode tratar.`
            });
          }
        }
      }

      await notificationService.createMany(
        Array.from(recipients.entries()).map(([recipientUserId, copy]) => ({
          recipientUserId,
          type: 'approval_request',
          title: copy.title,
          message: copy.message,
          entityType: 'report_catalog',
          entityId: reportCatalogId,
          actionUrl: '/approvals',
          metadata: {
            reportCatalogId,
            reportName: parsed.reportName,
            sourceReportId,
            approvalRecipients,
            primaryApproverId: primaryApprover?.id ?? null,
            primaryApproverName: primaryApprover?.name ?? null,
          },
        }))
      );
    }

    return {
      id: reportCatalogId,
      sourceReportId,
      status: initialStatus,
      approver: resolvedApprover
        ? {
            id: resolvedApprover?.id ?? null,
            name: resolvedApprover?.name ?? "Aprovador NeoView",
            jobTitle: resolvedApprover?.jobTitle
          }
        : null
    };
  },

  async ensureDemoPendingReports(): Promise<{ created: number }> {
    const db = await getDbClient();
    const samples = [
      {
        sourceReportId: 'demo-pending-gestao-comercial',
        reportName: 'Análise de Backlog Comercial Março 2026.pdf',
        reportDescription: 'Panorama do backlog de atendimentos comerciais com foco em fila critica, reaberturas e risco de SLA.',
        reportDate: '2026-03-10',
        reportSizeLabel: '2.4 MB',
        reportUrl: 'https://example.com/demo/backlog-comercial',
        companyId: 'coelba',
        companyName: 'Neoenergia Coelba',
        superintendenceId: 'sup-relacionamento-clientes',
        superintendenceName: 'Superintendencia de Relacionamento com Clientes',
        managementId: 'ger-receita',
        managementName: 'Gerencia da Gestao da Receita',
        projectId: 'uni-gestao-operacional-comercial',
        projectName: 'Unidade Gestao Operacional Comercial',
        indicators: [{ id: 'ind-sla-comercial', name: 'SLA Comercial', value: '93.1', unit: '%', trend: 'down' }],
        submitterName: 'Bruna Almeida',
        submitterEmail: 'bruna.almeida@neoview.local'
      },
      {
        sourceReportId: 'demo-pending-dec-plano-acao',
        reportName: 'Plano de Acao DEC Regiao Norte Abril 2026.pdf',
        reportDescription: 'Consolidado executivo das ocorrencias de DEC com propostas de contingencia e metas por equipe.',
        reportDate: '2026-03-11',
        reportSizeLabel: '3.1 MB',
        reportUrl: 'https://example.com/demo/plano-dec',
        companyId: 'coelba',
        companyName: 'Neoenergia Coelba',
        superintendenceId: 'sup-tecnica-coelba',
        superintendenceName: 'Superintendencia Tecnica Coelba',
        managementId: 'ger-manutencao',
        managementName: 'Gerencia de Manutencao',
        projectId: 'proj-eficiencia-rede',
        projectName: 'Eficiencia de Rede',
        indicators: [{ id: 'ind-dec', name: 'DEC - Duracao Equivalente por Consumidor', value: '12.1', unit: 'horas', trend: 'down' }],
        submitterName: 'Carlos Nogueira',
        submitterEmail: 'carlos.nogueira@neoview.local'
      },
      {
        sourceReportId: 'demo-pending-gd-impacto',
        reportName: 'Impacto da GD no Carregamento de Alimentadores.pdf',
        reportDescription: 'Estudo de impacto da geracao distribuida sobre capacidade, perdas e expansao em Pernambuco.',
        reportDate: '2026-03-12',
        reportSizeLabel: '4.0 MB',
        reportUrl: 'https://example.com/demo/gd-impacto',
        companyId: 'pernambuco',
        companyName: 'Neoenergia Pernambuco',
        superintendenceId: 'sup-operacoes-pe',
        superintendenceName: 'Superintendencia de Operacoes',
        managementId: 'ger-projetos-pe',
        managementName: 'Gerencia de Projetos',
        projectId: 'proj-energia-solar',
        projectName: 'Energia Solar Distribuida',
        indicators: [{ id: 'ind-gd', name: 'Conexoes GD', value: '15420', unit: 'unidades', trend: 'up' }],
        submitterName: 'Fernanda Rocha',
        submitterEmail: 'fernanda.rocha@neoview.local'
      }
    ];

    let created = 0;

    for (const sample of samples) {
      const exists = await db.query<{ id: string }>(
        'SELECT id FROM report_catalog WHERE source_report_id = $1 LIMIT 1',
        [sample.sourceReportId]
      );
      if (exists.rows[0]?.id) continue;

      const reportCatalogId = randomUUID();
      const path = [
        sample.companyName,
        sample.superintendenceName,
        sample.managementName,
        sample.projectName,
        sample.reportName
      ];
      const indicatorNames = sample.indicators.map((item) => item.name);
      const indicatorIds = sample.indicators.map((item) => item.id ?? '');

      await db.query(
        `INSERT INTO report_catalog (
          id, source_report_id, report_status, report_name, report_description, report_date, report_size_label, report_size_bytes, report_url,
          company_id, company_name, superintendence_id, superintendence_name, management_id, management_name,
          project_id, project_name, indicator_id, indicator_name, indicator_ids, indicator_names, indicator_value, indicator_unit, indicator_trend,
          metric_views, metric_comments, metric_likes, metric_shares, path, raw_json, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24,
          $25, $26, $27, $28, $29, $30, NOW()
        )`,
        [
          reportCatalogId,
          sample.sourceReportId,
          'pending_approval',
          sample.reportName,
          sample.reportDescription,
          sample.reportDate,
          sample.reportSizeLabel,
          parseSizeToBytes(sample.reportSizeLabel),
          sample.reportUrl,
          sample.companyId,
          sample.companyName,
          sample.superintendenceId,
          sample.superintendenceName,
          sample.managementId,
          sample.managementName,
          sample.projectId,
          sample.projectName,
          sample.indicators[0].id ?? '',
          sample.indicators[0].name,
          toDbArray(db, indicatorIds),
          toDbArray(db, indicatorNames),
          sample.indicators[0].value ?? '',
          sample.indicators[0].unit ?? '',
          sample.indicators[0].trend ?? 'stable',
          0,
          0,
          0,
          0,
          toDbArray(db, path),
          JSON.stringify({
            ...sample,
            submittedByName: sample.submitterName,
            submittedByEmail: sample.submitterEmail,
          })
        ]
      );

      await db.query(
        `INSERT INTO report_submissions (id, report_catalog_id, submitted_by, payload)
         VALUES ($1, $2, $3, $4)`,
        [
          randomUUID(),
          reportCatalogId,
          null,
          JSON.stringify({
            ...sample,
            submittedByName: sample.submitterName,
            submittedByEmail: sample.submitterEmail,
          })
        ]
      );

      await reportEngagementService.upsertFromInitial(reportCatalogId, {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0
      });

      created += 1;
    }

    return { created };
  },

  async findReportsByIndicators(indicatorNames: string[]) {
    const db = await getDbClient();
    const cleaned = indicatorNames.map((x) => x.trim()).filter(Boolean);
    if (cleaned.length === 0) return [];
    const result = await db.query<{
      source_report_id: string;
      report_name: string;
      report_description: string | null;
      indicator_names: unknown;
      company_id: string;
      company_name: string;
      superintendence_id: string;
      superintendence_name: string;
      management_id: string;
      management_name: string;
      project_id: string;
      project_name: string;
      path: unknown;
      report_date: string | null;
    }>(
      `SELECT
        source_report_id,
        report_name,
        report_description,
        indicator_names,
        company_id,
        company_name,
        superintendence_id,
        superintendence_name,
        management_id,
        management_name,
        project_id,
        project_name,
        path,
        report_date
      FROM report_catalog`
    );
    const lowered = new Set(cleaned.map((x) => x.toLowerCase()));
    return result.rows
      .map((row) => ({ ...row, indicator_names: fromDbArray(row.indicator_names), path: fromDbArray(row.path) }))
      .filter((row) => row.indicator_names.some((name) => lowered.has(name.toLowerCase())))
      .sort((a, b) => {
        const dateA = Date.parse(a.report_date ?? "");
        const dateB = Date.parse(b.report_date ?? "");
        if (Number.isNaN(dateA) && Number.isNaN(dateB)) return a.report_name.localeCompare(b.report_name);
        if (Number.isNaN(dateA)) return 1;
        if (Number.isNaN(dateB)) return -1;
        return dateB - dateA || a.report_name.localeCompare(b.report_name);
      });
  },

  async findReportsByIndicatorTerms(indicatorTerms: string[]) {
    const db = await getDbClient();
    const cleaned = indicatorTerms.map((term) => normalizeLoose(term)).filter(Boolean);
    if (cleaned.length === 0) return [];

    const result = await db.query<{
      source_report_id: string;
      report_name: string;
      report_description: string;
      company_id: string;
      company_name: string;
      superintendence_id: string;
      superintendence_name: string;
      management_id: string;
      management_name: string;
      project_id: string;
      project_name: string;
      indicator_names: unknown;
      report_date: string | null;
      path: unknown;
    }>(
      `SELECT
        source_report_id,
        report_name,
        report_description,
        company_id,
        company_name,
        superintendence_id,
        superintendence_name,
        management_id,
        management_name,
        project_id,
        project_name,
        indicator_names,
        report_date,
        path
      FROM report_catalog`
    );

    return result.rows
      .map((row) => {
        const indicatorNames = fromDbArray(row.indicator_names);
        const path = fromDbArray(row.path);
        const matchedTerms = cleaned.filter((term) =>
          indicatorNames.some((indicatorName) => indicatorMatchesTerm(indicatorName, term))
        );

        if (matchedTerms.length === 0) return null;

        return {
          ...row,
          indicator_names: indicatorNames,
          path,
          score: matchedTerms.length / cleaned.length
        };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const dateA = Date.parse(a.report_date ?? "");
        const dateB = Date.parse(b.report_date ?? "");
        if (Number.isNaN(dateA) && Number.isNaN(dateB)) return a.report_name.localeCompare(b.report_name);
        if (Number.isNaN(dateA)) return 1;
        if (Number.isNaN(dateB)) return -1;
        return dateB - dateA || a.report_name.localeCompare(b.report_name);
      });
  },

  async listKnownIndicators(limit = 200): Promise<string[]> {
    const cached = readTimedCache(knownIndicatorsCache);
    if (cached) return cached.slice(0, limit);

    const db = await getDbClient();
    const result = await db.query<{ indicator_names: unknown }>("SELECT indicator_names FROM report_catalog");
    const set = new Set<string>();
    result.rows.forEach((row) => fromDbArray(row.indicator_names).forEach((name) => set.add(name)));
    const indicators = Array.from(set).sort((a, b) => a.localeCompare(b));
    knownIndicatorsCache = writeTimedCache(indicators);
    return indicators.slice(0, limit);
  },

  async listKnownCompanies(limit = 50): Promise<string[]> {
    const cached = readTimedCache(knownCompaniesCache);
    if (cached) return cached.slice(0, limit);

    const db = await getDbClient();
    const result = await db.query<{ company_name: string }>(
      "SELECT DISTINCT company_name FROM report_catalog WHERE company_name IS NOT NULL AND company_name <> '' ORDER BY company_name ASC"
    );
    const companies = result.rows.map((row) => row.company_name);
    knownCompaniesCache = writeTimedCache(companies);
    return companies.slice(0, limit);
  },

  async listIndicatorsByCompany(companyName: string) {
    const db = await getDbClient();
    const normalizedCompany = normalizeLoose(companyName).replace(/^neoenergia\s+/, "").trim();
    if (!normalizedCompany) return [];

    const result = await db.query<{
      company_id: string;
      company_name: string;
      indicator_names: unknown;
      source_report_id: string;
      report_name: string;
      report_date: string | null;
    }>(
      `SELECT company_id, company_name, indicator_names, source_report_id, report_name, report_date
       FROM report_catalog`
    );

    const rows = result.rows.filter((row) => {
      const normalizedRowCompany = normalizeLoose(row.company_name);
      const simplifiedRowCompany = normalizedRowCompany.replace(/^neoenergia\s+/, "").trim();
      return (
        normalizedRowCompany.includes(normalizedCompany) ||
        simplifiedRowCompany.includes(normalizedCompany) ||
        normalizedCompany.includes(simplifiedRowCompany)
      );
    });

    const indicators = new Map<string, { reports: number; latestReport: string | null; companyName: string; companyId: string }>();

    rows.forEach((row) => {
      const indicatorNames = fromDbArray(row.indicator_names);
      indicatorNames.forEach((indicatorName) => {
        const current = indicators.get(indicatorName);
        const reportDate = row.report_date ?? null;
        if (!current) {
          indicators.set(indicatorName, {
            reports: 1,
            latestReport: reportDate,
            companyName: row.company_name,
            companyId: row.company_id
          });
          return;
        }

        const currentDate = Date.parse(current.latestReport ?? "");
        const nextDate = Date.parse(reportDate ?? "");
        indicators.set(indicatorName, {
          reports: current.reports + 1,
          latestReport:
            Number.isNaN(nextDate) || (!Number.isNaN(currentDate) && currentDate > nextDate)
              ? current.latestReport
              : reportDate,
          companyName: current.companyName,
          companyId: current.companyId
        });
      });
    });

    return Array.from(indicators.entries())
      .map(([indicatorName, meta]) => ({
        indicatorName,
        reports: meta.reports,
        latestReport: meta.latestReport,
        companyName: meta.companyName,
        companyId: meta.companyId
      }))
      .sort((a, b) => {
        if (b.reports !== a.reports) return b.reports - a.reports;
        const dateA = Date.parse(a.latestReport ?? "");
        const dateB = Date.parse(b.latestReport ?? "");
        if (Number.isNaN(dateA) && Number.isNaN(dateB)) return a.indicatorName.localeCompare(b.indicatorName);
        if (Number.isNaN(dateA)) return 1;
        if (Number.isNaN(dateB)) return -1;
        return dateB - dateA || a.indicatorName.localeCompare(b.indicatorName);
      });
  },

  async listReportsSubmittedByUser(userId: string, limit = 1000) {
    const db = await getDbClient();
    const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(5000, Math.floor(limit))) : 1000;
    const result = await db.query<{
      id: string;
      source_report_id: string;
      report_status: string;
      report_name: string;
      report_description: string | null;
      report_date: string | null;
      report_size_label: string | null;
      report_url: string | null;
      company_id: string | null;
      company_name: string;
      superintendence_id: string | null;
      superintendence_name: string;
      management_id: string | null;
      management_name: string;
      project_id: string | null;
      project_name: string;
      path: unknown;
      indicator_names: unknown;
      metric_views: number | null;
      metric_comments: number | null;
      metric_likes: number | null;
      metric_shares: number | null;
      submitted_at: string | null;
    }>(
      `SELECT
        rc.id,
        rc.source_report_id,
        rc.report_status,
        rc.report_name,
        rc.report_description,
        rc.report_date,
        rc.report_size_label,
        rc.report_url,
        rc.company_id,
        rc.company_name,
        rc.superintendence_id,
        rc.superintendence_name,
        rc.management_id,
        rc.management_name,
        rc.project_id,
        rc.project_name,
        rc.path,
        rc.indicator_names,
        rc.metric_views,
        rc.metric_comments,
        rc.metric_likes,
        rc.metric_shares,
        rs.created_at AS submitted_at
      FROM report_submissions rs
      INNER JOIN report_catalog rc ON rc.id = rs.report_catalog_id
      INNER JOIN (
        SELECT report_catalog_id, MAX(created_at) AS latest_submitted_at
        FROM report_submissions
        WHERE submitted_by = $1
        GROUP BY report_catalog_id
      ) latest
        ON latest.report_catalog_id = rs.report_catalog_id
       AND latest.latest_submitted_at = rs.created_at
      WHERE rs.submitted_by = $1
      ORDER BY rs.created_at DESC
      LIMIT $2`,
      [userId, safeLimit]
    );

    return result.rows.map((row) => {
      const normalized = clearCorporateHierarchyChildren(
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

      const path = buildReportPath({
        assetType: "hyperlink",
        reportName: row.report_name,
        reportDescription: row.report_description ?? "",
        reportDate: row.report_date ?? undefined,
        reportSizeLabel: row.report_size_label ?? "",
        reportUrl: row.report_url ?? "",
        companyId: normalized.companyId ?? "",
        companyName: normalized.companyName ?? "",
        superintendenceId: normalized.superintendenceId ?? "",
        superintendenceName: normalized.superintendenceName ?? "",
        managementId: normalized.managementId ?? null,
        managementName: normalized.managementName ?? null,
        projectId: normalized.projectId ?? null,
        projectName: normalized.projectName ?? null,
        indicators: [],
        metrics: { views: 0, comments: 0, likes: 0, shares: 0 },
      });

      return {
        ...row,
        company_name: normalized.companyName ?? row.company_name,
        superintendence_name: normalized.superintendenceName ?? row.superintendence_name,
        management_name: normalized.managementName ?? row.management_name,
        project_name: normalized.projectName ?? row.project_name,
        indicator_names: fromDbArray(row.indicator_names),
        path: path.length > 1 ? path : fromDbArray(row.path)
      };
    });
  },

  async searchReportsByText(query: string, limit = 12): Promise<
    Array<{
      source_report_id: string;
      report_name: string;
      report_description: string;
      company_id: string;
      company_name: string;
      superintendence_id: string;
      superintendence_name: string;
      management_id: string;
      management_name: string;
      project_id: string;
      project_name: string;
      indicator_ids: string[];
      indicator_names: string[];
      report_date: string | null;
      path: string[];
      score: number;
    }>
  > {
    const db = await getDbClient();
    const q = query.trim().toLowerCase();
    const ftsQuery = buildFtsQuery(query);
    if (!q || !ftsQuery) return [];

    const runFallbackSearch = async () => {
      const result = await db.query<{
        source_report_id: string;
        report_name: string;
        report_description: string;
        company_id: string;
        company_name: string;
        superintendence_id: string;
        superintendence_name: string;
        management_id: string;
        management_name: string;
        project_id: string;
        project_name: string;
        indicator_ids: unknown;
        indicator_names: unknown;
        report_date: string | null;
        path: unknown;
      }>(
        `SELECT
          source_report_id,
          report_status,
          report_name,
          report_description,
          company_id,
          company_name,
          superintendence_id,
          superintendence_name,
          management_id,
          management_name,
          project_id,
          project_name,
          indicator_ids,
          indicator_names,
          report_date,
          path
        FROM report_catalog
        WHERE report_status = 'approved'
        LIMIT $1`,
        [Math.max(limit * 10, 100)]
      );

      const qTokens = new Set(q.split(/\s+/).filter(Boolean));
      return result.rows
        .map((row) => {
          const parsedIndicatorIds = fromDbArray(row.indicator_ids);
          const parsedIndicatorNames = fromDbArray(row.indicator_names);
          const parsedPath = fromDbArray(row.path);
          const blob = [
            row.report_name,
            row.report_description ?? "",
            row.company_name,
            row.superintendence_name,
            row.management_name,
            row.project_name,
            ...parsedIndicatorIds,
            ...parsedIndicatorNames
          ]
            .join(" ")
            .toLowerCase();
          if (!blob.includes(q)) return null;
          const tokens = new Set(blob.split(/\s+/).filter(Boolean));
          let hits = 0;
          qTokens.forEach((token) => {
            if (tokens.has(token)) hits += 1;
          });
          const score = qTokens.size > 0 ? hits / qTokens.size : 0;
          return { ...row, indicator_ids: parsedIndicatorIds, indicator_names: parsedIndicatorNames, path: parsedPath, score };
        })
        .filter((row): row is NonNullable<typeof row> => Boolean(row))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    };

    try {
      const result = await db.query<{
        source_report_id: string;
        report_name: string;
        report_description: string;
        company_id: string;
        company_name: string;
        superintendence_id: string;
        superintendence_name: string;
        management_id: string;
        management_name: string;
        project_id: string;
        project_name: string;
        indicator_ids: unknown;
        indicator_names: unknown;
        report_date: string | null;
        path: unknown;
        rank: number;
      }>(
        `SELECT
          rc.source_report_id,
          rc.report_name,
          rc.report_description,
          rc.company_id,
          rc.company_name,
          rc.superintendence_id,
          rc.superintendence_name,
          rc.management_id,
          rc.management_name,
          rc.project_id,
          rc.project_name,
          rc.indicator_ids,
          rc.indicator_names,
          rc.report_date,
          rc.path,
          bm25(report_catalog_fts) AS rank
        FROM report_catalog_fts
        INNER JOIN report_catalog rc
          ON rc.source_report_id = report_catalog_fts.source_report_id
        WHERE report_catalog_fts MATCH $1
          AND rc.report_status = 'approved'
        ORDER BY rank ASC, rc.report_date DESC, rc.updated_at DESC, rc.created_at DESC
        LIMIT $2`,
        [ftsQuery, Math.max(limit * 4, 25)]
      );

      return result.rows.map((row) => ({
        ...row,
        indicator_ids: fromDbArray(row.indicator_ids),
        indicator_names: fromDbArray(row.indicator_names),
        path: fromDbArray(row.path),
        score: Number.isFinite(Number(row.rank)) ? 1 / (1 + Math.max(Number(row.rank), 0)) : 0
      }));
    } catch {
      return runFallbackSearch();
    }
  },

  async rebuildJsonFilesFromCatalog(): Promise<{ generated: number }> {
    const db = await getDbClient();
    const result = await db.query<{
      source_report_id: string;
      report_status: string;
      report_name: string;
      report_description: string;
      report_date: string | null;
      report_size_label: string;
      report_size_bytes: number;
      report_url: string | null;
      company_id: string;
      company_name: string;
      superintendence_id: string;
      superintendence_name: string;
      management_id: string;
      management_name: string;
      project_id: string;
      project_name: string;
      indicator_ids: unknown;
      indicator_names: unknown;
      indicator_value: string;
      indicator_unit: string;
      indicator_trend: string;
      metric_views: number;
      metric_comments: number;
      metric_likes: number;
      metric_shares: number;
      id: string;
      path: unknown;
      raw_json: unknown;
    }>(
      `SELECT
        rc.id, rc.source_report_id, rc.report_status, rc.report_name, rc.report_description, rc.report_date, rc.report_size_label, rc.report_size_bytes, rc.report_url,
        rc.company_id, rc.company_name, rc.superintendence_id, rc.superintendence_name, rc.management_id, rc.management_name,
        rc.project_id, rc.project_name, rc.indicator_ids, rc.indicator_names, rc.indicator_value, rc.indicator_unit, rc.indicator_trend,
        COALESCE(rem.views_count, rc.metric_views) AS metric_views,
        COALESCE(rem.comments_count, rc.metric_comments) AS metric_comments,
        COALESCE(rem.likes_count, rc.metric_likes) AS metric_likes,
        COALESCE(rem.shares_count, rc.metric_shares) AS metric_shares,
        rc.path, rc.raw_json
      FROM report_catalog rc
      LEFT JOIN report_engagement_metrics rem ON rem.report_catalog_id = rc.id`
    );

    for (const row of result.rows) {
      const indicatorNames = fromDbArray(row.indicator_names);
      const indicatorIds = fromDbArray(row.indicator_ids);
      const normalizedHierarchy = clearCorporateHierarchyChildren(
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
      const parsedPath = buildReportPath({
        assetType: "hyperlink",
        reportName: row.report_name,
        reportDescription: row.report_description ?? "",
        reportDate: row.report_date ?? undefined,
        reportSizeLabel: row.report_size_label ?? "",
        reportUrl: row.report_url ?? "",
        companyId: normalizedHierarchy.companyId ?? row.company_id,
        companyName: normalizedHierarchy.companyName ?? row.company_name,
        superintendenceId: normalizedHierarchy.superintendenceId ?? row.superintendence_id,
        superintendenceName: normalizedHierarchy.superintendenceName ?? row.superintendence_name,
        managementId: normalizedHierarchy.managementId ?? null,
        managementName: normalizedHierarchy.managementName ?? null,
        projectId: normalizedHierarchy.projectId ?? null,
        projectName: normalizedHierarchy.projectName ?? null,
        indicators: [],
        metrics: { views: 0, comments: 0, likes: 0, shares: 0 },
      });
      const parsedRaw = fromDbJson<Record<string, unknown>>(row.raw_json, {});
      const indicators = (indicatorNames ?? []).map((name, index) => ({
        id: indicatorIds?.[index] ?? "",
        name,
        value: row.indicator_value,
        unit: row.indicator_unit,
        trend: row.indicator_trend
      }));

      await reportJsonFileService.writeReportJson({
        sourceReportId: row.source_report_id,
        reportName: row.report_name,
        reportDescription: row.report_description ?? "",
        reportDate: row.report_date,
        reportSizeLabel: row.report_size_label ?? "",
        reportSizeBytes: row.report_size_bytes ?? 0,
        reportUrl: row.report_url,
        companyId: normalizedHierarchy.companyId ?? row.company_id,
        companyName: normalizedHierarchy.companyName ?? row.company_name,
        superintendenceId: normalizedHierarchy.superintendenceId ?? row.superintendence_id,
        superintendenceName: normalizedHierarchy.superintendenceName ?? row.superintendence_name,
        managementId: normalizedHierarchy.managementId ?? undefined,
        managementName: normalizedHierarchy.managementName ?? undefined,
        projectId: normalizedHierarchy.projectId ?? undefined,
        projectName: normalizedHierarchy.projectName ?? undefined,
        indicators,
        metrics: {
          views: row.metric_views,
          comments: row.metric_comments,
          likes: row.metric_likes,
          shares: row.metric_shares
        },
        path: parsedPath,
        reportStatus: row.report_status,
        rawJson: parsedRaw
      });

      await reportEngagementService.upsertFromInitial(row.id, {
        views: row.metric_views ?? 0,
        likes: row.metric_likes ?? 0,
        comments: row.metric_comments ?? 0,
        shares: row.metric_shares ?? 0
      });
    }

    reportCatalogFileQueryService.invalidateCache();
    knownIndicatorsCache = null;
    knownCompaniesCache = null;

    return { generated: result.rows.length };
  },

  async syncCatalogFilesToDatabase(): Promise<{ upserted: number; deleted: number }> {
    const db = await getDbClient();
    const docs = await reportCatalogFileQueryService.listAll();
    let upserted = 0;
    let deleted = 0;

    const sourceIdsInFiles = new Set(docs.map((doc) => String(doc.source_report_id)));
    const existingCatalog = await db.query<{ id: string; source_report_id: string }>(
      "SELECT id, source_report_id FROM report_catalog"
    );
    for (const row of existingCatalog.rows) {
      const sourceId = String(row.source_report_id ?? "");
      if (!sourceIdsInFiles.has(sourceId)) {
        await db.query("DELETE FROM report_catalog WHERE id = $1", [row.id]);
        deleted += 1;
      }
    }

    for (const doc of docs) {
      const normalizedHierarchy = clearCorporateHierarchyChildren(
        normalizeCoelbaHierarchy({
          companyId: doc.hierarchy.company.id,
          companyName: doc.hierarchy.company.name,
          superintendenceId: doc.hierarchy.superintendence.id,
          superintendenceName: doc.hierarchy.superintendence.name,
          managementId: doc.hierarchy.management.id,
          managementName: doc.hierarchy.management.name,
          projectId: doc.hierarchy.project.id,
          projectName: doc.hierarchy.project.name,
        })
      );
      const indicatorIds = (doc.indicators ?? []).map((i) => i.id ?? "");
      const indicatorNames = (doc.indicators ?? []).map((i) => i.name ?? "");
      const first = doc.indicators?.[0];
      const path =
        doc.path && doc.path.length > 0
          ? doc.path
          : [
              normalizedHierarchy.companyName ?? doc.hierarchy.company.name,
              normalizedHierarchy.superintendenceName ?? doc.hierarchy.superintendence.name,
              normalizedHierarchy.managementName ?? doc.hierarchy.management.name,
              normalizedHierarchy.projectName ?? doc.hierarchy.project.name,
            ].filter(Boolean);
      const reportDate = doc.report.date ? doc.report.date.slice(0, 10) : null;
      const status = String(((doc as unknown as Record<string, unknown>)["report_status"] ?? "approved"));

      const existing = await db.query<{ id: string; report_status: string | null }>(
        "SELECT id, report_status FROM report_catalog WHERE source_report_id = $1 LIMIT 1",
        [doc.source_report_id]
      );
      if (existing.rows[0]) {
        const mergedStatus = mergeCatalogStatus(existing.rows[0].report_status, status);
        await db.query(
          `UPDATE report_catalog
           SET report_status = $2, report_name = $3, report_description = $4, report_date = $5,
               company_id = $6, company_name = $7, superintendence_id = $8, superintendence_name = $9,
               management_id = $10, management_name = $11, project_id = $12, project_name = $13,
               indicator_id = $14, indicator_name = $15, indicator_ids = $16, indicator_names = $17,
               path = $18, raw_json = $19, updated_at = NOW()
           WHERE source_report_id = $1`,
          [
            doc.source_report_id,
            mergedStatus,
            doc.report.name,
            doc.report.description ?? "",
            reportDate,
            normalizedHierarchy.companyId ?? doc.hierarchy.company.id,
            normalizedHierarchy.companyName ?? doc.hierarchy.company.name,
            normalizedHierarchy.superintendenceId ?? doc.hierarchy.superintendence.id,
            normalizedHierarchy.superintendenceName ?? doc.hierarchy.superintendence.name,
            normalizedHierarchy.managementId ?? null,
            normalizedHierarchy.managementName ?? null,
            normalizedHierarchy.projectId ?? null,
            normalizedHierarchy.projectName ?? null,
            first?.id ?? "",
            first?.name ?? "",
            toDbArray(db, indicatorIds),
            toDbArray(db, indicatorNames),
            toDbArray(db, path),
            JSON.stringify(doc)
          ]
        );
      } else {
        const insertId = randomUUID();
        await db.query(
          `INSERT INTO report_catalog (
            id, source_report_id, report_status, report_name, report_description, report_date, report_size_label, report_size_bytes, report_url,
            company_id, company_name, superintendence_id, superintendence_name, management_id, management_name,
            project_id, project_name, indicator_id, indicator_name, indicator_ids, indicator_names, indicator_value, indicator_unit, indicator_trend,
            metric_views, metric_comments, metric_likes, metric_shares, path, raw_json, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, '', 0, null,
            $7, $8, $9, $10, $11, $12,
            $13, $14, $15, $16, $17, $18, '', '', '',
            $19, $20, $21, $22, $23, $24, NOW()
          )`,
          [
            insertId,
            doc.source_report_id,
            status,
            doc.report.name,
            doc.report.description ?? "",
            reportDate,
            normalizedHierarchy.companyId ?? doc.hierarchy.company.id,
            normalizedHierarchy.companyName ?? doc.hierarchy.company.name,
            normalizedHierarchy.superintendenceId ?? doc.hierarchy.superintendence.id,
            normalizedHierarchy.superintendenceName ?? doc.hierarchy.superintendence.name,
            normalizedHierarchy.managementId ?? null,
            normalizedHierarchy.managementName ?? null,
            normalizedHierarchy.projectId ?? null,
            normalizedHierarchy.projectName ?? null,
            first?.id ?? "",
            first?.name ?? "",
            toDbArray(db, indicatorIds),
            toDbArray(db, indicatorNames),
            doc.metrics?.views ?? 0,
            doc.metrics?.comments ?? 0,
            doc.metrics?.likes ?? 0,
            doc.metrics?.shares ?? 0,
            toDbArray(db, path),
            JSON.stringify(doc)
          ]
        );
      }
      upserted += 1;
    }

    reportCatalogFileQueryService.invalidateCache();
    knownIndicatorsCache = null;
    knownCompaniesCache = null;

    return { upserted, deleted };
  }
};



