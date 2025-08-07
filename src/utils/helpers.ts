export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    console.log("Content copied to clipboard");
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
