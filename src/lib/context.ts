export function isBackgroundContext(): boolean {
  try {
    return typeof window === "undefined" || !window.document;
  } catch {
    return true;
  }
}
