import definition from "./remove-element.definition";
import { BaseAction } from "@/types/actions";
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
  constructor() {
    super(definition);
  }

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
