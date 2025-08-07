import { KeybindingSetter } from "../../components/KeybindingSetter";
import {
  BaseTrigger,
  TriggerConfigSchema,
  TriggerExecutionContext,
  TriggerSetupResult,
} from "../../types/triggers";

export class KeyPressTrigger extends BaseTrigger {
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
          render: (values: Record<string, any>, onChange: (key: string, value: any) => void) => {
            console.log("Custom render function called", values);
            return <div style={{padding: '10px', border: '1px solid #ccc', borderRadius: '4px'}}>
              <div>Custom Key Binding Component</div>
              <KeybindingSetter 
                value={values.keyCombo} 
                onChange={(combo) => onChange('keyCombo', combo)}
              />
            </div>;
          },
        },
      },
    };
  }

  getDefaultConfig(): Record<string, any> {
    return {
      keyCombo: "",
    };
  }

  async setup(
    config: Record<string, any>,
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
