import definition from "./button-click.definition";
import {
  ComponentFactory,
  ComponentTriggerEventDetail,
} from "@/components/ComponentFactory";
import { BaseTrigger } from "@/types/triggers";
import { waitForElement } from "@/utils/helpers";
import { NotificationService } from "@/services/notification";
import { ContentInjector } from "@/services/injector";

interface ButtonClickTriggerConfig {
  targetSelector: string;
  selectorType: "css" | "xpath";
  componentType: string;
  componentText: string;
  buttonColor?: string;
  buttonTextColor?: string;
  customStyle?: string;
  injectionPosition?: "start" | "end";
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
  constructor() {
    super(definition);
  }

  async setup(
    config: ButtonClickTriggerConfig,
    workflowId: string,
    nodeId: string,
    onTrigger: (data?: any) => Promise<void>,
  ): Promise<(() => void) | void> {
    const {
      selectorType,
      targetSelector,
      componentType,
      componentText,
      buttonColor,
      buttonTextColor,
      customStyle,
      injectionPosition,
    } = config;
    const componentConfig = {
      componentType,
      componentText,
      buttonColor,
      buttonTextColor,
      customStyle,
    };
    const containerId = `container-${workflowId}-${nodeId}`;
    let isActive = true;
    let isInjecting = false;
    let currentTarget: Element | null = null;

    const injectComponent = async () => {
      if (!isActive || isInjecting) {
        return;
      }

      isInjecting = true;

      try {
        const targetElement =
          componentType === "fab"
            ? document.body
            : await waitForElement(targetSelector, selectorType, 5000);

        if (!isActive) {
          return;
        }

        if (!targetElement) {
          NotificationService.showErrorNotification({
            message: "Target element not found for component injection",
          });
          return;
        }

        currentTarget = targetElement;
        ContentInjector.removeInjectedComponent(containerId);
        ContentInjector.injectMantineComponentInTarget(
          containerId,
          ComponentFactory.create(componentConfig, workflowId, nodeId),
          targetElement,
          true,
          injectionPosition,
        );
      } finally {
        isInjecting = false;
      }
    };

    await injectComponent();

    const handleComponentTrigger = (
      event: CustomEventInit<ComponentTriggerEventDetail>,
    ) => {
      const customEvent = event as CustomEvent;
      if (
        customEvent.detail?.workflowId === workflowId &&
        customEvent.detail?.nodeId === nodeId
      ) {
        onTrigger({
          componentType,
          interactionData: customEvent.detail?.data,
          timestamp: Date.now(),
        });
      }
    };
    document.addEventListener(
      "workflow-component-trigger",
      handleComponentTrigger,
    );

    const observer = new MutationObserver(() => {
      if (!isActive || isInjecting) {
        return;
      }

      const container = document.getElementById(containerId);
      const targetDetached =
        currentTarget !== null && !document.contains(currentTarget);

      if (!container || !document.contains(container) || targetDetached) {
        void injectComponent();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      isActive = false;
      observer.disconnect();
      document.removeEventListener(
        "workflow-component-trigger",
        handleComponentTrigger,
      );
      ContentInjector.removeInjectedComponent(containerId);
    };
  }
}
