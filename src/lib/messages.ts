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
  message: any,
): Promise<any> => {
  try {
    const tabs = await browserAPI.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tabs[0]?.id) {
      console.error("No active tab found.");
      return null;
    }
    const response = await browserAPI.tabs.sendMessage(tabs[0].id, message);
    return response;
  } catch (error) {
    console.error(`Error sending message to content script: ${error}`);
    return null;
  }
};
