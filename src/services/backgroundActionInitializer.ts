import { ActionRegistry } from "./actionRegistry";
import { CustomScriptAction } from "./actions/customScriptAction";
import { LLMOpenAIAction } from "./actions/llmOpenAIAction";
import { WaitAction } from "./actions/waitAction";
import { NavigateUrlAction } from "./actions/navigateUrlAction";
import { CookiesAction } from "./actions/cookiesAction";

export function initializeBackgroundActions(): void {
  const registry = ActionRegistry.getInstance();
  // Actions to run in background
  registry.register(WaitAction);
  registry.register(CustomScriptAction);
  registry.register(NavigateUrlAction);
  registry.register(CookiesAction);
  registry.register(LLMOpenAIAction);
}
