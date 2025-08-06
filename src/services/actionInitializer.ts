import { ActionRegistry } from './actionRegistry';
import { CopyContentAction } from './actions/copyContentAction';
import { GetElementContentAction } from './actions/getElementContentAction';
import { ShowModalAction } from './actions/showModalAction';
import { InjectComponentAction } from './actions/injectComponentAction';
import { CustomScriptAction } from './actions/customScriptAction';
import { LLMOpenAIAction } from './actions/llmOpenAIAction';

// Initialize and register all actions
export function initializeActions(): void {
  const registry = ActionRegistry.getInstance();
  
  // Register all action implementations
  registry.register(new CopyContentAction());
  registry.register(new GetElementContentAction());
  registry.register(new ShowModalAction());
  registry.register(new InjectComponentAction());
  registry.register(new CustomScriptAction());
  registry.register(new LLMOpenAIAction());
}

// Export registry instance for convenience
export const actionRegistry = ActionRegistry.getInstance();