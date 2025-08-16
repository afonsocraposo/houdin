import { BaseAction, ActionMetadata } from "../types/actions";
import { WorkflowExecutionContext } from "../types/workflow";
import { NotificationService } from "./notification";

export class ActionRegistry {
  private static instance: ActionRegistry;
  private actions = new Map<string, BaseAction>();

  private constructor() {}

  static getInstance(): ActionRegistry {
    if (!ActionRegistry.instance) {
      ActionRegistry.instance = new ActionRegistry();
    }
    return ActionRegistry.instance;
  }

  // Register a new action
  register(actionClass: any): void {
    try {
      const action = new actionClass();
      this.actions.set(action.metadata.type, action);
    } catch (error) {
      console.error("Error registering action:", error);
    }
  }

  // Get action by type
  getAction(type: string): BaseAction | undefined {
    return this.actions.get(type);
  }

  // Get all registered actions
  getAllActions(): BaseAction[] {
    return Array.from(this.actions.values());
  }

  // Get all action metadata for UI
  getAllActionMetadata(): ActionMetadata[] {
    return this.getAllActions().map((action) => action.metadata);
  }

  // Execute an action
  async execute(
    type: string,
    config: Record<string, any>,
    context: WorkflowExecutionContext,
    nodeId: string,
    onSuccess: (data?: any) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    const action = this.getAction(type);
    if (!action) {
      throw new Error(`Action type '${type}' not found in registry`);
    }

    // Validate configuration before execution
    const validation = action.validate(config);
    if (!validation.valid) {
      NotificationService.showErrorNotification({
        title: `Error executing action ${nodeId}`,
        message: `Action configuration invalid: ${validation.errors.join(", ")}`,
      });
    }

    // Execute with defaults applied
    const configWithDefaults = action.getConfigWithDefaults(config);
    try {
      await action.execute(
        configWithDefaults,
        context,
        nodeId,
        onSuccess,
        onError,
      );
    } catch (error: any) {
      onError(error);
    } finally {
      onSuccess();
    }
  }

  // Validate action configuration
  validateConfig(
    type: string,
    config: Record<string, any>,
  ): { valid: boolean; errors: string[] } {
    const action = this.getAction(type);
    if (!action) {
      return { valid: false, errors: [`Action type '${type}' not found`] };
    }

    return action.validate(config);
  }

  // Get default configuration for an action
  getDefaultConfig(type: string): Record<string, any> | null {
    const action = this.getAction(type);
    return action ? action.getDefaultConfig() : null;
  }

  // Get configuration schema for an action
  getConfigSchema(type: string) {
    const action = this.getAction(type);
    return action ? action.getConfigSchema() : null;
  }

  // Check if action type exists
  hasAction(type: string): boolean {
    return this.actions.has(type);
  }

  // Get action categories for UI (compatible with existing NODE_CATEGORIES)
  getActionCategories() {
    return {
      actions: this.getAllActions().map((action) => ({
        type: action.metadata.type,
        label: action.metadata.label,
        icon: action.metadata.icon,
        description: action.metadata.description,
      })),
    };
  }
}
