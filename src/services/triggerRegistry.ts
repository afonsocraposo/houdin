import { ValidationResult } from "@/types/config-properties";
import { BaseTrigger, TriggerMetadata } from "@/types/triggers";

export class TriggerRegistry {
  private static instance: TriggerRegistry;
  private triggers = new Map<string, BaseTrigger>();

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
    return this.getAllTriggers()
      .map((trigger) => trigger.metadata)
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  // Setup a trigger
  async setupTrigger(
    type: string,
    config: Record<string, any>,
    workflowId: string,
    nodeId: string,
    onTrigger: (config: Record<string, any>, data?: any) => Promise<void>,
  ): Promise<void> {
    const trigger = this.getTrigger(type);
    if (!trigger) {
      throw new Error(`Trigger type '${type}' not found in registry`);
    }

    // Validate configuration before setup
    const validation = trigger.validate(config);
    if (!validation.valid) {
      throw new Error(
        `Trigger configuration invalid: ${JSON.stringify(validation.errors)}`,
      );
    }

    // Setup with defaults applied
    const configWithDefaults = trigger.getConfigWithDefaults(config);
    const onTriggerWrapper = async (data?: any) => {
      await onTrigger(configWithDefaults, data);
    };
    await trigger.setup(
      configWithDefaults,
      workflowId,
      nodeId,
      onTriggerWrapper,
    );
  }

  // Validate trigger configuration
  validateConfig(type: string, config: Record<string, any>): ValidationResult {
    const trigger = this.getTrigger(type);
    if (!trigger) {
      return {
        valid: false,
        errors: { "": [`Trigger type '${type}' not found`] },
      };
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
    return trigger ? trigger.configSchema : null;
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
