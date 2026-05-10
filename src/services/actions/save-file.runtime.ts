import definition from "./save-file.definition";
import { BaseAction } from "@/types/actions";

interface SaveFileActionConfig {
  filename: string;
  content: string;
  mimeType?: string;
}

interface SaveFileActionOutput {
  filename: string;
  mimeType: string;
  size: number;
  savedAt: number;
}

export class SaveFileAction extends BaseAction<
  SaveFileActionConfig,
  SaveFileActionOutput
> {
  constructor() {
    super(definition);
  }

  async execute(
    config: SaveFileActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data?: SaveFileActionOutput) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    const { filename, content, mimeType = "text/plain" } = config;

    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      onSuccess({
        filename,
        mimeType,
        size: blob.size,
        savedAt: Date.now(),
      });
    } catch (error) {
      onError(new Error(`Failed to save file: ${error}`));
    }
  }
}
