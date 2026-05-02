import definition from "./cookies.definition";
import { BaseAction } from "@/types/actions";
import browser from "@/services/browser";

interface CookiesActionConfig {
  operation:
    | "create"
    | "read"
    | "exists"
    | "update"
    | "delete"
    | "list"
    | "clear";
  key?: string; // Key for create, read, update, delete operations
  value?: string; // Value for create and update operations
  ttl?: number; // Time to live in seconds
}

interface CookieValue {
  domain: string | null;
  expires: number | null;
  partitioned: boolean;
  path: string;
  sameSite: string;
  secure: boolean;
  value: string;
}

interface CookiesActionOutput {
  key?: string;
  value?: CookieValue | null;
  exists?: boolean;
  operation: string;
  data?: Record<string, CookieValue>;
  cleared?: number;
  ttl?: number;
}

export class CookiesAction extends BaseAction<
  CookiesActionConfig,
  CookiesActionOutput
> {
  constructor() {
    super(definition);
  }

  async execute(
    config: CookiesActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data?: any) => void,
    onError: (error: Error) => void,
    tabId: number,
  ): Promise<void> {
    const { operation, key, value } = config;

    try {
      // get url of tabId
      const tab = await browser.tabs.get(tabId);
      const url = tab.url;
      const storeId = tab.cookieStoreId;

      if (!url) {
        onError(new Error("Could not get URL from tab"));
        return;
      }

      if (
        url.startsWith("chrome-extension://") ||
        url.startsWith("moz-extension://")
      ) {
        onError(new Error("Cannot access cookies for extension pages"));
        return;
      }

      switch (operation) {
        case "create":
        case "update":
          if (!key || !value) {
            onError(new Error("Key and value are required for operation."));
            return;
          }
          await browser.cookies.set({
            url,
            name: key,
            value: value,
            expirationDate: config.ttl
              ? Math.floor(Date.now() / 1000) + config.ttl
              : undefined,
            storeId,
          });
          onSuccess({ key, value, operation });
          return;
        case "read":
          if (!key) {
            onError(new Error("Key is required for read operation."));
            return;
          }
          const readValue = await browser.cookies.get({
            url: url,
            name: key,
            storeId,
          });
          if (!readValue) {
            onError(new Error(`No cookie found for key: ${key}`));
            return;
          }
          onSuccess({ key, value: readValue, operation });
          return;
        case "exists":
          if (!key) {
            onError(new Error("Key is required for exists operation."));
            return;
          }
          const existingCookie = await browser.cookies.get({
            url: url,
            name: key,
            storeId,
          });
          onSuccess({ key, exists: Boolean(existingCookie), operation });
          return;
        case "delete":
          if (!key) {
            onError(new Error("Key is required for delete operation."));
            return;
          }
          await browser.cookies.remove({
            url,
            name: key,
            storeId,
          });
          onSuccess({ key, operation });
          return;
        case "clear":
          const items = await browser.cookies.getAll({
            url,
            storeId,
          });
          const l = items.length;
          await Promise.all(
            items.map((item: any) =>
              browser.cookies.remove({ url, name: item.name }),
            ),
          );
          onSuccess({ operation, cleared: l });
          return;
        case "list":
          const allItems = await browser.cookies.getAll({ url, storeId });
          const data = allItems.reduce(
            (acc: Record<string, any>, item: any) => {
              if (item.name && item.value) {
                const { name, ...value } = item;
                acc[name] = value;
              }
              return acc;
            },
            {} as Record<string, any>,
          );
          onSuccess({ data, operation });
      }
    } catch (error) {
      onError(error as Error);
    }
  }
}
