import { fakeBrowser } from "@webext-core/fake-browser";
import browser from "webextension-polyfill";

// Helper function to check if webextension APIs are available
export const isWebExtensionAPIAvailable = (): boolean => {
  try {
    return (
      (typeof chrome !== "undefined" && !!chrome.runtime?.id) ||
      (typeof browser !== "undefined" && !!browser.runtime)
    );
  } catch {
    return false;
  }
};

// Legacy function name for backward compatibility
export const isChromeAPIAvailable = isWebExtensionAPIAvailable;

// Create a webextension-polyfill compatible API wrapper
const getBrowserAPI = () => {
  try {
    if (isWebExtensionAPIAvailable()) {
      // import browser-polyfill dynamically
      return browser;
    }
  } catch (e) {
    console.error(e);
    console.error(
      "webextension-polyfill not available, using fake browser API",
    );
    // Ignore errors and fall back to fake browser
  }
  return fakeBrowser;
};

export const browserAPI = getBrowserAPI();
export default browserAPI;
