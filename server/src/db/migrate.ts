import { getDbClient } from "./connection";
import { logger } from "../utils/logger";

const sqliteMigrationStatements: string[] = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    employee_id TEXT UNIQUE,
    company_id TEXT,
    company_name TEXT,
    superintendence_id TEXT,
    superintendence_name TEXT,
    management_id TEXT,
    management_name TEXT,
    project_id TEXT,
    project_name TEXT,
    job_title TEXT,
    hierarchy_level INTEGER,
    manager_user_id TEXT,
    approver_user_id TEXT,
    status TEXT DEFAULT 'active',
    phone TEXT,
    department TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS user_credentials (
    user_id TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS user_preferences (
    user_id TEXT PRIMARY KEY,
    theme TEXT DEFAULT 'system',
    language TEXT DEFAULT 'pt-BR',
    notifications_enabled INTEGER DEFAULT 1,
    email_notifications INTEGER DEFAULT 1,
    dashboard_layout TEXT DEFAULT '{}',
    favorite_reports TEXT DEFAULT '[]',
    analytics_workspaces TEXT DEFAULT '[]',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS user_roles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_unique ON user_roles(user_id, role_id)`,
  `CREATE TABLE IF NOT EXISTS auth_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    revoked_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    report_catalog_id TEXT,
    source_report_id TEXT,
    original_filename TEXT,
    title TEXT NOT NULL,
    source_file TEXT UNIQUE,
    json_content TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS report_catalog (
    id TEXT PRIMARY KEY,
    source_report_id TEXT NOT NULL UNIQUE,
    report_status TEXT DEFAULT 'approved',
    report_name TEXT NOT NULL,
    report_description TEXT,
    report_date TEXT,
    report_size_label TEXT,
    report_size_bytes INTEGER,
    report_url TEXT,
    company_id TEXT,
    company_name TEXT,
    superintendence_id TEXT,
    superintendence_name TEXT,
    management_id TEXT,
    management_name TEXT,
    project_id TEXT,
    project_name TEXT,
    indicator_id TEXT,
    indicator_name TEXT,
    indicator_ids TEXT,
    indicator_names TEXT,
    indicator_value TEXT,
    indicator_unit TEXT,
    indicator_trend TEXT,
    metric_views INTEGER DEFAULT 0,
    metric_comments INTEGER DEFAULT 0,
    metric_likes INTEGER DEFAULT 0,
    metric_shares INTEGER DEFAULT 0,
    path TEXT,
    raw_json TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE VIRTUAL TABLE IF NOT EXISTS report_catalog_fts USING fts5(
    source_report_id UNINDEXED,
    report_name,
    report_description,
    company_name,
    superintendence_name,
    management_name,
    project_name,
    indicator_names,
    path,
    tokenize='unicode61 remove_diacritics 2'
  )`,
  `CREATE TRIGGER IF NOT EXISTS report_catalog_ai AFTER INSERT ON report_catalog BEGIN
    INSERT INTO report_catalog_fts (
      source_report_id,
      report_name,
      report_description,
      company_name,
      superintendence_name,
      management_name,
      project_name,
      indicator_names,
      path
    ) VALUES (
      NEW.source_report_id,
      COALESCE(NEW.report_name, ''),
      COALESCE(NEW.report_description, ''),
      COALESCE(NEW.company_name, ''),
      COALESCE(NEW.superintendence_name, ''),
      COALESCE(NEW.management_name, ''),
      COALESCE(NEW.project_name, ''),
      COALESCE(NEW.indicator_names, ''),
      COALESCE(NEW.path, '')
    );
  END`,
  `CREATE TRIGGER IF NOT EXISTS report_catalog_ad AFTER DELETE ON report_catalog BEGIN
    DELETE FROM report_catalog_fts
     WHERE source_report_id = OLD.source_report_id;
  END`,
  `CREATE TRIGGER IF NOT EXISTS report_catalog_au AFTER UPDATE ON report_catalog BEGIN
    DELETE FROM report_catalog_fts
     WHERE source_report_id = OLD.source_report_id;
    INSERT INTO report_catalog_fts (
      source_report_id,
      report_name,
      report_description,
      company_name,
      superintendence_name,
      management_name,
      project_name,
      indicator_names,
      path
    ) VALUES (
      NEW.source_report_id,
      COALESCE(NEW.report_name, ''),
      COALESCE(NEW.report_description, ''),
      COALESCE(NEW.company_name, ''),
      COALESCE(NEW.superintendence_name, ''),
      COALESCE(NEW.management_name, ''),
      COALESCE(NEW.project_name, ''),
      COALESCE(NEW.indicator_names, ''),
      COALESCE(NEW.path, '')
    );
  END`,
  `CREATE TABLE IF NOT EXISTS report_submissions (
    id TEXT PRIMARY KEY,
    report_catalog_id TEXT,
    submitted_by TEXT,
    approver_user_id TEXT,
    approver_name TEXT,
    approver_job_title TEXT,
    payload TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS utd_submission_drafts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    company_id TEXT NOT NULL,
    superintendence_id TEXT NOT NULL,
    management_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    report_name TEXT,
    report_description TEXT,
    report_url TEXT,
    report_date TEXT,
    indicators_text TEXT,
    payload TEXT NOT NULL DEFAULT '{}',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS utd_flow_reports (
    id TEXT PRIMARY KEY,
    report_catalog_id TEXT NOT NULL UNIQUE,
    report_submission_id TEXT,
    source_report_id TEXT NOT NULL UNIQUE,
    company_id TEXT NOT NULL,
    superintendence_id TEXT NOT NULL,
    management_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    attribute_name TEXT NOT NULL,
    report_name TEXT NOT NULL,
    report_status TEXT NOT NULL,
    submitted_by TEXT,
    approver_user_id TEXT,
    approver_name TEXT,
    approval_mode TEXT NOT NULL DEFAULT 'approval_queue',
    storage_path TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS report_approvals (
    id TEXT PRIMARY KEY,
    report_id TEXT NOT NULL,
    approver_id TEXT NOT NULL,
    approver_name TEXT NOT NULL,
    status TEXT NOT NULL,
    comments TEXT,
    approved_at TEXT DEFAULT CURRENT_TIMESTAMP,
    report_name TEXT NOT NULL,
    destination_path TEXT,
    submitter_name TEXT DEFAULT 'Analista NeoView',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS report_engagement_metrics (
    id TEXT PRIMARY KEY,
    report_catalog_id TEXT NOT NULL UNIQUE,
    report_source_id TEXT,
    report_name TEXT,
    report_path TEXT,
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS report_engagement_events (
    id TEXT PRIMARY KEY,
    report_catalog_id TEXT NOT NULL,
    actor_key TEXT NOT NULL,
    action TEXT NOT NULL,
    occurred_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS report_comments (
    id TEXT PRIMARY KEY,
    report_catalog_id TEXT NOT NULL,
    parent_comment_id TEXT,
    actor_key TEXT NOT NULL,
    user_id TEXT,
    message TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS report_likes (
    id TEXT PRIMARY KEY,
    report_catalog_id TEXT NOT NULL,
    actor_key TEXT NOT NULL,
    user_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_report_likes_unique ON report_likes(report_catalog_id, actor_key)`,
  `CREATE TABLE IF NOT EXISTS report_shares (
    id TEXT PRIMARY KEY,
    report_catalog_id TEXT NOT NULL,
    actor_key TEXT NOT NULL,
    sender_user_id TEXT,
    recipient_user_id TEXT,
    recipient_name TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS report_share_monitoring (
    id TEXT PRIMARY KEY,
    report_share_id TEXT NOT NULL UNIQUE,
    report_catalog_id TEXT NOT NULL,
    source_report_id TEXT,
    report_name TEXT NOT NULL,
    report_path TEXT,
    actor_key TEXT NOT NULL,
    sender_user_id TEXT,
    sender_name TEXT,
    sender_email TEXT,
    sender_employee_id TEXT,
    recipient_user_id TEXT,
    recipient_name TEXT,
    recipient_email TEXT,
    recipient_employee_id TEXT,
    company_id TEXT,
    company_name TEXT,
    superintendence_id TEXT,
    superintendence_name TEXT,
    management_id TEXT,
    management_name TEXT,
    project_id TEXT,
    project_name TEXT,
    action_url TEXT,
    metadata TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    recipient_user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    action_url TEXT,
    metadata TEXT,
    is_read INTEGER DEFAULT 0,
    read_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS approval_delegations (
    id TEXT PRIMARY KEY,
    delegator_user_id TEXT NOT NULL,
    delegate_user_id TEXT NOT NULL,
    valid_from TEXT NOT NULL,
    valid_until TEXT NOT NULL,
    notes TEXT,
    revoked_at TEXT,
    revoked_by_user_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    old_values TEXT,
    new_values TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS semantic_cache (
    id TEXT PRIMARY KEY,
    query TEXT NOT NULL,
    query_embedding TEXT,
    response TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS report_chunks (
    id TEXT PRIMARY KEY,
    report_id TEXT NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding TEXT,
    metadata TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
  `CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id)`,
  `CREATE INDEX IF NOT EXISTS idx_users_manager_user_id ON users(manager_user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_users_approver_user_id ON users(approver_user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_reports_source_file ON reports(source_file)`,
  `CREATE INDEX IF NOT EXISTS idx_report_catalog_company_id ON report_catalog(company_id)`,
  `CREATE INDEX IF NOT EXISTS idx_report_catalog_source_report_id ON report_catalog(source_report_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_utd_submission_drafts_user_project ON utd_submission_drafts(user_id, project_id)`,
  `CREATE INDEX IF NOT EXISTS idx_utd_submission_drafts_updated_at ON utd_submission_drafts(updated_at)`,
  `CREATE INDEX IF NOT EXISTS idx_utd_flow_reports_project_status ON utd_flow_reports(project_id, report_status, updated_at)`,
  `CREATE INDEX IF NOT EXISTS idx_utd_flow_reports_catalog_id ON utd_flow_reports(report_catalog_id)`,
  `CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_report_chunks_report_id ON report_chunks(report_id)`,
  `CREATE INDEX IF NOT EXISTS idx_report_engagement_metrics_report_catalog_id ON report_engagement_metrics(report_catalog_id)`,
  `CREATE INDEX IF NOT EXISTS idx_report_approvals_report_id ON report_approvals(report_id)`,
  `CREATE INDEX IF NOT EXISTS idx_report_approvals_approver_id ON report_approvals(approver_id)`,
  `CREATE INDEX IF NOT EXISTS idx_report_engagement_events_lookup ON report_engagement_events(report_catalog_id, actor_key, action, occurred_at)`,
  `CREATE INDEX IF NOT EXISTS idx_report_comments_report_catalog_id ON report_comments(report_catalog_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_report_comments_parent_comment_id ON report_comments(parent_comment_id)`,
  `CREATE INDEX IF NOT EXISTS idx_report_likes_report_catalog_id ON report_likes(report_catalog_id)`,
  `CREATE INDEX IF NOT EXISTS idx_report_shares_report_catalog_id ON report_shares(report_catalog_id, created_at)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_report_share_monitoring_share_id ON report_share_monitoring(report_share_id)`,
  `CREATE INDEX IF NOT EXISTS idx_report_share_monitoring_report_catalog_id ON report_share_monitoring(report_catalog_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_report_share_monitoring_sender_created_at ON report_share_monitoring(sender_user_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_report_share_monitoring_recipient_created_at ON report_share_monitoring(recipient_user_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created_at ON notifications(recipient_user_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_recipient_is_read ON notifications(recipient_user_id, is_read, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_approval_delegations_delegator ON approval_delegations(delegator_user_id, valid_until)`,
  `CREATE INDEX IF NOT EXISTS idx_approval_delegations_delegate ON approval_delegations(delegate_user_id, valid_until)`,
  `CREATE TRIGGER IF NOT EXISTS chat_messages_fill_id
   AFTER INSERT ON chat_messages
   FOR EACH ROW
   WHEN NEW.id IS NULL
   BEGIN
     UPDATE chat_messages
        SET id = lower(hex(randomblob(16)))
      WHERE rowid = NEW.rowid;
   END`,
  `CREATE TRIGGER IF NOT EXISTS report_comments_fill_id
   AFTER INSERT ON report_comments
   FOR EACH ROW
   WHEN NEW.id IS NULL
   BEGIN
     UPDATE report_comments
        SET id = lower(hex(randomblob(16)))
      WHERE rowid = NEW.rowid;
   END`,
  `CREATE TRIGGER IF NOT EXISTS report_engagement_events_fill_id
   AFTER INSERT ON report_engagement_events
   FOR EACH ROW
   WHEN NEW.id IS NULL
   BEGIN
     UPDATE report_engagement_events
        SET id = lower(hex(randomblob(16)))
      WHERE rowid = NEW.rowid;
   END`,
  `CREATE TRIGGER IF NOT EXISTS report_engagement_metrics_fill_id
   AFTER INSERT ON report_engagement_metrics
   FOR EACH ROW
   WHEN NEW.id IS NULL
   BEGIN
     UPDATE report_engagement_metrics
        SET id = lower(hex(randomblob(16)))
      WHERE rowid = NEW.rowid;
   END`,
  `CREATE TRIGGER IF NOT EXISTS report_submissions_fill_id
   AFTER INSERT ON report_submissions
   FOR EACH ROW
   WHEN NEW.id IS NULL
   BEGIN
     UPDATE report_submissions
        SET id = lower(hex(randomblob(16)))
      WHERE rowid = NEW.rowid;
   END`,
  `CREATE TRIGGER IF NOT EXISTS utd_submission_drafts_fill_id
   AFTER INSERT ON utd_submission_drafts
   FOR EACH ROW
   WHEN NEW.id IS NULL
   BEGIN
     UPDATE utd_submission_drafts
        SET id = lower(hex(randomblob(16)))
      WHERE rowid = NEW.rowid;
   END`,
  `CREATE TRIGGER IF NOT EXISTS utd_flow_reports_fill_id
   AFTER INSERT ON utd_flow_reports
   FOR EACH ROW
   WHEN NEW.id IS NULL
   BEGIN
     UPDATE utd_flow_reports
        SET id = lower(hex(randomblob(16)))
      WHERE rowid = NEW.rowid;
   END`,
  `CREATE TRIGGER IF NOT EXISTS report_shares_fill_id
   AFTER INSERT ON report_shares
   FOR EACH ROW
   WHEN NEW.id IS NULL
   BEGIN
     UPDATE report_shares
        SET id = lower(hex(randomblob(16)))
      WHERE rowid = NEW.rowid;
   END`,
  `CREATE TRIGGER IF NOT EXISTS report_share_monitoring_fill_id
   AFTER INSERT ON report_share_monitoring
   FOR EACH ROW
   WHEN NEW.id IS NULL
   BEGIN
     UPDATE report_share_monitoring
        SET id = lower(hex(randomblob(16)))
      WHERE rowid = NEW.rowid;
  END`,
  `CREATE TRIGGER IF NOT EXISTS report_catalog_delete_cascade
   AFTER DELETE ON report_catalog
   FOR EACH ROW
   BEGIN
     DELETE FROM report_engagement_metrics WHERE report_catalog_id = OLD.id;
     DELETE FROM report_engagement_events WHERE report_catalog_id = OLD.id;
     DELETE FROM report_comments WHERE report_catalog_id = OLD.id;
     DELETE FROM report_likes WHERE report_catalog_id = OLD.id;
     DELETE FROM report_share_monitoring WHERE report_catalog_id = OLD.id;
     DELETE FROM report_shares WHERE report_catalog_id = OLD.id;
     DELETE FROM report_submissions WHERE report_catalog_id = OLD.id;
     DELETE FROM utd_flow_reports WHERE report_catalog_id = OLD.id;
     DELETE FROM report_approvals WHERE report_id = OLD.id;
     DELETE FROM notifications WHERE entity_type = 'report_catalog' AND entity_id = OLD.id;
     DELETE FROM reports
      WHERE report_catalog_id = OLD.id
         OR source_report_id = OLD.source_report_id
         OR original_filename = OLD.report_name;
  END`,
  `CREATE TRIGGER IF NOT EXISTS report_shares_delete_cascade
   AFTER DELETE ON report_shares
   FOR EACH ROW
   BEGIN
     DELETE FROM report_share_monitoring WHERE report_share_id = OLD.id;
  END`,
  `CREATE TRIGGER IF NOT EXISTS reports_delete_cascade
   AFTER DELETE ON reports
   FOR EACH ROW
   BEGIN
     DELETE FROM report_chunks WHERE report_id = OLD.id;
  END`
];

const runSqliteMigrations = async () => {
  const db = await getDbClient();
  for (const statement of sqliteMigrationStatements) {
    await db.query(statement);
  }

  const runOptionalMigration = async (statement: string) => {
    try {
      await db.query(statement);
    } catch (error) {
      const message = String((error as Error).message ?? "");
      if (message.includes("duplicate column name")) return;
      throw error;
    }
  };

  await runOptionalMigration(`ALTER TABLE users ADD COLUMN department TEXT`);

  await db.query("DELETE FROM report_catalog_fts");
  await db.query(
    `INSERT INTO report_catalog_fts (
      source_report_id,
      report_name,
      report_description,
      company_name,
      superintendence_name,
      management_name,
      project_name,
      indicator_names,
      path
    )
    SELECT
      source_report_id,
      COALESCE(report_name, ''),
      COALESCE(report_description, ''),
      COALESCE(company_name, ''),
      COALESCE(superintendence_name, ''),
      COALESCE(management_name, ''),
      COALESCE(project_name, ''),
      COALESCE(indicator_names, ''),
      COALESCE(path, '')
    FROM report_catalog`
  );

  await db.query(
    `INSERT OR IGNORE INTO roles (id, code, description)
     VALUES
      ('role-superadmin', 'superadmin', 'Superadministrador'),
      ('role-admin', 'admin', 'Administrador'),
      ('role-supervisor', 'supervisor', 'Aprovador'),
      ('role-analyst', 'analyst', 'Analista'),
      ('role-viewer', 'viewer', 'Visualizador')`
  );

  await db.query(`UPDATE chat_messages SET id = lower(hex(randomblob(16))) WHERE id IS NULL`);
  await db.query(`UPDATE report_comments SET id = lower(hex(randomblob(16))) WHERE id IS NULL`);
  await db.query(`UPDATE report_engagement_events SET id = lower(hex(randomblob(16))) WHERE id IS NULL`);
  await db.query(`UPDATE report_engagement_metrics SET id = lower(hex(randomblob(16))) WHERE id IS NULL`);
  await db.query(`UPDATE report_submissions SET id = lower(hex(randomblob(16))) WHERE id IS NULL`);
  await db.query(`UPDATE utd_submission_drafts SET id = lower(hex(randomblob(16))) WHERE id IS NULL`);
  await db.query(`UPDATE utd_flow_reports SET id = lower(hex(randomblob(16))) WHERE id IS NULL`);
  await db.query(`UPDATE report_shares SET id = lower(hex(randomblob(16))) WHERE id IS NULL`);
  await db.query(`UPDATE report_share_monitoring SET id = lower(hex(randomblob(16))) WHERE id IS NULL`);
  await db.query(`DELETE FROM report_share_monitoring WHERE report_share_id IS NOT NULL AND report_share_id NOT IN (SELECT id FROM report_shares)`);
  await db.query(`DELETE FROM report_share_monitoring WHERE report_catalog_id NOT IN (SELECT id FROM report_catalog)`);
  await db.query(`DELETE FROM report_shares WHERE report_catalog_id NOT IN (SELECT id FROM report_catalog)`);
  await db.query(`DELETE FROM report_likes WHERE report_catalog_id NOT IN (SELECT id FROM report_catalog)`);
  await db.query(`DELETE FROM report_comments WHERE report_catalog_id NOT IN (SELECT id FROM report_catalog)`);
  await db.query(`DELETE FROM report_engagement_events WHERE report_catalog_id NOT IN (SELECT id FROM report_catalog)`);
  await db.query(`DELETE FROM report_engagement_metrics WHERE report_catalog_id NOT IN (SELECT id FROM report_catalog)`);
  await db.query(`DELETE FROM report_submissions WHERE report_catalog_id NOT IN (SELECT id FROM report_catalog)`);
  await db.query(`DELETE FROM utd_flow_reports WHERE report_catalog_id NOT IN (SELECT id FROM report_catalog)`);
  await db.query(`DELETE FROM report_approvals WHERE report_id NOT IN (SELECT id FROM report_catalog)`);
  await db.query(`DELETE FROM report_chunks WHERE report_id NOT IN (SELECT id FROM reports)`);
  await db.query(`DELETE FROM reports WHERE report_catalog_id IS NOT NULL AND report_catalog_id NOT IN (SELECT id FROM report_catalog)`);
  await db.query(`DELETE FROM notifications WHERE entity_type = 'report_catalog' AND entity_id IS NOT NULL AND entity_id NOT IN (SELECT id FROM report_catalog)`);
  await db.query(
    `INSERT OR IGNORE INTO report_share_monitoring (
      id,
      report_share_id,
      report_catalog_id,
      source_report_id,
      report_name,
      report_path,
      actor_key,
      sender_user_id,
      sender_name,
      sender_email,
      sender_employee_id,
      recipient_user_id,
      recipient_name,
      recipient_email,
      recipient_employee_id,
      company_id,
      company_name,
      superintendence_id,
      superintendence_name,
      management_id,
      management_name,
      project_id,
      project_name,
      action_url,
      metadata,
      created_at
    )
    SELECT
      lower(hex(randomblob(16))),
      rs.id,
      rs.report_catalog_id,
      rc.source_report_id,
      COALESCE(rc.report_name, 'Relatorio sem nome'),
      rc.path,
      rs.actor_key,
      rs.sender_user_id,
      sender.name,
      sender.email,
      sender.employee_id,
      rs.recipient_user_id,
      COALESCE(recipient.name, rs.recipient_name),
      recipient.email,
      recipient.employee_id,
      rc.company_id,
      rc.company_name,
      rc.superintendence_id,
      rc.superintendence_name,
      rc.management_id,
      rc.management_name,
      rc.project_id,
      rc.project_name,
      NULL,
      NULL,
      rs.created_at
    FROM report_shares rs
    INNER JOIN report_catalog rc ON rc.id = rs.report_catalog_id
    LEFT JOIN users sender ON sender.id = rs.sender_user_id
    LEFT JOIN users recipient ON recipient.id = rs.recipient_user_id
    WHERE rs.id IS NOT NULL`
  );
  await db.query(`UPDATE notifications SET id = lower(hex(randomblob(16))) WHERE id IS NULL`);
  await db.query(`UPDATE notifications SET is_read = 0 WHERE is_read IS NULL`);
};

export const runMigrations = async (): Promise<void> => {
  await runSqliteMigrations();
  logger.info("Database migration completed (sqlite)");
};

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error("Migration failed", { error: (error as Error).message });
      process.exit(1);
    });
}


