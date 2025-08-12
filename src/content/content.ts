import { ContentInjector } from "../services/injector";

console.debug("Content script loaded");

// Prevent multiple initializations
if ((window as any).changemeExtensionInitialized) {
  console.debug("changeme extension already initialized, skipping");
} else {
  (window as any).changemeExtensionInitialized = true;

  let contentInjector: ContentInjector;

  const initContentScript = () => {
    console.debug("changeme extension content script initialized");

    // Initialize content injector
    contentInjector = new ContentInjector();
    contentInjector.initialize();

    // Set up bridge for workflow script responses
    setupWorkflowScriptBridge();
  };

  const setupWorkflowScriptBridge = () => {
    // Listen for workflow script responses from the main world
    window.addEventListener('message', (event) => {
      if (event.source === window && event.data.type === 'workflow-script-response') {
        // Forward the message to the extension
        chrome.runtime.sendMessage({
          type: 'workflow-script-response',
          nodeId: event.data.nodeId,
          result: event.data.result,
          error: event.data.error
        }).catch((error) => {
          console.error('Failed to send workflow script response:', error);
        });
      }
    });
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
