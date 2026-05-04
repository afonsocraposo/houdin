import { ActionRegistry } from "./actionRegistry";
import { CustomScriptAction } from "./actions/custom-script.runtime";
import { AIAction } from "./actions/ai.runtime";
import { LLMOpenAIAction } from "./actions/llm-openai.runtime";
import { WaitAction } from "./actions/wait.runtime";
import { NavigateUrlAction } from "./actions/navigate-url.runtime";
import { CookiesAction } from "./actions/cookies.runtime";
import { OpenUrlAction } from "./actions/open-url.runtime";

export function initializeBackgroundActions(): void {
  const registry = ActionRegistry.getInstance();
  // Actions to run in background
  registry.register(WaitAction);
  registry.register(CustomScriptAction);
  registry.register(NavigateUrlAction);
  registry.register(OpenUrlAction);
  registry.register(CookiesAction);
  registry.register(AIAction);
  registry.register(LLMOpenAIAction);
}
