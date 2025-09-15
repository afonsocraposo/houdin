import { KeybindingSetter } from "@/components/KeybindingSetter";
import {
  BaseAction,
  ActionConfigSchema,
  ActionMetadata,
} from "@/types/actions";

interface PressKeyActionConfig {
  keyCombo: string;
}

export class PressKeyAction extends BaseAction<PressKeyActionConfig> {
  readonly metadata: ActionMetadata = {
    type: "press-key",
    label: "Press Key",
    icon: "⌨️",
    description: "Press a key or combination",
  };

  getConfigSchema(): ActionConfigSchema {
    return {
      properties: {
        keyCombo: {
          type: "custom",
          label: "Key Combination",
          description:
            "Set the key combination that will trigger this workflow",
          required: true,
          render: (
            values: Record<string, any>,
            onChange: (key: string, value: any) => void,
          ) => (
            <KeybindingSetter
              value={values.keyCombo}
              onChange={(combo) => onChange("keyCombo", combo)}
            />
          ),
        },
      },
    };
  }

  async execute(
    config: PressKeyActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data?: any) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    const { keyCombo } = config;

    try {
      if (keyCombo === "Tab") {
        // Handle Tab navigation manually
        this.handleTabNavigation();
      } else if (keyCombo === "Enter") {
        // Handle Enter key for form submission
        this.handleEnterKey();
      } else {
        // Handle other keys with enhanced keyboard events
        this.dispatchKeyboardEvent(keyCombo);
      }

      onSuccess({
        keyCombo,
        timestamp: Date.now(),
      });
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private handleTabNavigation(): void {
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.findIndex(el => el === document.activeElement);
    
    if (currentIndex !== -1 && currentIndex < focusableElements.length - 1) {
      (focusableElements[currentIndex + 1] as HTMLElement).focus();
    } else if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }
  }

  private handleEnterKey(): void {
    const activeElement = document.activeElement;
    
    if (activeElement instanceof HTMLInputElement || 
        activeElement instanceof HTMLTextAreaElement) {
      
      // Try to find and submit the parent form
      const form = activeElement.closest('form');
      if (form) {
        // Dispatch submit event
        const submitEvent = new Event('submit', { 
          bubbles: true, 
          cancelable: true 
        });
        form.dispatchEvent(submitEvent);
        
        // If not prevented, actually submit
        if (!submitEvent.defaultPrevented) {
          form.submit();
        }
      } else {
        // Fallback to keyboard event with proper properties
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
      key: key,
      code: key === "Enter" ? "Enter" : key,
      keyCode: keyCode,
      which: keyCode,
      bubbles: true,
      cancelable: true,
    };

    // Dispatch keydown
    const keydownEvent = new KeyboardEvent("keydown", eventOptions);
    targetElement.dispatchEvent(keydownEvent);

    // Dispatch keypress for printable characters
    if (this.isPrintableKey(key)) {
      const keypressEvent = new KeyboardEvent("keypress", eventOptions);
      targetElement.dispatchEvent(keypressEvent);
    }

    // Dispatch keyup
    const keyupEvent = new KeyboardEvent("keyup", eventOptions);
    targetElement.dispatchEvent(keyupEvent);
  }

  private getFocusableElements(): Element[] {
    const selector = 'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable]';
    return Array.from(document.querySelectorAll(selector)).filter(el => {
      const style = window.getComputedStyle(el as HTMLElement);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  }

  private getKeyCode(key: string): number {
    const keyCodes: Record<string, number> = {
      'Enter': 13,
      'Tab': 9,
      'Escape': 27,
      'Space': 32,
      'ArrowUp': 38,
      'ArrowDown': 40,
      'ArrowLeft': 37,
      'ArrowRight': 39,
    };
    
    return keyCodes[key] || key.charCodeAt(0);
  }

  private isPrintableKey(key: string): boolean {
    return key.length === 1 || ['Space', 'Enter', 'Tab'].includes(key);
  }
}
