import { BaseAction, ActionMetadata } from "@/types/actions";
import { selectProperty, textProperty } from "@/types/config-properties";
import { getElement } from "@/utils/helpers";
import { IconClick } from "@tabler/icons-react";

interface ClickElementActionConfig {
  elementSelector: string;
  selectorType: "css" | "xpath" | "text";
}

interface ClickElementActionOutput {
  element: string; // Outer HTML of the clicked element
}

export class ClickElementAction extends BaseAction<
  ClickElementActionConfig,
  ClickElementActionOutput
> {
  static readonly metadata: ActionMetadata = {
    type: "click-element",
    label: "Click Element",
    icon: IconClick,
    description: "Click on a page element",
  };

  static readonly configSchema = {
    properties: {
      selectorType: selectProperty({
        label: "Selector Type",
        options: [
          { label: "CSS Selector", value: "css" },
          { label: "XPath", value: "xpath" },
          { label: "Text", value: "text" },
        ],
        defaultValue: "css",
        description: "Type of selector to use for element selection",
        required: true,
      }),
      elementSelector: textProperty({
        label: "Element Selector",
        placeholder: ".title, #content, h1",
        description: "Selector for the element to click",
        required: true,
        defaultValue: "button",
      }),
    },
  };

  readonly outputExample = {
    element: '<button id="submit-btn">Submit</button>',
  };

  async execute(
    config: ClickElementActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data: ClickElementActionOutput) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    const { elementSelector, selectorType } = config;

    const element = getElement(elementSelector, selectorType);
    if (element) {
      // Simulate a click on the element
      element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      onSuccess({ element: element.outerHTML });
    } else {
      onError(new Error(`Element not found for selector: ${elementSelector}`));
    }
  }
}
