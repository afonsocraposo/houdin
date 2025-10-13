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
import { WaitAction } from "./actions/waitAction";
import { NavigateUrlAction } from "./actions/navigateUrlAction";
import { PressKeyAction } from "./actions/pressKeyAction";
import { TypeTextAction } from "./actions/typeTextAction";
import { InputAction } from "./actions/inputAction";
import { FormAction } from "./actions/formAction";
import { RemoveElementAction } from "./actions/removeElementAction";
import { WriteClipboardAction } from "./actions/writeClipboardAction";
import { LocalStorageAction } from "./actions/localStorageAction";
import { SessionStorageAction } from "./actions/sessionStorageAction";
import { CookiesAction } from "./actions/cookiesAction";

// Initialize and register all actions
export function initializeActions(): void {
  const registry = ActionRegistry.getInstance();

  // Actions to run in the content
  registry.register(CopyContentAction);
  registry.register(GetElementContentAction);
  registry.register(ClickElementAction);
  registry.register(ShowModalAction);
  registry.register(ShowNotificationAction);
  registry.register(InjectComponentAction);
  registry.register(InjectStyleAction);
  registry.register(CustomScriptAction);
  registry.register(LLMOpenAIAction);
  registry.register(HttpRequestAction);
  registry.register(WaitAction);
  registry.register(NavigateUrlAction);
  registry.register(PressKeyAction);
  registry.register(TypeTextAction);
  registry.register(InputAction);
  registry.register(FormAction);
  registry.register(RemoveElementAction);
  registry.register(WriteClipboardAction);
  registry.register(LocalStorageAction);
  registry.register(SessionStorageAction);
  registry.register(CookiesAction);
}

export function initializeBackgroundActions(): void {
  const registry = ActionRegistry.getInstance();

  // Actions to run in background
  registry.register(WaitAction);
  registry.register(CustomScriptAction);
  registry.register(NavigateUrlAction);
}

// Export registry instance for convenience
export const actionRegistry = ActionRegistry.getInstance();
