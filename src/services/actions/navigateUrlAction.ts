import {
  BaseAction,
  ActionConfigSchema,
  ActionMetadata,
} from "@/types/actions";

const runtime = (typeof browser !== "undefined" ? browser : chrome) as any;

interface NavigateActionConfig {
  url: string;
}

export class NavigateUrlAction extends BaseAction<NavigateActionConfig> {
  readonly metadata: ActionMetadata = {
    type: "navigate-url",
    label: "Navigate to URL",
    icon: "🌐",
    description: "Navigate to a specific URL",
  };

  getConfigSchema(): ActionConfigSchema {
    return {
      properties: {
        url: {
          type: "text",
          label: "URL destination",
          description: "The URL to navigate to",
          placeholder: "https://afonsoraposo.com",
          required: true,
        },
      },
    };
  }

  async execute(
    config: NavigateActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data?: any) => void,
    onError: (error: Error) => void,
    tabId: number,
  ): Promise<void> {
    const { url } = config;

    try {
      await runtime.tabs.update(tabId, { url });
      const newUrl = await new Promise<any>((resolve) => {
        const onNavigationCompleted = (details: {
          tabId: number;
          frameId: number;
        }) => {
          if (details.tabId !== tabId || details.frameId !== 0) return; // Ensure we only resolve for the correct tab
          resolve(url);
          runtime.webNavigation.onCompleted.removeListener(
            onNavigationCompleted,
          );
        };
        runtime.webNavigation.onCompleted.addListener(onNavigationCompleted, {
          url: [{ schemes: ["http", "https"], urlPrefix: url }],
        });
      });
      onSuccess({ url: newUrl });
    } catch (error) {
      onError(error as Error);
    }
  }
}
