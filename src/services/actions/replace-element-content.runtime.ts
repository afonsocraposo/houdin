import definition from "./replace-element-content.definition";
import { BaseAction } from "@/types/actions";
import { getElement } from "@/utils/helpers";

interface ReplaceElementContentActionConfig {
  elementSelector: string;
  selectorType: "css" | "xpath" | "text";
  newContent: string;
}

interface ReplaceElementContentActionOutput {
  previousContent: string;
  newContent: string;
}

export class ReplaceElementContentAction extends BaseAction<
  ReplaceElementContentActionConfig,
  ReplaceElementContentActionOutput
> {
  constructor() {
    super(definition);
  }

  async execute(
    config: ReplaceElementContentActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data: ReplaceElementContentActionOutput) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    const { elementSelector, selectorType, newContent } = config;

    const element = getElement(elementSelector, selectorType);
    if (element) {
      const previousContent = element.innerHTML;
      element.innerHTML = newContent;
      onSuccess({ previousContent, newContent });
    } else {
      onError(
        new Error(
          `Element not found using ${selectorType} selector: ${elementSelector}`,
        ),
      );
    }
  }
}
