import { sendMessageToContentScript } from "@/lib/messages";
import type {
  ElementSelectionPayload,
  ElementSelectionResponse,
  ElementSelectedDetail,
} from "@/types/element-selection";

const START_ELEMENT_SELECTION = "START_ELEMENT_SELECTION";

const RESTRICTED_URL_PREFIXES = [
  "chrome://",
  "chrome-extension://",
  "moz-extension://",
  "about:",
  "edge://",
  "brave://",
];

function isRestrictedUrl(url: string | undefined): boolean {
  if (!url) return true;
  return RESTRICTED_URL_PREFIXES.some((prefix) => url.startsWith(prefix));
}

export async function selectElementInTab(
  tabId: number,
  payload: ElementSelectionPayload,
): Promise<ElementSelectionResponse> {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (isRestrictedUrl(tab.url)) {
      return {
        ok: false,
        error:
          "Element selection is not available on this page. Navigate to a regular webpage.",
      };
    }
  } catch {
    return { ok: false, error: "Could not access the active tab." };
  }

  try {
    const response = (await sendMessageToContentScript(
      tabId,
      START_ELEMENT_SELECTION,
      payload,
    )) as ElementSelectionResponse | null;

    if (!response) {
      return { ok: false, error: "No response from content script" };
    }

    return response;
  } catch {
    return {
      ok: false,
      error:
        "Could not reach the page inspector. Try refreshing the page and trying again.",
    };
  }
}

export async function selectElementInPage(
  payload: ElementSelectionPayload,
): Promise<ElementSelectionResponse> {
  return await new Promise<ElementSelectionResponse>((resolve) => {
    const source = payload.source ?? "inspector";

    const onSelected = (event: Event) => {
      const customEvent = event as CustomEvent<{
        type: string;
        data: ElementSelectedDetail;
      }>;

      if (customEvent.detail?.type !== "elementSelected") {
        return;
      }

      if (customEvent.detail.data.source !== source) {
        return;
      }

      cleanup();
      resolve({ ok: true, canceled: false, data: customEvent.detail.data });
    };

    const onCanceled = (event: Event) => {
      const customEvent = event as CustomEvent<{ source?: string }>;
      if (customEvent.detail?.source !== source) {
        return;
      }

      cleanup();
      resolve({ ok: true, canceled: true });
    };

    const cleanup = () => {
      window.removeEventListener("houdinElementSelected", onSelected);
      window.removeEventListener("houdinElementSelectionCanceled", onCanceled);
    };

    window.addEventListener("houdinElementSelected", onSelected);
    window.addEventListener("houdinElementSelectionCanceled", onCanceled);

    window.dispatchEvent(
      new CustomEvent("houdinStartElementSelection", {
        detail: payload,
      }),
    );
  });
}
