console.log("Background script loaded");

const runtime = (typeof browser !== "undefined" ? browser : chrome) as any;

interface HttpRequest {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

interface HttpResponse {
  ok: boolean;
  status: number;
  statusText: string;
  data?: any;
  error?: string;
}

runtime.runtime.onMessage.addListener(
  (message: any, _sender: any, sendResponse: (response: any) => void) => {
    if (message.type === "HTTP_REQUEST") {
      handleHttpRequest(message.request as HttpRequest)
        .then((response) => sendResponse({ success: true, response }))
        .catch((error) =>
          sendResponse({ success: false, error: error.message }),
        );
      return true; // Will respond asynchronously
    }

    if (message.type === "ELEMENT_SELECTED") {
      // Handle element selection
      console.debug("Element selected:", message);

      // Store the selected element info for later use
      runtime.storage.local.set({
        lastSelectedElement: {
          selector: message.selector,
          element: message.element,
          timestamp: Date.now(),
        },
      });

      return true;
    }
  },
);

async function handleHttpRequest(request: HttpRequest): Promise<HttpResponse> {
  try {
    const fetchOptions: RequestInit = {
      method: request.method || "GET",
      headers: request.headers || {},
    };

    if (
      request.body &&
      (request.method === "POST" ||
        request.method === "PUT" ||
        request.method === "PATCH")
    ) {
      fetchOptions.body = request.body;
    }

    const response = await fetch(request.url, fetchOptions);

    let data: any;
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      statusText: "Network Error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

runtime.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});

// For manifest v2, use browserAction instead of action
if (runtime.browserAction) {
  runtime.browserAction.onClicked.addListener((tab: any) => {
    console.log("Extension icon clicked", tab);
  });
} else if (runtime.action) {
  runtime.action.onClicked.addListener((tab: any) => {
    console.log("Extension icon clicked", tab);
  });
}

// Handle navigation to changeme.config
runtime.tabs.onUpdated.addListener((tabId: number, changeInfo: any) => {
  if (changeInfo.url && changeInfo.url.includes("changeme.config")) {
    // Redirect to the config page
    const configUrl = runtime.runtime.getURL("src/config/config.html");
    runtime.tabs.update(tabId, { url: configUrl });
  }
});

// Alternative: Listen for navigation attempts
if (runtime.webNavigation) {
  runtime.webNavigation.onBeforeNavigate.addListener((details: any) => {
    if (details.url.includes("changeme.config")) {
      const configUrl = runtime.runtime.getURL("src/config/config.html");
      runtime.tabs.update(details.tabId, { url: configUrl });
    }
  });
}
