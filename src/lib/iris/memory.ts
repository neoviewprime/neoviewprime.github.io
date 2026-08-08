import { getClientId } from '@/lib/clientIdentity';
import type { IrisPerception } from './types';

type IrisMemoryEvent = {
  id: string;
  createdAt: string;
  action: string;
  indicators: string[];
  companies: string[];
  years: number[];
  page?: string;
};

const MEMORY_VERSION = 'v1';
const MAX_EVENTS = 16;

const storageKey = () => `neoview-iris-memory-${MEMORY_VERSION}-${getClientId()}`;

const readMemory = (): IrisMemoryEvent[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(storageKey());
    return raw ? JSON.parse(raw) as IrisMemoryEvent[] : [];
  } catch {
    return [];
  }
};

const writeMemory = (events: IrisMemoryEvent[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey(), JSON.stringify(events.slice(-MAX_EVENTS)));
};

export const irisMemory = {
  recordPerception(perception: IrisPerception) {
    const hasRelevantContext =
      perception.indicators.length > 0 ||
      perception.companies.length > 0 ||
      perception.years.length > 0 ||
      Boolean(perception.pageContext?.page);

    if (!hasRelevantContext) return;

    const events = readMemory();
    writeMemory([
      ...events,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
        action: perception.action,
        indicators: perception.indicators,
        companies: perception.companies,
        years: perception.years,
        page: perception.pageContext?.page
      }
    ]);
  },

  summarizeRelevant(perception: IrisPerception) {
    const events = readMemory();
    const related = events
      .filter((event) =>
        event.indicators.some((indicator) => perception.indicators.includes(indicator)) ||
        event.companies.some((company) => perception.companies.includes(company)) ||
        (event.page && event.page === perception.pageContext?.page)
      )
      .slice(-3);

    if (related.length === 0) return '';

    return related
      .map((event) => [event.action, event.indicators.join('/'), event.companies.join('/'), event.years.join('/')].filter(Boolean).join(' '))
      .join(' | ');
  }
};
