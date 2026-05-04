import definition from "./navigate-url.definition";
import { BaseAction } from "@/types/actions";
import browser from "@/services/browser";

interface NavigateActionConfig {
  url: string;
}

interface NavigateActionOutput {
  url: string;
}

export class NavigateUrlAction extends BaseAction<
  NavigateActionConfig,
  NavigateActionOutput
> {
  constructor() {
    super(definition);
  }

  async execute(
    config: NavigateActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data: NavigateActionOutput) => void,
    onError: (error: Error) => void,
    tabId: number,
  ): Promise<void> {
    const { url } = config;

    try {
      await browser.tabs.update(tabId, { url });
      const newUrl = await new Promise<any>((resolve) => {
        const onNavigationCompleted = (details: {
          tabId: number;
          frameId: number;
        }) => {
          if (details.tabId !== tabId || details.frameId !== 0) return;
          resolve(url);
          browser.webNavigation.onCompleted.removeListener(
            onNavigationCompleted,
          );
        };
        browser.webNavigation.onCompleted.addListener(onNavigationCompleted, {
          url: [{ schemes: ["http", "https"], urlPrefix: url }],
        });
      });
      onSuccess({ url: newUrl });
    } catch (error) {
      onError(error as Error);
    }
  }
}
