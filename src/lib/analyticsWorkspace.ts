import type {
  AnalyticsChartFilters,
  AnalyticsChartType,
  AnalyticsMetric,
} from "@/hooks/useAnalyticsChart";
import { getUserPreferences, updateUserPreferences } from "@/lib/userPreferencesApi";

const ANALYTICS_WORKSPACE_STORAGE_KEY = "neoview_analytics_workspaces";

export interface StoredAnalyticsWorkspace {
  id: string;
  actorKey: string;
  companyId: string;
  companyName: string;
  title: string;
  reportName: string;
  chartType: AnalyticsChartType;
  metrics: AnalyticsMetric[];
  period: AnalyticsChartFilters["period"];
  startDate?: string;
  endDate?: string;
  sourceReportId?: string;
  dataMode?: AnalyticsChartFilters["dataMode"];
  updatedAt: string;
}

const isBrowser = () => typeof window !== "undefined";

const readStorage = (): StoredAnalyticsWorkspace[] => {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(ANALYTICS_WORKSPACE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredAnalyticsWorkspace[]) : [];
  } catch {
    return [];
  }
};

const writeStorage = (value: StoredAnalyticsWorkspace[]) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(ANALYTICS_WORKSPACE_STORAGE_KEY, JSON.stringify(value));
};

const replaceActorStorage = (actorKey: string, value: StoredAnalyticsWorkspace[]) => {
  const current = readStorage().filter((item) => item.actorKey !== actorKey);
  writeStorage([...current, ...value]);
};

export const listStoredAnalyticsWorkspaces = (actorKey: string): StoredAnalyticsWorkspace[] =>
  readStorage()
    .filter((item) => item.actorKey === actorKey)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));

export const listStoredAnalyticsWorkspacesByCompany = (
  actorKey: string,
  companyId: string,
): StoredAnalyticsWorkspace[] =>
  listStoredAnalyticsWorkspaces(actorKey).filter((item) => item.companyId === companyId);

export const getStoredAnalyticsWorkspace = (
  actorKey: string,
  workspaceId: string,
): StoredAnalyticsWorkspace | null =>
  listStoredAnalyticsWorkspaces(actorKey).find((item) => item.id === workspaceId) ?? null;

export const upsertStoredAnalyticsWorkspace = (workspace: StoredAnalyticsWorkspace) => {
  const current = readStorage().filter(
    (item) => !(item.actorKey === workspace.actorKey && item.id === workspace.id)
  );
  current.push(workspace);
  writeStorage(current);
};

export const removeStoredAnalyticsWorkspace = (actorKey: string, workspaceId: string) => {
  const current = readStorage().filter(
    (item) => !(item.actorKey === actorKey && item.id === workspaceId)
  );
  writeStorage(current);
};

export const replaceStoredAnalyticsWorkspacesByCompany = (
  actorKey: string,
  companyId: string,
  value: StoredAnalyticsWorkspace[],
) => {
  const current = readStorage().filter(
    (item) => !(item.actorKey === actorKey && item.companyId === companyId)
  );
  writeStorage([...current, ...value]);
};

const normalizeStoredAnalyticsWorkspaces = (value: unknown, actorKey: string): StoredAnalyticsWorkspace[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => ({ ...(item as StoredAnalyticsWorkspace), actorKey }));
};

export const syncStoredAnalyticsWorkspacesFromBackend = async (actorKey: string, userId?: string) => {
  if (!userId) return listStoredAnalyticsWorkspaces(actorKey);

  try {
    const preferences = await getUserPreferences();
    const items = normalizeStoredAnalyticsWorkspaces(preferences.analytics_workspaces, actorKey);
    replaceActorStorage(actorKey, items);
    return items;
  } catch {
    return listStoredAnalyticsWorkspaces(actorKey);
  }
};

export const persistStoredAnalyticsWorkspacesToBackend = async (actorKey: string, userId?: string) => {
  if (!userId) return listStoredAnalyticsWorkspaces(actorKey);

  const current = listStoredAnalyticsWorkspaces(actorKey);
  const updated = await updateUserPreferences({ analytics_workspaces: current });
  const items = normalizeStoredAnalyticsWorkspaces(updated.analytics_workspaces, actorKey);
  replaceActorStorage(actorKey, items);
  return items;
};
