import { ActionRegistry } from "./actionRegistry";
import { CopyContentAction } from "./actions/copyContentAction";
import { GetElementContentAction } from "./actions/getElementContentAction";
import { ShowModalAction } from "./actions/showModalAction";
import { InjectComponentAction } from "./actions/injectComponentAction";
import { CustomScriptAction } from "./actions/customScriptAction";
import { LLMOpenAIAction } from "./actions/llmOpenAIAction";
import { InjectStyleAction } from "./actions/injectStyleAction";
import { ClickElementAction } from "./actions/clickElementAction";
import { ShowNotificationAction } from "./actions/showNotificationAction";
import { HttpRequestAction } from "./actions/httpRequestAction";

// Initialize and register all actions
export function initializeActions(): void {
  const registry = ActionRegistry.getInstance();

  // Register all action implementations
  registry.register(new CopyContentAction());
  registry.register(new GetElementContentAction());
  registry.register(new ClickElementAction());
  registry.register(new ShowModalAction());
  registry.register(new ShowNotificationAction());
  registry.register(new InjectComponentAction());
  registry.register(new InjectStyleAction());
  registry.register(new CustomScriptAction());
  registry.register(new LLMOpenAIAction());
  registry.register(new HttpRequestAction());
}

// Export registry instance for convenience
export const actionRegistry = ActionRegistry.getInstance();
