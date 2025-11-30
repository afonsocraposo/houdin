import { BaseTrigger } from "@/types/triggers";
import { IconBrowserShare } from "@tabler/icons-react";
import browser from "@/services/browser";
import { CustomMessage } from "@/lib/messages";
import { MessageType } from "@/types/messages";

interface PopupTriggerConfig {}

interface PopupTriggerOutput {
  timestamp: number;
}

export class PopupTrigger extends BaseTrigger<
  PopupTriggerConfig,
  PopupTriggerOutput
> {
  static readonly metadata = {
    type: "popup",
    label: "Popup Click",
    icon: IconBrowserShare,
    description:
      "Triggers when the workflow is manually executed from the popup",
  };

  static readonly configSchema = {
    properties: {},
  };

  readonly outputExample = {
    timestamp: 1640995200000,
  };

  private messageListener?: (
    message: any,
    sender: any,
    sendResponse: any,
  ) => void;

  async setup(
    _config: PopupTriggerConfig,
    workflowId: string,
    _nodeId: string,
    onTrigger: (data: PopupTriggerOutput) => Promise<void>,
  ): Promise<void> {
    // Listen for popup trigger messages
    this.messageListener = (
      message: CustomMessage,
      _sender: any,
      sendResponse: any,
    ) => {
      if (
        message.type === MessageType.POPUP_TRIGGER &&
        message.data.workflowId === workflowId
      ) {
        onTrigger({
          timestamp: Date.now(),
        });
        sendResponse({ success: true });
      }
    };

    // Add the message listener
    browser.runtime.onMessage.addListener(this.messageListener);
  }

  async cleanup(): Promise<void> {
    if (this.messageListener) {
      browser.runtime.onMessage.removeListener(this.messageListener);
      this.messageListener = undefined;
    }
  }
}
