import { BaseAction, ActionMetadata } from "@/types/actions";
import { textProperty, textareaProperty } from "@/types/config-properties";
import { NotificationService } from "@/services/notification";

interface ShowNotificationActionConfig {
  notificationTitle: string;
  notificationContent: string;
}

interface ShowNotificationActionOutput {
  title: string;
  content: string;
}

export class ShowNotificationAction extends BaseAction<ShowNotificationActionConfig, ShowNotificationActionOutput> {
  static readonly metadata: ActionMetadata = {
    type: "show-notification",
    label: "Show Notification",
    icon: "🔔",
    description: "Display notification",
  };

  static readonly configSchema = {
    properties: {
      notificationTitle: textProperty({
        label: "Notification Title",
        placeholder: "Information, {{node-id}} Data",
        description:
          "Title of the notification. Use {{node-id}} to reference action outputs",
        defaultValue: "Workflow Result",
      }),
      notificationContent: textareaProperty({
        label: "Notification Content",
        placeholder: "The extracted content is: {{get-content-node}}",
        description:
          "Content to display. Use {{node-id}} to reference action outputs. Supports Markdown.",
        rows: 4,
      }),
    },
  };

  readonly outputExample = {
    title: "Workflow Result",
    content: "The extracted content is: Example content",
  };

  async execute(
    config: ShowNotificationActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data: ShowNotificationActionOutput) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    const { notificationTitle, notificationContent } = config;

    try {
      NotificationService.showNotification({
        title: notificationTitle,
        message: notificationContent,
      });

      onSuccess({
        title: notificationTitle,
        content: notificationContent,
      });
    } catch (error) {
      onError(new Error(`Failed to show notification: ${error}`));
    }
  }
}
