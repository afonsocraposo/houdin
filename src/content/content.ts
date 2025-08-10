import { ContentInjector } from "../services/injector";
import { HttpListenerServiceV3 } from "../services/httpListenerV3";

console.debug("Content script loaded");

// Prevent multiple initializations
if ((window as any).changemeExtensionInitialized) {
  console.debug("changeme extension already initialized, skipping");
} else {
  (window as any).changemeExtensionInitialized = true;

  let contentInjector: ContentInjector;
  let httpListener: HttpListenerServiceV3;
  const runtime = (typeof browser !== "undefined" ? browser : chrome) as any;

  const initContentScript = () => {
    console.debug("changeme extension content script initialized");

    // Initialize content injector
    contentInjector = new ContentInjector();
    contentInjector.initialize();

    // Initialize HTTP listener for triggers
    httpListener = HttpListenerServiceV3.getInstance(runtime);
    
    // Request current triggers from background
    runtime.runtime.sendMessage({ type: "GET_HTTP_TRIGGERS" }, (response: any) => {
      if (response && response.triggers) {
        console.debug("Content: Received HTTP triggers", response.triggers.length);
        httpListener.updateTriggers(response.triggers);
      }
    });
  };

  // Listen for trigger updates from background script
  runtime.runtime.onMessage.addListener((message: any) => {
    if (message.type === "UPDATE_HTTP_TRIGGERS") {
      console.debug("Content: Updating HTTP triggers", message.triggers.length);
      if (httpListener) {
        httpListener.updateTriggers(message.triggers);
      }
    }
  });

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initContentScript);
  } else {
    initContentScript();
  }

  // Cleanup on page unload
  window.addEventListener("beforeunload", () => {
    if (contentInjector) {
      contentInjector.destroy();
    }
    if (httpListener) {
      httpListener.destroy();
    }
    (window as any).changemeExtensionInitialized = false;
  });
}
