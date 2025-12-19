import browser from "@/services/browser";
export async function isBackgroundContext(): Promise<boolean> {
  try {
    const background = await browser.runtime.getBackgroundPage();
    return window === background;
  } catch (e) {
    if (typeof window !== "undefined") {
      return false;
    }
    return true;
  }
}
