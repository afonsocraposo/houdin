import definition from "./show-notification.definition";
import { BaseAction } from "@/types/actions";
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
  constructor() {
    super(definition);
  }

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
