import { KeybindingSetter } from "../../components/KeybindingSetter";
import {
  BaseTrigger,
  TriggerConfigSchema,
  TriggerExecutionContext,
  TriggerSetupResult,
} from "../../types/triggers";

interface KeyPressTriggerConfig {
  keyCombo: string;
}

export class KeyPressTrigger extends BaseTrigger<KeyPressTriggerConfig> {
  readonly metadata = {
    type: "key-press",
    label: "Key Press",
    icon: "⌨️",
    description: "Trigger when a specific key combination is pressed",
  };

  getConfigSchema(): TriggerConfigSchema {
    return {
      properties: {
        keyCombo: {
          type: "custom",
          label: "Key Combination",
          description:
            "Set the key combination that will trigger this workflow",
          required: true,
          render: (
            values: Record<string, any>,
            onChange: (key: string, value: any) => void,
          ) => (
            <KeybindingSetter
              value={values.keyCombo}
              onChange={(combo) => onChange("keyCombo", combo)}
            />
          ),
        },
      },
    };
  }

  getDefaultConfig(): KeyPressTriggerConfig {
    return {
      keyCombo: "",
    };
  }

  async setup(
    config: KeyPressTriggerConfig,
    _context: TriggerExecutionContext,
    onTrigger: () => Promise<void>,
  ): Promise<TriggerSetupResult> {
    const { keyCombo } = config;

    if (!keyCombo) {
      console.warn("No key combination configured for key press trigger");
      return {};
    }

    const handleKeyPress = async (event: KeyboardEvent) => {
      const pressedCombo = this.formatKeyCombo(event);

      if (pressedCombo === keyCombo) {
        event.preventDefault();
        await onTrigger();
      }
    };

    // Add global key listener
    window.addEventListener("keyup", handleKeyPress);

    return {
      cleanup: () => {
        window.removeEventListener("keyup", handleKeyPress);
      },
    };
  }

  private formatKeyCombo(event: KeyboardEvent): string {
    const keys = [];

    if (event.ctrlKey) keys.push("Ctrl");
    if (event.altKey) keys.push("Alt");
    if (event.metaKey) keys.push("Meta");
    if (event.shiftKey) keys.push("Shift");

    const mainKey = event.key;

    if (!["Control", "Shift", "Alt", "Meta"].includes(mainKey)) {
      keys.push(mainKey.length === 1 ? mainKey.toUpperCase() : mainKey);
    }

    return keys.join(" + ");
  }
}
