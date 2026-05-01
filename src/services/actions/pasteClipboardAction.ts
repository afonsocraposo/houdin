import { BaseAction, ActionMetadata } from "@/types/actions";
import { NotificationService } from "@/services/notification";
import { readClipboard } from "@/utils/helpers";

interface PasteClipboardActionConfig {}

interface PasteClipboardActionOutput {
  text: string;
  html?: string;
}

export class PasteClipboardAction extends BaseAction<
  PasteClipboardActionConfig,
  PasteClipboardActionOutput
> {
  static readonly metadata: ActionMetadata = {
    type: "paste-clipboard",
    label: "Paste from Clipboard",
    icon: "📥",
    description: "Paste clipboard contents into the focused field",
  };

  static readonly configSchema = {
    properties: {},
  };

  readonly outputExample = {
    text: "Pasted clipboard text",
    html: "<a href=\"https://example.com\">Pasted clipboard text</a>",
  };

  async execute(
    _config: PasteClipboardActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data?: PasteClipboardActionOutput) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    try {
      const { text, html } = await readClipboard();
      const element = document.activeElement;

      if (!element) {
        onError(new Error("No focused element available to paste into"));
        return;
      }

      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        const start = element.selectionStart ?? element.value.length;
        const end = element.selectionEnd ?? element.value.length;
        element.value = element.value.slice(0, start) + text + element.value.slice(end);
        const nextCursor = start + text.length;
        element.selectionStart = nextCursor;
        element.selectionEnd = nextCursor;
        element.dispatchEvent(new Event("input", { bubbles: true }));
        onSuccess({ text, html });
        return;
      }

      if (element instanceof HTMLElement && element.contentEditable === "true") {
        element.focus();
        if (html) {
          document.execCommand("insertHTML", false, html);
        } else {
          document.execCommand("insertText", false, text);
        }
        element.dispatchEvent(new Event("input", { bubbles: true }));
        onSuccess({ text, html });
        return;
      }

      onError(new Error("Focused element is not editable"));
    } catch (error) {
      NotificationService.showErrorNotification({
        message: "Failed to read clipboard",
      });
      onError(error as Error);
    }
  }
}
