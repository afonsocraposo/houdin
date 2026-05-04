import definition from "./popup.definition";
import { BaseTrigger } from "@/types/triggers";
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
  constructor() {
    super(definition);
  }
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
    this.messageListener = (
      message: CustomMessage,
      _sender: any,
      sendResponse: any,
    ) => {
      if (
        message.type === MessageType.POPUP_TRIGGER &&
        message.data.workflowId === workflowId
      ) {
        onTrigger({ timestamp: Date.now() });
        sendResponse({ success: true });
      }
    };
    browser.runtime.onMessage.addListener(this.messageListener);
  }

  async cleanup(): Promise<void> {
    if (this.messageListener) {
      browser.runtime.onMessage.removeListener(this.messageListener);
      this.messageListener = undefined;
    }
  }
}
