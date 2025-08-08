import { ContentInjector } from "../services/injector";
import { initializeActions } from "../services/actionInitializer";

console.debug("Content script loaded");

// Initialize actions first
initializeActions();

// Prevent multiple initializations
if ((window as any).changemeExtensionInitialized) {
  console.debug("changeme extension already initialized, skipping");
} else {
  (window as any).changemeExtensionInitialized = true;

  let contentInjector: ContentInjector;

  const initContentScript = () => {
    console.debug("changeme extension content script initialized");

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
