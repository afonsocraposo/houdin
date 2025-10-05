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
    description: "Write text to clipboard",
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
    _onError: (error: Error) => void,
  ): Promise<void> {
    const { text } = config;

    await copyToClipboard(text);
    onSuccess({ text });
  }
}
