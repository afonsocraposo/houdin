import {
  BaseTrigger,
  TriggerMetadata,
  TriggerExecutionContext,
  TriggerSetupResult,
} from "../types/triggers";

export class TriggerRegistry {
  private static instance: TriggerRegistry;
  private triggers = new Map<string, BaseTrigger>();
  private activeTriggers = new Map<string, TriggerSetupResult>(); // Track active triggers for cleanup

  private constructor() {}

  static getInstance(): TriggerRegistry {
    if (!TriggerRegistry.instance) {
      TriggerRegistry.instance = new TriggerRegistry();
    }
    return TriggerRegistry.instance;
  }

  // Register a new trigger
  register(trigger: BaseTrigger): void {
    this.triggers.set(trigger.metadata.type, trigger);
  }

  // Get trigger by type
  getTrigger(type: string): BaseTrigger | undefined {
    return this.triggers.get(type);
  }

  // Get all registered triggers
  getAllTriggers(): BaseTrigger[] {
    return Array.from(this.triggers.values());
  }

  // Get all trigger metadata for UI
  getAllTriggerMetadata(): TriggerMetadata[] {
    return this.getAllTriggers().map((trigger) => trigger.metadata);
  }

  // Setup a trigger
  async setupTrigger(
    type: string,
    config: Record<string, any>,
    context: TriggerExecutionContext,
    onTrigger: (data?: any) => Promise<void>,
  ): Promise<void> {
    console.log("setup trigger", type, config, context);
    const trigger = this.getTrigger(type);
    if (!trigger) {
      throw new Error(`Trigger type '${type}' not found in registry`);
    }

    // Validate configuration before setup
    const validation = trigger.validate(config);
    if (!validation.valid) {
      throw new Error(
        `Trigger configuration invalid: ${validation.errors.join(", ")}`,
      );
    }

    // Clean up existing trigger with same node ID if it exists
    // this.cleanupTrigger(context.triggerNode.id);

    // Setup with defaults applied
    const configWithDefaults = trigger.getConfigWithDefaults(config);
    console.log(`Setting up trigger: ${type} with config`, configWithDefaults);
    const setupResult = await trigger.setup(
      configWithDefaults,
      context,
      onTrigger,
    );

    // Store the setup result for cleanup
    if (setupResult.cleanup) {
      this.activeTriggers.set(context.triggerNode.id, setupResult);
    }
  }

  // Cleanup a specific trigger
  cleanupTrigger(nodeId: string): void {
    const triggerSetup = this.activeTriggers.get(nodeId);
    if (triggerSetup?.cleanup) {
      triggerSetup.cleanup();
      this.activeTriggers.delete(nodeId);
    }
  }

  // Cleanup all active triggers
  cleanupAllTriggers(): void {
    this.activeTriggers.forEach((triggerSetup) => {
      if (triggerSetup.cleanup) {
        triggerSetup.cleanup();
      }
    });
    this.activeTriggers.clear();
  }

  // Validate trigger configuration
  validateConfig(
    type: string,
    config: Record<string, any>,
  ): { valid: boolean; errors: string[] } {
    const trigger = this.getTrigger(type);
    if (!trigger) {
      return { valid: false, errors: [`Trigger type '${type}' not found`] };
    }

    return trigger.validate(config);
  }

  // Get default configuration for a trigger
  getDefaultConfig(type: string): Record<string, any> | null {
    const trigger = this.getTrigger(type);
    return trigger ? trigger.getDefaultConfig() : null;
  }

  // Get configuration schema for a trigger
  getConfigSchema(type: string) {
    const trigger = this.getTrigger(type);
    return trigger ? trigger.getConfigSchema() : null;
  }

  // Check if trigger type exists
  hasTrigger(type: string): boolean {
    return this.triggers.has(type);
  }

  // Get trigger categories for UI (compatible with existing NODE_CATEGORIES)
  getTriggerCategories() {
    return {
      triggers: this.getAllTriggers().map((trigger) => ({
        type: trigger.metadata.type,
        label: trigger.metadata.label,
        icon: trigger.metadata.icon,
        description: trigger.metadata.description,
      })),
    };
  }
}
