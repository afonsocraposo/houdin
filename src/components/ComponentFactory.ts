export class ComponentFactory {
  static create(recipe: any, workflowId?: string, nodeId?: string): HTMLElement {
    let element: HTMLElement;

    switch (recipe.componentType) {
      case "button":
        element = this.createButton(recipe, workflowId, nodeId);
        break;
      case "input":
        element = this.createInput(recipe, workflowId, nodeId);
        break;
      case "text":
        element = this.createText(recipe);
        break;
      default:
        element = this.createDefault(recipe);
    }

    // Apply custom styles
    if (recipe.componentStyle) {
      element.style.cssText = recipe.componentStyle;
    }

    // Add data attribute for identification
    element.setAttribute("data-changeme-recipe", recipe.id);
    element.setAttribute("data-component-type", recipe.componentType);

    return element;
  }

  private static createButton(recipe: any, workflowId?: string, nodeId?: string): HTMLElement {
    const button = document.createElement("button");
    button.textContent = recipe.componentText;
    button.addEventListener("click", () => {
      if (workflowId && nodeId) {
        // Trigger next action connected to this button
        this.triggerNextAction(workflowId, nodeId);
      }
    });
    return button;
  }

  private static createInput(recipe: any, workflowId?: string, nodeId?: string): HTMLElement {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = recipe.componentText;
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        if (workflowId && nodeId) {
          // Trigger next action connected to this input
          this.triggerNextAction(workflowId, nodeId);
        }
      }
    });
    return input;
  }

  private static createText(recipe: any): HTMLElement {
    const span = document.createElement("span");
    span.textContent = recipe.componentText;
    // Text/label components cannot trigger next actions - no click handler
    return span;
  }

  private static triggerNextAction(workflowId: string, nodeId: string): void {
    // Dispatch custom event that the workflow executor can listen to
    const event = new CustomEvent('workflow-component-trigger', {
      detail: { workflowId, nodeId }
    });
    document.dispatchEvent(event);
  }

  private static createDefault(recipe: any): HTMLElement {
    const div = document.createElement("div");
    div.textContent = recipe.componentText;
    return div;
  }
}
