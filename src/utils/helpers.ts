export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    // Fallback for older browsers or when clipboard API is not available
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textArea);
      return success;
    } catch (fallbackError) {
      console.error("Fallback copy method also failed:", fallbackError);
      return false;
    }
  }
};

export const generateId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

export const getElement = (
  selector: string,
  selectorType: "css" | "xpath" | "text",
): Element | null => {
  if (selectorType === "css") {
    return document.querySelector(selector);
  } else if (selectorType === "xpath") {
    const result = document.evaluate(
      selector,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    );
    return result.singleNodeValue as Element | null;
  } else if (selectorType === "text") {
    // For text, we can use an xpath selector that matches text content
    const xpathSelector = `//*[contains(text(), '${selector}')]`;
    const result = document.evaluate(
      xpathSelector,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    );
    return result.singleNodeValue as Element | null;
  }
  return null;
};

export const deepCopy = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};
