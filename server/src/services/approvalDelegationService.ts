import { randomUUID } from "crypto";
import { getDbClient } from "../db/connection";
import { notificationService } from "./notificationService";
import { isApprovalJobTitle, userManagementService } from "./userManagementService";

type ApprovalDelegationRow = {
  id: string;
  delegator_user_id: string;
  delegate_user_id: string;
  valid_from: string;
  valid_until: string;
  notes: string | null;
  revoked_at: string | null;
  revoked_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

const parseDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toIso = (value?: string | null, fallback = new Date()): string => {
  const parsed = parseDate(value ?? undefined) ?? fallback;
  return parsed.toISOString();
};

const isActiveAt = (row: Pick<ApprovalDelegationRow, "valid_from" | "valid_until" | "revoked_at">, now = new Date()) => {
  if (row.revoked_at) return false;
  const validFrom = parseDate(row.valid_from);
  const validUntil = parseDate(row.valid_until);
  if (!validFrom || !validUntil) return false;
  return validFrom.getTime() <= now.getTime() && validUntil.getTime() > now.getTime();
};

const hasScopeCompatibility = (
  delegator: Awaited<ReturnType<typeof userManagementService.getUserById>>,
  delegate: Awaited<ReturnType<typeof userManagementService.getUserById>>
) => {
  if (!delegator || !delegate) return false;
  if (!delegator.company_id || delegator.company_id !== delegate.company_id) return false;
  if ((delegator.superintendence_id ?? null) !== (delegate.superintendence_id ?? null)) return false;
  if ((delegator.management_id ?? null) !== (delegate.management_id ?? null)) return false;
  if ((delegator.project_id ?? null) !== (delegate.project_id ?? null)) return false;
  return true;
};

const mapDelegation = (
  row: ApprovalDelegationRow & {
    delegator_name?: string | null;
    delegator_job_title?: string | null;
    delegate_name?: string | null;
    delegate_job_title?: string | null;
  }
) => ({
  id: row.id,
  delegator_user_id: row.delegator_user_id,
  delegator_name: row.delegator_name ?? undefined,
  delegator_job_title: row.delegator_job_title ?? undefined,
  delegate_user_id: row.delegate_user_id,
  delegate_name: row.delegate_name ?? undefined,
  delegate_job_title: row.delegate_job_title ?? undefined,
  valid_from: row.valid_from,
  valid_until: row.valid_until,
  notes: row.notes ?? undefined,
  revoked_at: row.revoked_at ?? undefined,
  revoked_by_user_id: row.revoked_by_user_id ?? undefined,
  created_at: row.created_at,
  updated_at: row.updated_at,
  is_active: isActiveAt(row),
});

export const approvalDelegationService = {
  async listForUser(userId: string) {
    const db = await getDbClient();
    const [outgoing, incoming] = await Promise.all([
      db.query<
        ApprovalDelegationRow & {
          delegator_name: string | null;
          delegator_job_title: string | null;
          delegate_name: string | null;
          delegate_job_title: string | null;
        }
      >(
        `SELECT
          ad.*,
          delegator.name AS delegator_name,
          delegator.job_title AS delegator_job_title,
          delegate.name AS delegate_name,
          delegate.job_title AS delegate_job_title
         FROM approval_delegations ad
         INNER JOIN users delegator ON delegator.id = ad.delegator_user_id
         INNER JOIN users delegate ON delegate.id = ad.delegate_user_id
         WHERE ad.delegator_user_id = $1
         ORDER BY ad.created_at DESC`,
        [userId]
      ),
      db.query<
        ApprovalDelegationRow & {
          delegator_name: string | null;
          delegator_job_title: string | null;
          delegate_name: string | null;
          delegate_job_title: string | null;
        }
      >(
        `SELECT
          ad.*,
          delegator.name AS delegator_name,
          delegator.job_title AS delegator_job_title,
          delegate.name AS delegate_name,
          delegate.job_title AS delegate_job_title
         FROM approval_delegations ad
         INNER JOIN users delegator ON delegator.id = ad.delegator_user_id
         INNER JOIN users delegate ON delegate.id = ad.delegate_user_id
         WHERE ad.delegate_user_id = $1
         ORDER BY ad.created_at DESC`,
        [userId]
      ),
    ]);

    return {
      outgoing: outgoing.rows.map(mapDelegation),
      incoming: incoming.rows.map(mapDelegation),
    };
  },

  async listActiveDelegatesForApprover(delegatorUserId: string) {
    const db = await getDbClient();
    const result = await db.query<
      ApprovalDelegationRow & {
        delegate_name: string | null;
        delegate_job_title: string | null;
      }
    >(
      `SELECT
        ad.*,
        delegate.name AS delegate_name,
        delegate.job_title AS delegate_job_title
       FROM approval_delegations ad
       INNER JOIN users delegate ON delegate.id = ad.delegate_user_id
       WHERE ad.delegator_user_id = $1
         AND ad.revoked_at IS NULL`,
      [delegatorUserId]
    );

    return result.rows.filter((row) => isActiveAt(row)).map(mapDelegation);
  },

  async findActiveDelegation(delegateUserId: string, delegatorUserId: string) {
    const db = await getDbClient();
    const result = await db.query<ApprovalDelegationRow>(
      `SELECT *
       FROM approval_delegations
       WHERE delegator_user_id = $1
         AND delegate_user_id = $2
         AND revoked_at IS NULL
       ORDER BY created_at DESC`,
      [delegatorUserId, delegateUserId]
    );

    const active = result.rows.find((row) => isActiveAt(row));
    return active ? mapDelegation(active) : null;
  },

  async createDelegation(input: {
    delegatorUserId: string;
    delegateUserId: string;
    validFrom?: string | null;
    validUntil: string;
    notes?: string | null;
  }) {
    const delegator = await userManagementService.getUserById(input.delegatorUserId);
    if (!delegator || !isApprovalJobTitle(delegator.job_title)) {
      throw new Error("Somente aprovadores ativos podem delegar aprovacoes.");
    }

    const delegate = await userManagementService.getUserById(input.delegateUserId);
    if (!delegate || delegate.status !== "active") {
      throw new Error("O usuário delegado precisa estar ativo.");
    }

    if (delegator.id === delegate.id) {
      throw new Error("Não é possível delegar aprovações para si mesmo.");
    }

    if (!hasScopeCompatibility(delegator, delegate)) {
      throw new Error("A delegação só pode ser feita para um usuário da mesma alçada organizacional.");
    }

    const validFrom = toIso(input.validFrom);
    const validUntil = toIso(input.validUntil, new Date(Date.now() + 24 * 60 * 60 * 1000));
    if (new Date(validUntil).getTime() <= new Date(validFrom).getTime()) {
      throw new Error("A validade final precisa ser posterior ao inicio da delegacao.");
    }

    const db = await getDbClient();
    const existing = await db.query<ApprovalDelegationRow>(
      `SELECT *
       FROM approval_delegations
       WHERE delegator_user_id = $1
         AND delegate_user_id = $2
         AND revoked_at IS NULL`,
      [delegator.id, delegate.id]
    );

    const overlaps = existing.rows.some((row) => {
      const rowStart = parseDate(row.valid_from);
      const rowEnd = parseDate(row.valid_until);
      if (!rowStart || !rowEnd) return false;
      return rowStart.getTime() < new Date(validUntil).getTime() && rowEnd.getTime() > new Date(validFrom).getTime();
    });

    if (overlaps) {
      throw new Error("Já existe uma delegação ativa ou futura para este usuário no mesmo intervalo.");
    }

    const id = randomUUID();
    await db.query(
      `INSERT INTO approval_delegations (
        id, delegator_user_id, delegate_user_id, valid_from, valid_until, notes, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )`,
      [id, delegator.id, delegate.id, validFrom, validUntil, input.notes?.trim() || null]
    );

    await notificationService.create({
      recipientUserId: delegate.id,
      type: "approval_delegated",
      title: "Nova delegação de aprovação",
      message: `${delegator.full_name} delegou a você a aprovação de relatórios até ${new Date(validUntil).toLocaleString("pt-BR")}.`,
      entityType: "approval_delegation",
      entityId: id,
      actionUrl: "/approvals",
      metadata: {
        delegatorUserId: delegator.id,
        delegatorName: delegator.full_name,
        validFrom,
        validUntil,
      },
    });

    return {
      id,
      delegator_user_id: delegator.id,
      delegator_name: delegator.full_name,
      delegator_job_title: delegator.job_title,
      delegate_user_id: delegate.id,
      delegate_name: delegate.full_name,
      delegate_job_title: delegate.job_title,
      valid_from: validFrom,
      valid_until: validUntil,
      notes: input.notes?.trim() || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: isActiveAt({ valid_from: validFrom, valid_until: validUntil, revoked_at: null }),
    };
  },

  async revokeDelegation(input: { delegationId: string; actorUserId: string }) {
    const db = await getDbClient();
    const result = await db.query<
      ApprovalDelegationRow & {
        delegator_name: string | null;
        delegate_name: string | null;
      }
    >(
      `SELECT
        ad.*,
        delegator.name AS delegator_name,
        delegate.name AS delegate_name
       FROM approval_delegations ad
       INNER JOIN users delegator ON delegator.id = ad.delegator_user_id
       INNER JOIN users delegate ON delegate.id = ad.delegate_user_id
       WHERE ad.id = $1
       LIMIT 1`,
      [input.delegationId]
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error("Delegação não encontrada.");
    }

    const actor = await userManagementService.getUserById(input.actorUserId);
    const canRevoke = row.delegator_user_id === input.actorUserId || Boolean(actor?.roles?.includes("superadmin"));
    if (!canRevoke) {
      throw new Error("Somente o aprovador delegante pode revogar esta delegacao.");
    }

    if (row.revoked_at) {
      return mapDelegation(row);
    }

    await db.query(
      `UPDATE approval_delegations
       SET revoked_at = CURRENT_TIMESTAMP, revoked_by_user_id = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [row.id, input.actorUserId]
    );

    await notificationService.create({
      recipientUserId: row.delegate_user_id,
      type: "approval_delegation_revoked",
      title: "Delegacao revogada",
      message: `${row.delegator_name ?? "Um aprovador"} revogou a delegação de aprovação anteriormente concedida a você.`,
      entityType: "approval_delegation",
      entityId: row.id,
      actionUrl: "/approvals",
      metadata: {
        delegatorUserId: row.delegator_user_id,
        delegateUserId: row.delegate_user_id,
      },
    });

    return {
      ...mapDelegation(row),
      revoked_at: new Date().toISOString(),
      revoked_by_user_id: input.actorUserId,
      updated_at: new Date().toISOString(),
      is_active: false,
    };
  },
};
