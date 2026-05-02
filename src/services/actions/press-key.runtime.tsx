import definition from "./press-key.definition";
import { BaseAction } from "@/types/actions";

interface PressKeyActionConfig {
  keyCombo: string;
}
interface PressKeyActionOutput {
  keyCombo: string;
  timestamp: number;
}

export class PressKeyAction extends BaseAction<
  PressKeyActionConfig,
  PressKeyActionOutput
> {
  constructor() {
    super(definition);
  }

  async execute(
    config: PressKeyActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data: PressKeyActionOutput) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    try {
      if (config.keyCombo === "Tab") this.handleTabNavigation();
      else if (config.keyCombo === "Enter") this.handleEnterKey();
      else this.dispatchKeyboardEvent(config.keyCombo);
      onSuccess({ keyCombo: config.keyCombo, timestamp: Date.now() });
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private handleTabNavigation(): void {
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.findIndex(
      (el) => el === document.activeElement,
    );
    if (currentIndex !== -1 && currentIndex < focusableElements.length - 1)
      (focusableElements[currentIndex + 1] as HTMLElement).focus();
    else if (focusableElements.length > 0)
      (focusableElements[0] as HTMLElement).focus();
  }
  private handleEnterKey(): void {
    const activeElement = document.activeElement;
    if (
      activeElement instanceof HTMLInputElement ||
      activeElement instanceof HTMLTextAreaElement
    ) {
      const form = activeElement.closest("form");
      if (form) {
        const submitEvent = new Event("submit", {
          bubbles: true,
          cancelable: true,
        });
        form.dispatchEvent(submitEvent);
        if (!submitEvent.defaultPrevented) form.submit();
      } else {
        this.dispatchKeyboardEvent("Enter");
      }
    } else {
      this.dispatchKeyboardEvent("Enter");
    }
  }
  private dispatchKeyboardEvent(key: string): void {
    const targetElement = document.activeElement || document;
    const keyCode = this.getKeyCode(key);
    const eventOptions = {
      key,
      code: key === "Enter" ? "Enter" : key,
      keyCode,
      which: keyCode,
      bubbles: true,
      cancelable: true,
    };
    targetElement.dispatchEvent(new KeyboardEvent("keydown", eventOptions));
    if (this.isPrintableKey(key))
      targetElement.dispatchEvent(new KeyboardEvent("keypress", eventOptions));
    targetElement.dispatchEvent(new KeyboardEvent("keyup", eventOptions));
  }
  private getFocusableElements(): Element[] {
    const selector =
      'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable]';
    return Array.from(document.querySelectorAll(selector)).filter((el) => {
      const style = window.getComputedStyle(el as HTMLElement);
      return style.display !== "none" && style.visibility !== "hidden";
    });
  }
  private getKeyCode(key: string): number {
    const keyCodes: Record<string, number> = {
      Enter: 13,
      Tab: 9,
      Escape: 27,
      Space: 32,
      ArrowUp: 38,
      ArrowDown: 40,
      ArrowLeft: 37,
      ArrowRight: 39,
    };
    return keyCodes[key] || key.charCodeAt(0);
  }
  private isPrintableKey(key: string): boolean {
    return key.length === 1 || ["Space", "Enter", "Tab"].includes(key);
  }
}
