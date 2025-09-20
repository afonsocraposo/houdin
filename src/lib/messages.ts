const browserAPI = (typeof browser !== "undefined" ? browser : chrome) as any;

export const sendMessageToBackground = async <T>(
  type: string,
  data?: T,
  responseCallback?: (response: any) => void,
): Promise<any> => {
  try {
    return await browserAPI.runtime.sendMessage(
      {
        type,
        data,
      } as CustomMessage<T>,
      responseCallback,
    );
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
  return await browserAPI.tabs.sendMessage(
    tabId,
    {
      type,
      data,
    } as CustomMessage<T>,
    responseCallback,
  );
};
