import { BaseAction, ActionMetadata } from "@/types/actions";
import { ComponentFactory } from "@/components/ComponentFactory";
import { ContentInjector } from "@/services/injector";
import { NotificationService } from "@/services/notification";
import React from "react";
import { getElement } from "@/utils/helpers";
import {
  booleanProperty,
  codeProperty,
  colorProperty,
  customProperty,
  selectProperty,
  textareaProperty,
  textProperty,
} from "@/types/config-properties";

interface InjectComponentActionConfig {
  targetSelector: string;
  componentType: "text" | "html";
  selectorType: "css" | "xpath";
  injectionPosition: "start" | "end";
  componentText?: string;
  componentHtml?: string;
  textColor?: string;
  useMarkdown?: boolean;
  customStyle?: string;
}

interface InjectComponentActionOutput {
  componentType: string;
  injected: boolean;
  component: string;
  customStyle?: string;
}

export class InjectComponentAction extends BaseAction<
  InjectComponentActionConfig,
  InjectComponentActionOutput
> {
  static readonly metadata: ActionMetadata = {
    type: "inject-component",
    label: "Inject Component",
    icon: "💉",
    description: "Inject a custom component into the page (text, HTML)",
  };

  static readonly configSchema = {
    properties: {
      // Component preview
      preview: customProperty({
        label: "Component Preview",
        component: "InjectComponentPreview",
        render: (values: Record<string, any>) => {
          try {
            const previewComponent = ComponentFactory.create(
              values,
              "preview-workflow",
              "preview-node",
            );
            // create iframe-like box
            return React.createElement(
              "div",
              {
                style: {
                  position: "relative",
                  padding: "10px",
                  minHeight: "32px",
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
      selectorType: selectProperty({
        label: "Selector Type",
        options: [
          { label: "CSS Selector", value: "css" },
          { label: "XPath", value: "xpath" },
        ],
        defaultValue: "css",
        description: "Type of selector to use for component injection",
        required: true,
      }),
      targetSelector: textProperty({
        label: "Target Selector",
        placeholder: ".header, #main-content",
        description:
          "Where to inject the component (not needed for floating action button)",
        defaultValue: "body",
      }),
      injectionPosition: selectProperty({
        label: "Position",
        options: [
          { value: "start", label: "Start (prepend)" },
          { value: "end", label: "End (append)" },
        ],
        defaultValue: "end",
        description: "Where to inject the component within the target element",
      }),
      componentType: selectProperty({
        label: "Component Type",
        options: [
          {
            value: "text",
            label: "Text/Label",
          },
          { value: "html", label: "HTML" },
        ],
        defaultValue: "text",
      }),
      componentText: textareaProperty({
        label: "Text Content",
        placeholder: "Click me, Enter text, etc.",
        defaultValue: "Hello",
        showWhen: {
          field: "componentType",
          value: "text",
        },
      }),
      componentHtml: codeProperty({
        language: "html",
        label: "HTML Content",
        placeholder: "<b>Hello</b>, <i>world</i>!",
        defaultValue: "<b>Hello</b>, <i>world</i>!",
        showWhen: {
          field: "componentType",
          value: "html",
        },
      }),

      // Text-specific properties
      textColor: colorProperty({
        label: "Text Color",
        description: "Color of the text",
        defaultValue: "#000000",
        showWhen: {
          field: "componentType",
          value: "text",
        },
      }),
      useMarkdown: booleanProperty({
        label: "Enable Markdown",
        description:
          "Render text as markdown (supports **bold**, *italic*, links, lists, etc.)",
        defaultValue: true,
        showWhen: {
          field: "componentType",
          value: "text",
        },
      }),

      // Advanced styling (for all types)
      customStyle: codeProperty({
        label: "Custom CSS (Advanced)",
        placeholder: "margin: 10px; border-radius: 4px;",
        description: "Additional CSS properties.",
        language: "text",
        height: 100,
        showWhen: {
          field: "componentType",
          value: ["text"],
        },
      }),
    },
  };

  readonly outputExample = {
    componentType: "text",
    component: "Hello, world!",
    injected: true,
    text: "Hello, world!",
    customStyle: "color: red; font-weight: bold;",
  };

  async execute(
    config: InjectComponentActionConfig,
    workflowId: string,
    nodeId: string,
    onSuccess: (data: any) => void,
    _onError: (error: Error) => void,
  ): Promise<void> {
    const { selectorType, targetSelector, componentType, injectionPosition } =
      config;

    const targetElement = getElement(targetSelector, selectorType);

    if (!targetElement) {
      NotificationService.showErrorNotification({
        message: "Target element not found for component injection",
      });
      return;
    }

    const component = ComponentFactory.create(config, workflowId, nodeId);

    ContentInjector.injectMantineComponentInTarget(
      `container-${workflowId}-${nodeId}`,
      component,
      targetElement,
      true, // coreOnly
      injectionPosition,
    );

    onSuccess({
      componentType,
      injected: true,
      component:
        componentType === "text" ? config.componentText : config.componentHtml,
      customStyle: config.customStyle,
    });
  }
}
