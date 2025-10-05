import { BaseAction, ActionMetadata } from "@/types/actions";
import { selectProperty, textProperty } from "@/types/config-properties";
import { getElement } from "@/utils/helpers";

interface RemoveElementActionConfig {
  elementSelector: string;
  selectorType: "css" | "xpath" | "text";
}

interface RemoveElementActionOutput {
  element: string; // Outer HTML of the removeed element
}

export class RemoveElementAction extends BaseAction<
  RemoveElementActionConfig,
  RemoveElementActionOutput
> {
  static readonly metadata: ActionMetadata = {
    type: "remove-element",
    label: "Remove Element",
    icon: "❌",
    description: "Remove on a page element",
  };

  readonly configSchema = {
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
        description: "Selector for the element to remove",
        required: true,
        defaultValue: "button",
      }),
    },
  };

  readonly outputExample = {
    element: '<div id="ad-banner">Ad Content</div>',
  };

  async execute(
    config: RemoveElementActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data: RemoveElementActionOutput) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    const { elementSelector, selectorType } = config;

    const element = getElement(elementSelector, selectorType);
    if (element) {
      const outerHTML = element.outerHTML;
      element.remove();
      onSuccess({ element: outerHTML });
    } else {
      const error = new Error(
        `Element not found using ${selectorType} selector: ${elementSelector}`,
      );
      onError(error);
    }
  }
}
