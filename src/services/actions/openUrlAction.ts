import { BaseAction, ActionMetadata } from "@/types/actions";
import { booleanProperty, textProperty } from "@/types/config-properties";
import { IconExternalLink } from "@tabler/icons-react";

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
  static readonly metadata: ActionMetadata = {
    type: "open-url",
    label: "Open URL",
    icon: IconExternalLink,
    description: "Open a URL in a new tab",
  };

  static readonly configSchema = {
    properties: {
      url: textProperty({
        label: "URL destination",
        description: "The URL to open",
        placeholder: "https://afonsoraposo.com",
        required: true,
      }),
      focus: booleanProperty({
        label: "Focus tab",
        description: "Whether to focus the new tab after opening",
        defaultValue: true,
      }),
    },
  };

  readonly outputExample = {
    url: "https://afonsoraposo.com",
  };

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
