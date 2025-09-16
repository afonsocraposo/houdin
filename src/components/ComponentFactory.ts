import { createElement, ReactElement } from "react";
import ButtonFactory from "./factory/button";
import TextFactory from "./factory/text";
import InputFactory from "./factory/input";
import FloatingActionButtonFactory from "./factory/floatingActionButton";

export class ComponentFactory {
  static create(
    recipe: any,
    workflowId: string,
    nodeId: string,
    preview: boolean = false,
  ): ReactElement {
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
      case "fab":
        return FloatingActionButtonFactory({
          recipe,
          onClick: () => {
            this.triggerNextAction(workflowId, nodeId);
          },
          preview,
        });
      case "html":
        return createElement("div", {
          dangerouslySetInnerHTML: { __html: recipe.componentHtml || "" },
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
