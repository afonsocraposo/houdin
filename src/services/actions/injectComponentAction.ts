import {
  BaseAction,
  ActionConfigSchema,
  ActionMetadata,
  ActionExecutionContext,
} from "../../types/actions";
import { ComponentFactory } from "../../components/ComponentFactory";
import { ContentInjector } from "../injector";
import { NotificationService } from "../notification";
import React from "react";
import { getElement } from "../../utils/helpers";

interface InjectComponentActionConfig {
  targetSelector: string;
  selectorType: "css" | "xpath";
  componentType: string;
  componentText: string;
  buttonColor?: string;
  buttonTextColor?: string;
  textColor?: string;
  inputPlaceholder?: string;
  fabIcon?: string;
  useMarkdown?: boolean;
  customStyle?: string;
}

export class InjectComponentAction extends BaseAction<InjectComponentActionConfig> {
  readonly metadata: ActionMetadata = {
    type: "inject-component",
    label: "Inject Component",
    icon: "🔧",
    description: "Add button, floating action button, input, or text to page",
  };

  getConfigSchema(): ActionConfigSchema {
    return {
      properties: {
        // Component preview
        preview: {
          type: "custom",
          label: "Component Preview",
          render: (values: Record<string, any>) => {
            try {
              const previewComponent = ComponentFactory.create(
                values,
                "preview-workflow",
                "preview-node",
              );
              return previewComponent;
            } catch (error) {
              return React.createElement(
                "div",
                { style: { color: "red" } },
                "Error rendering preview: " + (error as Error).message,
              );
            }
          },
        },
        selectorType: {
          type: "select",
          label: "Selector Type",
          options: [
            { label: "CSS Selector", value: "css" },
            { label: "XPath", value: "xpath" },
          ],
          defaultValue: "css",
          description: "Type of selector to use for component injection",
          required: true,
        },
        targetSelector: {
          type: "text",
          label: "Target Selector",
          placeholder: ".header, #main-content",
          description:
            "Where to inject the component (not needed for floating action button)",
          defaultValue: "body",
        },
        componentType: {
          type: "select",
          label: "Component Type",
          options: [
            { value: "button", label: "Button" },
            {
              value: "floating-action-button",
              label: "Floating Action Button",
            },
            { value: "input", label: "Input Field" },
            { value: "text", label: "Text/Label" },
          ],
          defaultValue: "button",
        },
        componentText: {
          type: "text",
          label: "Component Text",
          placeholder: "Click me, Enter text, etc.",
          defaultValue: "Hello",
        },

        // Button-specific properties
        buttonColor: {
          type: "color",
          label: "Button Color",
          description: "Background color of the button",
          defaultValue: "#228be6",
          showWhen: {
            field: "componentType",
            value: ["button", "floating-action-button"],
          },
        },
        buttonTextColor: {
          type: "color",
          label: "Button Text Color",
          description: "Text color of the button",
          defaultValue: "#ffffff",
          showWhen: {
            field: "componentType",
            value: ["button", "floating-action-button"],
          },
        },

        // Floating Action Button specific properties
        fabIcon: {
          type: "text",
          label: "FAB Icon",
          placeholder: "🚀, ❤️, ✨, 📧, etc.",
          description: "What to display as the icon",
          showWhen: {
            field: "componentType",
            value: "floating-action-button",
          },
        },

        // Text-specific properties
        textColor: {
          type: "color",
          label: "Text Color",
          description: "Color of the text",
          defaultValue: "#000000",
          showWhen: {
            field: "componentType",
            value: "text",
          },
        },
        useMarkdown: {
          type: "boolean",
          label: "Enable Markdown",
          description:
            "Render text as markdown (supports **bold**, *italic*, links, lists, etc.)",
          defaultValue: true,
          // showWhen: {
          //   field: "componentType",
          //   value: "text",
          // },
        },

        // Input-specific properties
        inputPlaceholder: {
          type: "text",
          label: "Input Placeholder",
          placeholder: "Enter text...",
          showWhen: {
            field: "componentType",
            value: "input",
          },
        },

        // Advanced styling (for all types)
        customStyle: {
          type: "code",
          label: "Custom CSS (Advanced)",
          placeholder: "margin: 10px; border-radius: 4px;",
          description:
            "Additional CSS properties. For floating action button, use: bottom: 40; right: 40; (in pixels)",
          language: "text",
          height: 100,
        },
      },
    };
  }
  async execute(
    config: InjectComponentActionConfig,
    context: ActionExecutionContext,
    nodeId: string,
  ): Promise<void> {
    const {
      selectorType,
      targetSelector,
      componentType,
      componentText,
      buttonColor,
      buttonTextColor,
      textColor,
      inputPlaceholder,
      fabIcon,
      useMarkdown,
      customStyle,
    } = config;

    const targetElement =
      componentType === "floating-action-button"
        ? document.body
        : getElement(targetSelector, selectorType);

    if (!targetElement) {
      NotificationService.showErrorNotification({
        message: "Target element not found for component injection",
      });
      return;
    }

    // Interpolate variables in component text
    const interpolatedText = context.interpolateVariables(componentText || "");
    const interpolatedPlaceholder = inputPlaceholder
      ? context.interpolateVariables(inputPlaceholder)
      : "";

    // Build component configuration object that factory components can use
    const componentConfig = {
      componentType,
      componentText: interpolatedText,

      // Color properties (will be handled by individual factories)
      buttonColor,
      buttonTextColor,
      textColor,

      // Input-specific properties
      inputPlaceholder: interpolatedPlaceholder,

      // Floating Action Button specific properties
      fabIcon,

      // Text-specific properties
      useMarkdown,

      // Custom styles
      customStyle,

      // Legacy properties for backward compatibility
      targetSelector,
    };

    // Get workflow ID from context
    const workflowId = context.workflowId || "default-workflow";

    const component = ComponentFactory.create(
      componentConfig,
      workflowId,
      nodeId,
    );

    ContentInjector.injectMantineComponentInTarget(
      `container-${workflowId}-${nodeId}`,
      component,
      targetElement,
      true, // coreOnly
    );
  }
}
