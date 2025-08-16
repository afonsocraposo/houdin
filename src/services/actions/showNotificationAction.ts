import {
  BaseAction,
  ActionConfigSchema,
  ActionMetadata,
} from "../../types/actions";
import { NotificationService } from "../notification";
import { ExecutionContext } from "../workflow";

interface ShowNotificationActionConfig {
  notificationTitle: string;
  notificationContent: string;
}

export class ShowNotificationAction extends BaseAction<ShowNotificationActionConfig> {
  readonly metadata: ActionMetadata = {
    type: "show-notification",
    label: "Show Notification",
    icon: "🔔",
    description: "Display notification",
  };

  getConfigSchema(): ActionConfigSchema {
    return {
      properties: {
        notificationTitle: {
          type: "text",
          label: "Notification Title",
          placeholder: "Information, {{node-id}} Data",
          description:
            "Title of the notification. Use {{node-id}} to reference action outputs",
          defaultValue: "Workflow Result",
        },
        notificationContent: {
          type: "textarea",
          label: "Notification Content",
          placeholder: "The extracted content is: {{get-content-node}}",
          description:
            "Content to display. Use {{node-id}} to reference action outputs. Supports Markdown.",
          rows: 4,
        },
      },
    };
  }

  async execute(
    config: ShowNotificationActionConfig,
    context: ExecutionContext,
    _nodeId: string,
    onSuccess: (data?: any) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    const { notificationTitle, notificationContent } = config;

    console.log("context", context);
    const interpolatedTitle = context.interpolateVariables(
      notificationTitle || "Workflow Result",
    );
    const interpolatedContent = context.interpolateVariables(
      notificationContent || "",
    );

    try {
      NotificationService.showNotification({
        title: interpolatedTitle,
        message: interpolatedContent,
      });

      onSuccess({
        title: interpolatedTitle,
        content: interpolatedContent,
      });
    } catch (error) {
      onError(new Error(`Failed to show notification: ${error}`));
    }
  }
}
