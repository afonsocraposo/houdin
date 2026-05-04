import definition from "./inject-component.definition";
import { BaseAction } from "@/types/actions";
import { ComponentFactory } from "@/components/ComponentFactory";
import { ContentInjector } from "@/services/injector";
import { NotificationService } from "@/services/notification";
import { getElement } from "@/utils/helpers";

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
  constructor() {
    super(definition);
  }

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
