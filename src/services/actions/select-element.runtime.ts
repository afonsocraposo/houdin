import definition from "./select-element.definition";
import { BaseAction } from "@/types/actions";
import { selectElementInPage } from "@/services/elementSelectionService";

interface SelectElementActionOutput {
  selector: string;
  tagName: string;
  id: string;
  className: string;
  textContent: string | null;
}

export class SelectElementAction extends BaseAction<
  Record<string, never>,
  SelectElementActionOutput
> {
  constructor() {
    super(definition);
  }

  async execute(
    _config: Record<string, never>,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data: SelectElementActionOutput) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    const response = await selectElementInPage({
      source: "workflow-action",
      silent: true,
    });

    if (!response.ok) {
      onError(new Error(response.error || "Failed to select element"));
      return;
    }

    if (response.canceled || !response.data) {
      onError(new Error("Element selection was canceled"));
      return;
    }

    onSuccess({
      selector: response.data.selector,
      tagName: response.data.element.tagName,
      id: response.data.element.id,
      className: response.data.element.className,
      textContent: response.data.element.textContent,
    });
  }
}
