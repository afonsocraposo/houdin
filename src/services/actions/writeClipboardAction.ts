import { BaseAction, ActionMetadata } from "@/types/actions";
import { writeClipboard } from "@/utils/helpers";
import { booleanProperty, textProperty } from "@/types/config-properties";

interface WriteClipboardActionConfig {
  text: string;
  richText?: boolean;
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

  static readonly configSchema = {
    properties: {
      text: textProperty({
        label: "Text to Copy",
        description: "Text content to write to clipboard",
        required: true,
      }),
      richText: booleanProperty({
        label: "Rich Text",
        description:
          "Preserve HTML so rich text editors can paste formatted content",
        required: false,
        defaultValue: false,
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
    const { text, richText = false } = config;

    const success = await writeClipboard(text, richText);
    if (!success) {
      console.error("Failed to write to clipboard");
      onError(new Error("Failed to write to clipboard"));
      return;
    }
    onSuccess({ text });
  }
}
