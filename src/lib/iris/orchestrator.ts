import { irisMemory } from './memory';
import { perceiveIrisRequest } from './perception';
import { validateIrisAnswer } from './validation';
import type { IrisAnswer, IrisOrchestratorInput, IrisToolContext } from './types';

const MAX_TOOL_CALLS = 3;

const createRequestId = () => `iris-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const runIrisOrchestrator = (input: IrisOrchestratorInput): IrisAnswer => {
  const requestId = createRequestId();
  const startedAt = performance.now();
  const perception = perceiveIrisRequest(input.question, input.pageContext);
  const toolCalls: string[] = [];
  const context: IrisToolContext = {
    question: input.question,
    perception,
    pageContext: input.pageContext
  };

  irisMemory.recordPerception(perception);

  let result: IrisAnswer | null = null;
  for (const tool of input.tools) {
    if (toolCalls.length >= MAX_TOOL_CALLS) break;
    if (!tool.canHandle(context)) continue;

    toolCalls.push(tool.name);
    result = tool.run(context);
    if (result) break;
  }

  const rawAnswer = result ?? input.fallback(context);
  const validated = validateIrisAnswer(rawAnswer);

  return {
    ...validated.answer,
    trace: {
      requestId,
      latencyMs: Math.round(performance.now() - startedAt),
      toolCalls,
      validationWarnings: validated.warnings
    }
  };
};
