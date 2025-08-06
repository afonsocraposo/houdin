import { ReactElement } from "react";
import ButtonFactory from "./factory/button";
import TextFactory from "./factory/text";

export class ComponentFactory {
  static create(recipe: any, workflowId: string, nodeId: string): ReactElement {
    switch (recipe.componentType) {
      case "button":
        // element = this.createButton(recipe, workflowId, nodeId);
        return ButtonFactory({
          recipe,
          onClick: () => {
            this.triggerNextAction(workflowId, nodeId);
          },
        });
      // case "input":
      //   // element = this.createInput(recipe, workflowId, nodeId);
      //   break;
      // case "text":
      //   // element = this.createText(recipe);
      //   break;
      default:
        return TextFactory({ recipe });
      // element = this.createDefault(recipe);
    }

    // Apply custom styles
    // if (recipe.componentStyle) {
    //   element.style.cssText = recipe.componentStyle;
    // }

    // Add data attribute for identification
    // element.setAttribute("data-changeme-recipe", recipe.id);
    // element.setAttribute("data-component-type", recipe.componentType);
  }

  // private static createInput(
  //   recipe: any,
  //   workflowId?: string,
  //   nodeId?: string,
  // ): HTMLElement {
  //   const input = document.createElement("input");
  //   input.type = "text";
  //   input.placeholder = recipe.componentText;
  //   input.addEventListener("keypress", (e) => {
  //     if (e.key === "Enter") {
  //       if (workflowId && nodeId) {
  //         // Trigger next action connected to this input
  //         this.triggerNextAction(workflowId, nodeId);
  //       }
  //     }
  //   });
  //   return input;
  // }
  //
  // private static createText(recipe: any): HTMLElement {
  //   const span = document.createElement("span");
  //   span.textContent = recipe.componentText;
  //   // Text/label components cannot trigger next actions - no click handler
  //   return span;
  // }

  private static triggerNextAction(workflowId: string, nodeId: string): void {
    // Dispatch custom event that the workflow executor can listen to
    const event = new CustomEvent("workflow-component-trigger", {
      detail: { workflowId, nodeId },
    });
    document.dispatchEvent(event);
  }
}
