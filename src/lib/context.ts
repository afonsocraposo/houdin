import browser from "@/services/browser";
export async function isBackgroundContext(): Promise<boolean> {
  try {
    const background = await browser.runtime.getBackgroundPage();
    return window === background;
  } catch {
    return true;
  }
}
