import { ActionRegistry } from "./actionRegistry";
import { CustomScriptAction } from "./actions/customScriptAction";
import { AIAction } from "./actions/aiAction";
import { LLMOpenAIAction } from "./actions/llmOpenAIAction";
import { WaitAction } from "./actions/waitAction";
import { NavigateUrlAction } from "./actions/navigateUrlAction";
import { CookiesAction } from "./actions/cookiesAction";
import { OpenUrlAction } from "./actions/openUrlAction";

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
