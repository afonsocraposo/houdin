import {
  BaseAction,
  ActionConfigSchema,
  ActionMetadata,
} from "@/types/actions";
import { ComponentFactory } from "@/components/ComponentFactory";
import { ContentInjector } from "@/services/injector";
import { NotificationService } from "@/services/notification";
import React from "react";
import { getElement } from "@/utils/helpers";

interface InjectComponentActionConfig {
  targetSelector: string;
  componentType: "text";
  selectorType: "css" | "xpath";
  componentText: string;
  textColor?: string;
  useMarkdown?: boolean;
  customStyle?: string;
}

export class InjectComponentAction extends BaseAction<InjectComponentActionConfig> {
  readonly metadata: ActionMetadata = {
    type: "inject-component",
    label: "Inject Component",
    icon: "💉",
    description: "Add text to page",
    disableTimeout: true,
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
          options: [{ value: "text", label: "Text/Label" }],
          defaultValue: "text",
        },
        componentText: {
          type: "textarea",
          label: "Component Text",
          placeholder: "Click me, Enter text, etc.",
          defaultValue: "Hello",
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
    workflowId: string,
    nodeId: string,
    onSuccess: (data: any) => void,
    _onError: (error: Error) => void,
  ): Promise<void> {
    const {
      selectorType,
      targetSelector,
      componentType,
      componentText,
      textColor,
      useMarkdown,
      customStyle,
    } = config;

    const targetElement = getElement(targetSelector, selectorType);

    if (!targetElement) {
      NotificationService.showErrorNotification({
        message: "Target element not found for component injection",
      });
      return;
    }

    // Build component configuration object that factory components can use
    const componentConfig = {
      componentType,
      componentText,

      // Color properties (will be handled by individual factories)
      textColor,

      // Text-specific properties
      useMarkdown,

      // Custom styles
      customStyle,
    };

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

    // For non-interactive components (text), continue immediately
    onSuccess({
      componentType,
      injected: true,
      text: componentText,
    });
  }
}
