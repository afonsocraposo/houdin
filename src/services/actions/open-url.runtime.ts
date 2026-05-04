import definition from "./open-url.definition";
import { BaseAction } from "@/types/actions";

import browser from "@/services/browser";
interface OpenActionConfig {
  url: string;
  focus: boolean;
}

interface OpenActionOutput {
  url: string;
}

export class OpenUrlAction extends BaseAction<
  OpenActionConfig,
  OpenActionOutput
> {
  constructor() {
    super(definition);
  }

  async execute(
    config: OpenActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data: OpenActionOutput) => void,
    onError: (error: Error) => void,
    tabId: number,
  ): Promise<void> {
    const { url, focus } = config;

    try {
      await browser.tabs.create({ url, active: focus, openerTabId: tabId });
      onSuccess({ url });
    } catch (error) {
      onError(error as Error);
    }
  }
}
