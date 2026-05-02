import { TriggerRegistry } from "./triggerRegistry";
import { PageLoadTrigger } from "./triggers/page-load.runtime";
import { ComponentLoadTrigger } from "./triggers/component-load.runtime";
import { DelayTrigger } from "./triggers/delay.runtime";
import { KeyPressTrigger } from "./triggers/key-press.runtime";
import { HttpRequestTrigger } from "./triggers/http-request-trigger.runtime";
import { ButtonClickTrigger } from "./triggers/button-click.runtime";
import { PopupTrigger } from "./triggers/popup.runtime";

// Initialize and register all triggers
export function initializeTriggers(): void {
  const registry = TriggerRegistry.getInstance();

  // Register all built-in triggers
  registry.register(new PageLoadTrigger());
  registry.register(new ComponentLoadTrigger());
  registry.register(new DelayTrigger());
  registry.register(new KeyPressTrigger());
  registry.register(new HttpRequestTrigger());
  registry.register(new ButtonClickTrigger());
  registry.register(new PopupTrigger());
}

// Export for convenience
export { TriggerRegistry } from "./triggerRegistry";
