import { ReactElement } from "react";
import ButtonFactory from "./factory/button";
import TextFactory from "./factory/text";
import InputFactory from "./factory/input";
import FloatingActionButtonFactory from "./factory/floatingActionButton";

export class ComponentFactory {
  static create(recipe: any, workflowId: string, nodeId: string): ReactElement {
    switch (recipe.componentType) {
      case "button":
        return ButtonFactory({
          recipe,
          onClick: () => {
            this.triggerNextAction(workflowId, nodeId);
          },
        });
      case "input":
        return InputFactory({
          recipe,
          onSubmit: (text: string) => {
            this.triggerNextAction(workflowId, nodeId, { text });
          },
        });
      case "floating-action-button":
        return FloatingActionButtonFactory({
          recipe,
          onClick: () => {
            this.triggerNextAction(workflowId, nodeId);
          },
        });
      default:
        return TextFactory({ recipe });
    }
  }

  private static triggerNextAction(
    workflowId: string,
    nodeId: string,
    data?: any,
  ): void {
    // Dispatch custom event that the workflow executor can listen to
    const event = new CustomEvent("workflow-component-trigger", {
      detail: { workflowId, nodeId, data },
    });
    document.dispatchEvent(event);
  }
}
