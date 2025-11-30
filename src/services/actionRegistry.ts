import { BaseAction, ActionMetadata } from "@/types/actions";
import { ValidationResult } from "@/types/config-properties";

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
      const action = new actionClass() as BaseAction;
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
    return this.getAllActions()
      .map((action) => action.metadata)
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  // Get all actions static data
  getAllStatic(): Record<string, any> {
    const staticData: Record<string, any> = {};
    for (const action of this.getAllActions()) {
      const { icon, ...rest } = action.metadata;
      staticData[action.metadata.type] = {
        metadata: {
          icon: icon instanceof Object ? `Icon${icon.displayName}` : icon,
          ...rest,
        },
        configSchema: action.configSchema,
        outputExample: action.outputExample,
      };
    }
    return staticData;
  }

  // Execute an action
  async execute(
    type: string,
    config: Record<string, any>,
    workflowId: string,
    nodeId: string,
    tabId?: number,
  ): Promise<{
    success: boolean;
    data?: any;
    error?: Error;
    outputHandle?: string;
    config: Record<string, any>;
  }> {
    const action = this.getAction(type);
    if (!action) {
      throw new Error(`Action type '${type}' not found in registry`);
    }

    // Validate configuration before execution
    const validation = action.validate(config);
    if (!validation.valid) {
      throw new Error(
        `Invalid configuration for action type '${type}': ${JSON.stringify(validation.errors)}`,
      );
    }

    // Execute with defaults applied
    const configWithDefaults = action.getConfigWithDefaults(config);
    const result = await new Promise<{
      success: boolean;
      data?: any;
      error?: Error;
      outputHandle?: string;
    }>((resolve) => {
      const onSuccess = (data?: any, outputHandle?: string) => {
        resolve({ success: true, data, outputHandle });
      };

      const onError = (error: Error) => {
        resolve({ success: false, error });
      };

      action
        .execute(
          configWithDefaults,
          workflowId,
          nodeId,
          onSuccess,
          onError,
          tabId,
        )
        .catch((error) => resolve({ success: false, error }));

      if (!action.metadata?.disableTimeout) {
        setTimeout(
          () =>
            resolve({
              success: false,
              error: new Error(`Action ${type} execution timed out`),
            }),
          10000,
        );
      }
    });
    return { ...result, config: configWithDefaults };
  }

  // Validate action configuration
  validateConfig(type: string, config: Record<string, any>): ValidationResult {
    const action = this.getAction(type);
    if (!action) {
      return {
        valid: false,
        errors: { "": [`Action type '${type}' not found`] },
      };
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
    return action ? action.configSchema : null;
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
