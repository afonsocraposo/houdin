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

  async setup(
    _config: PopupTriggerConfig,
    workflowId: string,
    _nodeId: string,
    onTrigger: (data: PopupTriggerOutput) => Promise<void>,
  ): Promise<() => void> {
    const messageListener = (
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
    browser.runtime.onMessage.addListener(messageListener);
    return () => browser.runtime.onMessage.removeListener(messageListener);
  }
}
