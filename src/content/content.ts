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

    // Initialize HTTP listener for triggers (now handles direct execution)
    httpListener = HttpListenerServiceV3.getInstance(runtime);
  };

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
