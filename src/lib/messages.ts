import browser from "@/services/browser";

const RECEIVING_END_ERRORS = [
  "Could not establish connection. Receiving end does not exist.",
  "Could not establish connection",
  "Receiving end does not exist",
];

const isReceivingEndError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return RECEIVING_END_ERRORS.some((value) => message.includes(value));
};

export const sendMessageToBackground = async <T>(
  type: string,
  data?: T,
): Promise<any> => {
  try {
    return await browser.runtime.sendMessage({
      type,
      data,
    } as CustomMessage<T>);
  } catch (error) {
    console.error(`Error sending message to background: ${error}`);
    return null;
  }
};

export interface CustomMessage<T = any> {
  type: string;
  data: T;
}

export const sendMessageToContentScript = async <T>(
  tabId: number,
  type: string,
  data?: T,
  responseCallback?: (response: any) => void,
): Promise<any> => {
  console.debug(`Sending message to content script in tab ${tabId}:`, {
    type,
    data,
  });

  const maxAttempts = 10;
  const retryDelayMs = 200;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await browser.tabs.sendMessage(tabId, {
        type,
        data,
      } as CustomMessage<T>);
      return responseCallback ? responseCallback(response) : response;
    } catch (error) {
      if (!isReceivingEndError(error) || attempt === maxAttempts) {
        throw error;
      }

      console.debug("Retrying content script message after connection error", {
        tabId,
        type,
        attempt,
      });
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }
};
