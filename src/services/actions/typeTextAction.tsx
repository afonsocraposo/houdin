import { BaseAction, ActionMetadata } from "@/types/actions";
import { textProperty, selectProperty } from "@/types/config-properties";
import { getElement } from "@/utils/helpers";

interface TypeTextActionConfig {
  elementSelector: string;
  selectorType: "css" | "xpath" | "text" | "focused";
  text: string;
}

interface TypeTextActionOutput {
  text: string;
  timestamp: number;
}

export class TypeTextAction extends BaseAction<
  TypeTextActionConfig,
  TypeTextActionOutput
> {
  static readonly metadata: ActionMetadata = {
    type: "type-text",
    label: "Type Text",
    icon: "⌨️",
    description: "Type text into input field",
  };

  static readonly configSchema = {
    properties: {
      selectorType: selectProperty({
        label: "Selector Type. (Optional, defaults to focused input)",
        options: [
          { label: "CSS Selector", value: "css" },
          { label: "XPath", value: "xpath" },
          { label: "Text", value: "text" },
          { label: "Placeholder", value: "placeholder" },
          { label: "Label", value: "label" },
          { label: "Focused Input", value: "focused" },
        ],
        defaultValue: "focused",
        description: "Type of selector to use for element selection",
        required: true,
      }),
      elementSelector: textProperty({
        label: "Element Selector",
        placeholder: ".title, #content, h1",
        description: "Selector for the element to click",
        required: false,
        defaultValue: "input",
        showWhen: {
          field: "selectorType",
          value: ["css", "xpath", "text", "label", "placeholder"],
        },
      }),
      text: textProperty({
        label: "Text to Type",
        description: "The text that will be typed when this action is executed",
        required: true,
      }),
    },
  };

  readonly outputExample = {
    text: "Hello, World!",
    timestamp: 1640995200000,
  };

  async execute(
    config: TypeTextActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data: TypeTextActionOutput) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    const { text, selectorType, elementSelector } = config;

    let element: Element | null = null;
    if (selectorType !== "focused") {
      element = getElement(elementSelector, selectorType);
      if (element) {
        // Focus the element
        (element as HTMLElement).focus();
      } else {
        onError(
          new Error(`Element not found for selector: ${elementSelector}`),
        );
        return;
      }
    } else {
      element = document.activeElement;
    }
    if (!element) {
      onError(new Error("No element is currently focused"));
      return;
    }
    if (
      !(
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement
      )
    ) {
      // Check for contenteditable
      if (
        !(element instanceof HTMLElement) ||
        element.contentEditable !== "true"
      ) {
        onError(new Error("Focused element is not an input field"));
        return;
      }
      element.focus();

      element.innerHTML = `<p>${text}</p>`;

      const inputEvent = new Event("input", { bubbles: true });
      element.dispatchEvent(inputEvent);

      const changeEvent = new Event("change", { bubbles: true });
      element.dispatchEvent(changeEvent);

      element.blur();
    } else {
      // Type the text into the input field
      const inputElement = element as HTMLInputElement | HTMLTextAreaElement;
      const start = inputElement.selectionStart;
      const end = inputElement.selectionEnd;
      if (start === null || end === null) {
        inputElement.value += text;
      } else {
        const currentValue = inputElement.value;
        inputElement.value =
          currentValue.substring(0, start) + text + currentValue.substring(end);
        const newCursorPosition = start + text.length;
        try {
          inputElement.selectionStart = newCursorPosition;
          inputElement.selectionEnd = newCursorPosition;
          inputElement.dispatchEvent(new Event("input", { bubbles: true }));
        } catch (e) {
          // ignore
        }
      }
    }

    onSuccess({
      text,
      timestamp: Date.now(),
    });
  }
}
