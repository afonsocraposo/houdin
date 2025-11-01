import {
  BrowserContext,
  chromium,
  firefox,
  test as base,
} from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import { Buffer } from "buffer";
import net from "net";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
  baseUrl: string;
  popupUrl: string;
}>({
  context: async ({ browserName }, use) => {
    const pathToExtension = path.join(__dirname, "../dist");
    let context: BrowserContext;

    if (browserName === "firefox") {
      context = await firefox.launchPersistentContext("", {
        headless: false,
        args: ["-start-debugger-server", String(12345)],
        firefoxUserPrefs: {
          "devtools.debugger.remote-enabled": true,
          "devtools.debugger.prompt-connection": false,
          "xpinstall.signatures.required": false,
          "xpinstall.whitelist.required": false,
          "extensions.langpacks.signatures.required": false,
        },
      });
      await loadFirefoxAddon(12345, "localhost", pathToExtension);
    } else {
      // Chrome/Chromium
      context = await chromium.launchPersistentContext("", {
        headless: false,
        args: [
          process.env.CI ? `--headless=new` : "",
          `--disable-extensions-except=${pathToExtension}`,
          `--load-extension=${pathToExtension}`,
        ],
      });
    }
    await use(context);
    await context.close();
  },
  extensionId: async ({ context, browserName, page }, use) => {
    let extensionId: string;

    if (browserName === "firefox") {
      await page.goto("about:config");
      // search for "extensions.webextensions.uuids"
    } else {
      // For Chrome, get the dynamic extension ID from service worker
      let [background] = context.serviceWorkers();
      if (!background) {
        background = await context.waitForEvent("serviceworker");
      }
      extensionId = background.url().split("/")[2];
    }

    await use(extensionId);
  },
  baseUrl: async ({ extensionId, browserName }, use) => {
    let baseUrl: string;

    if (browserName === "firefox") {
      baseUrl = `moz-extension://${extensionId}/src/config/index.html#/`;
    } else {
      baseUrl = `chrome-extension://${extensionId}/src/config/index.html#/`;
    }

    await use(baseUrl);
  },
  popupUrl: async ({ extensionId, browserName }, use) => {
    let popupUrl: string;

    if (browserName === "firefox") {
      popupUrl = `moz-extension://${extensionId}/src/popup/index.html`;
    } else {
      popupUrl = `chrome-extension://${extensionId}/src/popup/index.html`;
    }

    await use(popupUrl);
  },
});

export const expect = test.expect;

const loadFirefoxAddon = (port: number, host: string, addonPath: string) => {
  return new Promise<boolean>((resolve) => {
    const socket = net.connect({
      port,
      host,
    });

    let success = false;

    socket.once("error", () => { });
    socket.once("close", () => {
      resolve(success);
    });

    const send = (data: Record<string, string>) => {
      const raw = Buffer.from(JSON.stringify(data));

      socket.write(`${raw.length}`);
      socket.write(":");
      socket.write(raw);
    };

    send({
      to: "root",
      type: "getRoot",
    });

    const onMessage = (message: any) => {
      if (message.addonsActor) {
        send({
          to: message.addonsActor,
          type: "installTemporaryAddon",
          addonPath,
        });
      }

      if (message.addon) {
        success = true;
        socket.end();
      }

      if (message.error) {
        socket.end();
      }
    };

    const buffers: Buffer[] = [];
    let remainingBytes = 0;

    socket.on("data", (data) => {
      while (true) {
        if (remainingBytes === 0) {
          const index = data.indexOf(":");

          buffers.push(data);

          if (index === -1) {
            return;
          }

          const buffer = Buffer.concat(buffers);
          const bufferIndex = buffer.indexOf(":");

          buffers.length = 0;
          remainingBytes = Number(buffer.subarray(0, bufferIndex).toString());

          if (!Number.isFinite(remainingBytes)) {
            throw new Error("Invalid state");
          }

          data = buffer.subarray(bufferIndex + 1);
        }

        if (data.length < remainingBytes) {
          remainingBytes -= data.length;
          buffers.push(data);
          break;
        } else {
          buffers.push(data.subarray(0, remainingBytes));

          const buffer = Buffer.concat(buffers);
          buffers.length = 0;

          const json = JSON.parse(buffer.toString());
          queueMicrotask(() => {
            onMessage(json);
          });

          const remainder = data.subarray(remainingBytes);
          remainingBytes = 0;

          if (remainder.length === 0) {
            break;
          } else {
            data = remainder;
          }
        }
      }
    });
  });
};

const extractExtensionUuid = (userPrefsFileContent: string): string => {
  const usersPrefsList = userPrefsFileContent.split(";");

  for (const currentPref of usersPrefsList) {
    if (currentPref.includes("extensions.webextensions.uuids")) {
      let uuid = currentPref
        .split(":")[1]
        ?.replace(/"/g, "")
        .replace(/}/g, "")
        .replace(/\)/g, "")
        .replace(/\\/g, "");

      if (uuid?.includes(",")) {
        uuid = uuid.split(",")[0];
      }

      if (uuid) {
        return uuid.trim();
      }
    }
  }

  throw new Error("Extension UUID not found in Firefox preferences");
};
