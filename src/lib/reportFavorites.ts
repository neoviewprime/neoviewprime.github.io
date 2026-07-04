import type { PdfReport, ReportMetrics } from '@/data/mockData';
import { getUserPreferences, updateUserPreferences } from '@/lib/userPreferencesApi';

export type FavoriteReportEntry = {
  report: PdfReport;
  path: string[];
  companyId?: string;
  userId?: string;
};

const STORAGE_PREFIX = 'neoview-report-favorites';
const EVENT_NAME = 'neoview-report-favorites-changed';

const buildStorageKey = (userId?: string) => `${STORAGE_PREFIX}:${userId ?? 'anonymous'}`;

const notifyFavoritesChanged = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
};

const readFavorites = (userId?: string): FavoriteReportEntry[] => {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(buildStorageKey(userId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as FavoriteReportEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeFavorites = (items: FavoriteReportEntry[], userId?: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(buildStorageKey(userId), JSON.stringify(items));
  notifyFavoritesChanged();
};

export const listFavoriteReports = (userId?: string) => readFavorites(userId);

export const isFavoriteReport = (reportId: string, userId?: string) =>
  readFavorites(userId).some((entry) => entry.report.id === reportId);

export const toggleFavoriteReport = (entry: FavoriteReportEntry, userId?: string) => {
  const current = readFavorites(userId);
  const exists = current.some((item) => item.report.id === entry.report.id);
  const next = exists
    ? current.filter((item) => item.report.id !== entry.report.id)
    : [{ ...entry, userId }, ...current];
  writeFavorites(next, userId);
  return !exists;
};

export const updateFavoriteReportMetrics = (reportId: string, metrics: ReportMetrics, userId?: string) => {
  const current = readFavorites(userId);
  if (!current.some((entry) => entry.report.id === reportId)) return;
  const next = current.map((entry) =>
    entry.report.id === reportId
      ? { ...entry, report: { ...entry.report, metrics } }
      : entry
  );
  writeFavorites(next, userId);
  if (userId) {
    void persistFavoriteReportsToBackend(userId).catch(() => undefined);
  }
};

const normalizeFavoriteEntries = (value: unknown): FavoriteReportEntry[] => {
  if (!Array.isArray(value)) return [];
  return value as FavoriteReportEntry[];
};

export const syncFavoriteReportsFromBackend = async (userId?: string) => {
  if (!userId) return readFavorites(userId);

  try {
    const preferences = await getUserPreferences();
    const items = normalizeFavoriteEntries(preferences.favorite_reports);
    writeFavorites(items, userId);
    return items;
  } catch {
    return readFavorites(userId);
  }
};

export const persistFavoriteReportsToBackend = async (userId?: string) => {
  if (!userId) return readFavorites(userId);

  const current = readFavorites(userId);
  const updated = await updateUserPreferences({ favorite_reports: current });
  const items = normalizeFavoriteEntries(updated.favorite_reports);
  writeFavorites(items, userId);
  return items;
};

export const toggleFavoriteReportRemote = async (entry: FavoriteReportEntry, userId?: string) => {
  const previous = readFavorites(userId);
  const nextValue = toggleFavoriteReport(entry, userId);

  if (!userId) return nextValue;

  try {
    await persistFavoriteReportsToBackend(userId);
    return nextValue;
  } catch (error) {
    writeFavorites(previous, userId);
    throw error;
  }
};

export const subscribeFavoriteReports = (callback: () => void) => {
  if (typeof window === 'undefined') return () => undefined;
  const handler = () => callback();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener('storage', handler);
  };
};
