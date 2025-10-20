import { customAlphabet } from "nanoid";

const ALPHANUM =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

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

export const generateId = (prefix: string = "", len: number = 6): string => {
  const makeId = customAlphabet(ALPHANUM, len);
  if (prefix) {
    return prefix + "-" + makeId();
  }

  return makeId();
};
export function newWorkflowId(): string {
  return generateId("workflow", 12);
}
export function newExecutionId(): string {
  return generateId("exec", 12);
}

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

export function insertAtCursor(
  input: HTMLInputElement | HTMLTextAreaElement,
  text: string,
) {
  const start = input.selectionStart ?? 0;
  const end = input.selectionEnd ?? 0;
  const value = input.value;
  const newValue = value.slice(0, start) + text + value.slice(end);

  // React 16+ method to properly update controlled inputs
  // Get React's internal value setter
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;
  const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value",
  )?.set;

  // Use the appropriate setter based on element type
  if (input instanceof HTMLInputElement && nativeInputValueSetter) {
    nativeInputValueSetter.call(input, newValue);
  } else if (
    input instanceof HTMLTextAreaElement &&
    nativeTextAreaValueSetter
  ) {
    nativeTextAreaValueSetter.call(input, newValue);
  } else {
    // Fallback for edge cases
    input.value = newValue;
  }

  const newPos = start + text.length;
  input.setSelectionRange(newPos, newPos);
  input.focus();

  // Trigger input event to notify React of the value change
  // Using 'input' event with bubbles: true is what React listens for
  const inputEvent = new Event("input", { bubbles: true });
  input.dispatchEvent(inputEvent);
}

export function matchesUrlPattern(
  fullUrl: string,
  pattern: string,
  ignoreQuery: boolean = false,
): boolean {
  const _url = new URL(fullUrl);
  // ignore query params but include hash
  const url =
    _url.origin + _url.pathname + _url.hash + (ignoreQuery ? "" : _url.search);
  try {
    // Convert simple wildcard pattern to regex
    const regexPattern =
      pattern
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // Escape special regex characters
        .replace(/\\\*/g, ".*") // Convert * to .*
        .replace(/\\\?/g, ".") + // Convert ? to .
      "\\/?"; // Optional trailing slash

    const regex = new RegExp(`^${regexPattern}$`, "i");
    return regex.test(url);
  } catch (error) {
    console.error("Invalid URL pattern:", pattern, error);
    return false;
  }
}
