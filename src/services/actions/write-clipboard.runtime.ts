import definition from "./write-clipboard.definition";
import { BaseAction } from "@/types/actions";
import { writeClipboard } from "@/utils/helpers";
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
  constructor() {
    super(definition);
  }

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
