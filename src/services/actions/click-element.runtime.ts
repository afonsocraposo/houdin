import definition from "./click-element.definition";
import { BaseAction } from "@/types/actions";
import { getElement } from "@/utils/helpers";
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
  constructor() {
    super(definition);
  }

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
