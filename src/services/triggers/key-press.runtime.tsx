import definition from "./key-press.definition";
import { BaseTrigger } from "@/types/triggers";

interface KeyPressTriggerConfig {
  keyCombo: string;
}
interface KeyPressTriggerOutput {
  keyCombo: string;
  timestamp: number;
}

export class KeyPressTrigger extends BaseTrigger<
  KeyPressTriggerConfig,
  KeyPressTriggerOutput
> {
  constructor() {
    super(definition);
  }

  async setup(
    config: KeyPressTriggerConfig,
    _workflowId: string,
    _nodeId: string,
    onTrigger: (data: KeyPressTriggerOutput) => Promise<void>,
  ): Promise<(() => void) | void> {
    const { keyCombo } = config;
    if (!keyCombo) {
      console.warn("No key combination configured for key press trigger");
      return;
    }
    const handleKeyPress = async (event: KeyboardEvent) => {
      const pressedCombo = this.formatKeyCombo(event);
      if (pressedCombo === keyCombo) {
        event.preventDefault();
        await onTrigger({ keyCombo: pressedCombo, timestamp: Date.now() });
      }
    };
    window.addEventListener("keyup", handleKeyPress);
    return () => window.removeEventListener("keyup", handleKeyPress);
  }

  private formatKeyCombo(event: KeyboardEvent): string {
    const keys: string[] = [];
    if (event.ctrlKey) keys.push("Ctrl");
    if (event.altKey) keys.push("Alt");
    if (event.metaKey) keys.push("Meta");
    if (event.shiftKey) keys.push("Shift");
    const mainKey = event.key;
    if (!["Control", "Shift", "Alt", "Meta"].includes(mainKey))
      keys.push(mainKey.length === 1 ? mainKey.toUpperCase() : mainKey);
    return keys.join(" + ");
  }
}
