import { BaseAction, ActionMetadata } from "@/types/actions";
import { copyToClipboard } from "@/utils/helpers";
import { textProperty } from "@/types/config-properties";

interface WriteClipboardActionConfig {
  text: string;
}

interface WriteClipboardActionOutput {
  text: string; // The copied text content
}

export class WriteClipboardAction extends BaseAction<
  WriteClipboardActionConfig,
  WriteClipboardActionOutput
> {
  static readonly metadata: ActionMetadata = {
    type: "write-clipboard",
    label: "Write to Clipboard",
    icon: "📋",
    description: "Copy text to clipboard",
  };

  readonly configSchema = {
    properties: {
      text: textProperty({
        label: "Text to Copy",
        description: "Text content to write to clipboard",
        required: true,
      }),
    },
  };

  readonly outputExample = {
    text: "This text was copied from the element.",
  };

  async execute(
    config: WriteClipboardActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data?: WriteClipboardActionOutput) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    const { text } = config;

    const success = await copyToClipboard(text);
    if (!success) {
      console.error("Failed to write to clipboard");
      onError(new Error("Failed to write to clipboard"));
    }
    onSuccess({ text });
  }
}
