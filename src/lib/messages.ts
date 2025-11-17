import browser from "@/services/browser";

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
  return await browser.tabs
    .sendMessage(tabId, {
      type,
      data,
    } as CustomMessage<T>)
    .then(responseCallback);
};
