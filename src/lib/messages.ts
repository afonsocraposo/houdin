const browserAPI = (typeof browser !== "undefined" ? browser : chrome) as any;

export const sendMessageToBackground = async (message: any): Promise<any> => {
  try {
    return await browserAPI.runtime.sendMessage(message);
  } catch (error) {
    console.error(`Error sending message to background: ${error}`);
    return null;
  }
};

export const sendMessageToContentScript = async (
  tabId: number,
  message: any,
): Promise<any> => {
  console.log(`Sending message to content script in tab ${tabId}:`, message);
  try {
    const response = await browserAPI.tabs.sendMessage(tabId, message);
    return response;
  } catch (error) {
    console.error(`Error sending message to content script: ${error}`);
    return null;
  }
};
