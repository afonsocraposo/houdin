import { ContentInjector } from "../services/injector";

console.log("Content script loaded");

// Prevent multiple initializations
if ((window as any).changemeExtensionInitialized) {
  console.log("changeme extension already initialized, skipping");
} else {
  (window as any).changemeExtensionInitialized = true;

  let contentInjector: ContentInjector;

  const initContentScript = () => {
    console.log("changeme extension content script initialized");
    console.log(window);
    console.log(window.profitwell);

    contentInjector = new ContentInjector();
    contentInjector.initialize();
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
    (window as any).changemeExtensionInitialized = false;
  });
}
