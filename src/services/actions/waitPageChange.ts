import { BaseAction, ActionMetadata } from "@/types/actions";

const runtime = (typeof browser !== "undefined" ? browser : chrome) as any;

interface WaitPageChangeConfig {}

interface WaitPageChangeOutput {
  url: string;
}

export class WaitPageChangeAction extends BaseAction<WaitPageChangeConfig, WaitPageChangeOutput> {
  readonly metadata: ActionMetadata = {
    type: "wait-page-change",
    label: "Wait page change",
    icon: "⏳",
    description: "Wait for the page to change before proceeding",
  };

  readonly configSchema = {
    properties: {},
  };

  readonly outputExample = {
    url: "https://example.com/new-page",
  };

  async execute(
    _config: WaitPageChangeConfig,
    _context: any,
    _nodeId: string,
    onSuccess: (data: WaitPageChangeOutput) => void,
    onError: (error: Error) => void,
    tabId: number,
  ): Promise<void> {
    try {
      const url = await new Promise<any>((resolve) => {
        const onNavigationCompleted = (details: {
          tabId: number;
          url: string;
          frameId: number;
        }) => {
          if (details.tabId !== tabId || details.frameId !== 0) return; // Ensure we only resolve for the correct tab
          resolve(details.url);
          runtime.webNavigation.onCompleted.removeListener(
            onNavigationCompleted,
          );
        };
        runtime.webNavigation.onCompleted.addListener(onNavigationCompleted, {
          url: [{ schemes: ["http", "https"] }],
        });
      });
      onSuccess({ url });
    } catch (error) {
      onError(error as Error);
    }
  }
}
