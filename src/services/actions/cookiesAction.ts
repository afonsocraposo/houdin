import { BaseAction, ActionMetadata } from "@/types/actions";
import {
  numberProperty,
  selectProperty,
  textProperty,
} from "@/types/config-properties";

const runtime = (typeof browser !== "undefined" ? browser : chrome) as any;

interface CookiesActionConfig {
  operation: "create" | "read" | "update" | "delete" | "list" | "clear";
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
  operation: string;
  data?: Record<string, CookieValue>;
  cleared?: number;
  ttl?: number;
}

export class CookiesAction extends BaseAction<
  CookiesActionConfig,
  CookiesActionOutput
> {
  static readonly metadata: ActionMetadata = {
    type: "cookies",
    label: "Cookies",
    icon: "🍪",
    description:
      "Create, read, update, and delete items in the browser's cookies",
  };

  configSchema = {
    properties: {
      operation: selectProperty({
        label: "Operation",
        description: "The operation to perform on cookies",
        options: [
          { label: "List", value: "list" },
          { label: "Create", value: "create" },
          { label: "Read", value: "read" },
          { label: "Update", value: "update" },
          { label: "Delete", value: "delete" },
          { label: "Clear", value: "clear" },
        ],
        defaultValue: "list",
      }),
      key: textProperty({
        label: "Key",
        description: "The key of the item in cookies",
        placeholder: "foo",
        showWhen: {
          field: "operation",
          value: ["create", "read", "update", "delete"],
        },
        required: true,
      }),
      value: textProperty({
        label: "Value",
        description: "The value to store in cookies",
        placeholder: "bar",
        showWhen: {
          field: "operation",
          value: ["create", "update"],
        },
        required: true,
      }),
      ttl: numberProperty({
        label: "TTL",
        description:
          "Time to live in seconds. If set, the cookie will expire after this time.",
        placeholder: "3600",
        showWhen: {
          field: "operation",
          value: ["create", "update"],
        },
        required: false,
      }),
    },
  };

  readonly outputExample = {
    key: "foo",
    value: {
      domain: null,
      expires: 1775846367000,
      partitioned: false,
      path: "/",
      sameSite: "lax",
      secure: false,
      value: "bar",
    },
    operation: "read",
    data: {
      foo: {
        domain: null,
        expires: 1775846367000,
        partitioned: false,
        path: "/",
        sameSite: "lax",
        secure: false,
        value: "bar",
      },
    },
    cleared: 3,
    ttl: 3600,
  };

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
      const tab = await runtime.tabs.get(tabId);
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
          await runtime.cookies.set({
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
          const readValue = await runtime.cookies.get({
            url: url,
            name: key,
            storeId,
          });
          onSuccess({ key, value: readValue, operation });
          return;
        case "delete":
          if (!key) {
            onError(new Error("Key is required for delete operation."));
            return;
          }
          await runtime.cookies.remove({
            url,
            name: key,
            storeId,
          });
          onSuccess({ key, operation });
          return;
        case "clear":
          const items = await runtime.cookies.getAll({
            url,
            storeId,
          });
          const l = items.length;
          await Promise.all(
            items.map((item: any) =>
              runtime.cookies.remove({ url, name: item.name }),
            ),
          );
          onSuccess({ operation, cleared: l });
          return;
        case "list":
          const allItems = await runtime.cookies.getAll({ url, storeId });
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
