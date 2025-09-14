import { KeybindingSetter } from "@/components/KeybindingSetter";
import {
  BaseAction,
  ActionConfigSchema,
  ActionMetadata,
} from "@/types/actions";

interface PressKeyActionConfig {
  keyCombo: string;
}

export class PressKeyAction extends BaseAction<PressKeyActionConfig> {
  readonly metadata: ActionMetadata = {
    type: "press-key",
    label: "Press Key",
    icon: "⌨️",
    description: "Press a key or combination",
  };

  getConfigSchema(): ActionConfigSchema {
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

  async execute(
    config: PressKeyActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data?: any) => void,
    _onError: (error: Error) => void,
  ): Promise<void> {
    const { keyCombo } = config;

    // Simulate a key press
    const event = new KeyboardEvent("keydown", {
      key: keyCombo,
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(event);
    onSuccess({
      keyCombo,
      timestamp: Date.now(),
    });
  }
}
