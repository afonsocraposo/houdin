import React from "react";
import { ComponentFactory } from "@/components/ComponentFactory";
import { BaseTrigger } from "@/types/triggers";
import { getElement } from "@/utils/helpers";
import { NotificationService } from "@/services/notification";
import { ContentInjector } from "@/services/injector";
import {
  codeProperty,
  colorProperty,
  customProperty,
  selectProperty,
  textProperty,
} from "@/types/config-properties";

interface ButtonClickTriggerConfig {
  targetSelector: string;
  selectorType: "css" | "xpath";
  componentType: string;
  componentText: string;
  buttonColor?: string;
  buttonTextColor?: string;
  customStyle?: string;
}

interface ButtonClickTriggerOutput {
  componentType: string;
  interactionData: any;
  timestamp: number;
}

export class ButtonClickTrigger extends BaseTrigger<
  ButtonClickTriggerConfig,
  ButtonClickTriggerOutput
> {
  readonly metadata = {
    type: "button-click",
    label: "Button Click",
    icon: "🔘",
    description: "Trigger when the injected button is clicked",
  };

  readonly configSchema = {
    properties: {
      // Component preview
      preview: customProperty({
        label: "Component Preview",
        render: (values: Record<string, any>) => {
          try {
            const previewComponent = ComponentFactory.create(
              values,
              "preview-workflow",
              "preview-node",
              true, // preview
            );
            // center the preview
            return React.createElement(
              "div",
              {
                style: {
                  display: "relative",
                  minHeight: "32px",
                  padding: "10px",
                },
              },
              previewComponent,
            );
          } catch (error) {
            return React.createElement(
              "div",
              { style: { color: "red" } },
              "Error rendering preview: " + (error as Error).message,
            );
          }
        },
      }),
      componentType: selectProperty({
        label: "Button Type",
        options: [
          { value: "button", label: "Button" },
          {
            value: "fab",
            label: "Floating Action Button",
          },
        ],
        defaultValue: "fab",
      }),
      selectorType: selectProperty({
        label: "Selector Type",
        options: [
          { label: "CSS Selector", value: "css" },
          { label: "XPath", value: "xpath" },
        ],
        defaultValue: "css",
        description: "Type of selector to use for component injection",
        showWhen: {
          field: "componentType",
          value: ["button"],
        },
      }),
      targetSelector: textProperty({
        label: "Target Selector",
        placeholder: ".header, #main-content",
        description:
          "Where to inject the component (not needed for floating action button)",
        defaultValue: "body",
        showWhen: {
          field: "componentType",
          value: "button",
        },
      }),
      componentText: textProperty({
        label: "Component Text",
        placeholder: "Click me",
        defaultValue: "♥️",
      }),
      // Button-specific properties
      buttonColor: colorProperty({
        label: "Button Color",
        description: "Background color of the button",
        defaultValue: "#228be6",
      }),
      buttonTextColor: colorProperty({
        label: "Button Text Color",
        description: "Text color of the button",
        defaultValue: "#ffffff",
      }),

      // Advanced styling (for all types)
      customStyle: codeProperty({
        label: "Custom CSS (Advanced)",
        placeholder: "margin: 10px; border-radius: 4px;",
        description:
          "Additional CSS properties. For floating action button, use: bottom: 40; right: 40; (in pixels)",
        language: "text",
        height: 100,
      }),
    },
  };

  outputExample = {
    componentType: "button",
    interactionData: {},
    timestamp: 1697054873000,
  };

  async setup(
    config: ButtonClickTriggerConfig,
    workflowId: string,
    nodeId: string,
    onTrigger: (data?: any) => Promise<void>,
  ): Promise<void> {
    const {
      selectorType,
      targetSelector,
      componentType,
      componentText,
      buttonColor,
      buttonTextColor,
      customStyle,
    } = config;

    const targetElement =
      componentType === "fab"
        ? document.body
        : getElement(targetSelector, selectorType);

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
      buttonColor,
      buttonTextColor,
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

    // Wait for user interaction before continuing workflow
    return new Promise<void>((resolve) => {
      const handleComponentTrigger = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (
          customEvent.detail?.workflowId === workflowId &&
          customEvent.detail?.nodeId === nodeId
        ) {
          document.removeEventListener(
            "workflow-component-trigger",
            handleComponentTrigger,
          );
          // Update output with interaction data
          onTrigger({
            componentType,
            interactionData: customEvent.detail?.data,
            timestamp: Date.now(),
          });
          resolve();
        }
      };

      document.addEventListener(
        "workflow-component-trigger",
        handleComponentTrigger,
      );
    });
  }
}
