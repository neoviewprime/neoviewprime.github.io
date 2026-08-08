import type { ChatPageContext } from '@/types/backend';

export type IrisAction = 'greeting' | 'thanks' | 'capabilities' | 'memory' | 'show' | 'compare' | 'assess' | 'find' | 'guide';

export type IrisPerception = {
  normalizedQuestion: string;
  tokens: string[];
  action: IrisAction;
  years: number[];
  companies: string[];
  indicators: string[];
  wantsCompanyComparison: boolean;
  wantsIndicatorComparison: boolean;
  isNavigationLike: boolean;
  pageContext?: ChatPageContext | null;
};

export type IrisSource = {
  type: 'indicator' | 'report' | 'project';
  id: string;
  name: string;
  path: string[];
  description?: string;
  meta?: string;
  relevance_score?: number;
  hierarchy?: {
    companyId?: string;
    superintendenceId?: string;
    managementId?: string;
    projectId?: string;
  };
};

export type IrisAnswer = {
  answer: string;
  sources: IrisSource[];
  totalSources: number;
  intent: string;
  confidence: number;
  retrievalMode: string;
  trace?: {
    requestId: string;
    latencyMs: number;
    toolCalls: string[];
    validationWarnings: string[];
  };
};

export type IrisToolContext = {
  question: string;
  perception: IrisPerception;
  pageContext?: ChatPageContext | null;
};

export type IrisTool = {
  name: string;
  purpose: string;
  maxCalls?: number;
  canHandle: (context: IrisToolContext) => boolean;
  run: (context: IrisToolContext) => IrisAnswer | null;
};

export type IrisOrchestratorInput = {
  question: string;
  pageContext?: ChatPageContext | null;
  tools: IrisTool[];
  fallback: (context: IrisToolContext) => IrisAnswer;
};
