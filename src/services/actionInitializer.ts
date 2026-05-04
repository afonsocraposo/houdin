import { ActionRegistry } from "./actionRegistry";
import { CopyContentAction } from "./actions/copy-content.runtime";
import { GetElementContentAction } from "./actions/get-element-content.runtime";
import { ShowModalAction } from "./actions/show-modal.runtime";
import { InjectComponentAction } from "./actions/inject-component.runtime";
import { CustomScriptAction } from "./actions/custom-script.runtime";
import { LLMOpenAIAction } from "./actions/llm-openai.runtime";
import { AIAction } from "./actions/ai.runtime";
import { InjectStyleAction } from "./actions/inject-style.runtime";
import { ClickElementAction } from "./actions/click-element.runtime";
import { ShowNotificationAction } from "./actions/show-notification.runtime";
import { HttpRequestAction } from "./actions/http-request.action.runtime";
import { WaitAction } from "./actions/wait.runtime";
import { NavigateUrlAction } from "./actions/navigate-url.runtime";
import { PressKeyAction } from "./actions/press-key.runtime";
import { TypeTextAction } from "./actions/type-text.runtime";
import { InputAction } from "./actions/input.runtime";
import { FormAction } from "./actions/form.runtime";
import { RemoveElementAction } from "./actions/remove-element.runtime";
import { WriteClipboardAction } from "./actions/write-clipboard.runtime";
import { LocalStorageAction } from "./actions/local-storage.runtime";
import { SessionStorageAction } from "./actions/session-storage.runtime";
import { CookiesAction } from "./actions/cookies.runtime";
import { IfAction } from "./actions/if.runtime";
import { FillFormAction } from "./actions/fill-form.runtime";
import { CreateVariableAction } from "./actions/create-variable.runtime";
import { OpenUrlAction } from "./actions/open-url.runtime";
import { PasteClipboardAction } from "./actions/paste-clipboard.runtime";

// Initialize and register all actions
export function initializeActions(): void {
  try {
    if (typeof document === "undefined") {
      throw new Error("Document is undefined");
    }
  } catch {
    console.warn("initializeActions called in non-DOM context");
    return;
  }
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
  registry.register(AIAction);
  registry.register(LLMOpenAIAction);
  registry.register(HttpRequestAction);
  registry.register(WaitAction);
  registry.register(NavigateUrlAction);
  registry.register(OpenUrlAction);
  registry.register(PressKeyAction);
  registry.register(TypeTextAction);
  registry.register(InputAction);
  registry.register(FormAction);
  registry.register(RemoveElementAction);
  registry.register(WriteClipboardAction);
  registry.register(LocalStorageAction);
  registry.register(SessionStorageAction);
  registry.register(CookiesAction);
  registry.register(IfAction);
  registry.register(FillFormAction);
  registry.register(CreateVariableAction);
  registry.register(PasteClipboardAction);
}

// Export registry instance for convenience
export const actionRegistry = ActionRegistry.getInstance();
