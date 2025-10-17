import { sendMessageToContentScript } from "@/lib/messages";
import browser from "@/services/browser";

export interface NotificationProps {
  title?: string;
  message: string;
  color?: string;
  autoClose?: number;
}

export class NotificationService {
  public static showNotification({
    title,
    message = "",
    color,
    timeout = 3000,
  }: {
    title?: string;
    message?: string;
    timeout?: number;
    color?: string;
  }): void {
    this.sendNotification({
      title,
      message,
      color,
      autoClose: timeout,
    });
  }

  public static showErrorNotification({
    title = "Error",
    message = "",
    timeout = 3000,
  }: {
    title?: string;
    message?: string;
    timeout?: number;
  }): void {
    this.sendNotification({
      title,
      message,
      color: "red",
      autoClose: timeout,
    });
  }

  public static showNotificationFromBackground({
    title,
    message = "",
    timeout = 3000,
  }: {
    title?: string;
    message?: string;
    timeout?: number;
  }): void {
    this.sendNotification(
      {
        title,
        message,
        autoClose: timeout,
      },
      true,
    );
  }

  public static showErrorNotificationFromBackground({
    title = "Error",
    message = "",
    timeout = 3000,
  }: {
    title?: string;
    message?: string;
    timeout?: number;
  }): void {
    this.sendNotification(
      {
        title,
        message,
        color: "red",
        autoClose: timeout,
      },
      true,
    );
  }

  private static async sendNotification(
    payload: NotificationProps,
    background: boolean = false,
  ): Promise<void> {
    if (background) {
      // Background script: send message to active tab's content script
      try {
        const tabs = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (tabs[0]?.id) {
          sendMessageToContentScript(tabs[0].id, "SHOW_NOTIFICATION", payload);
          console.debug(
            "Background: Sent notification message to content script:",
            payload,
          );
        } else {
          console.warn("Background: No active tab found for notification");
        }
      } catch (error) {
        console.error(
          "Background: Failed to send notification message:",
          error,
        );
      }
    } else {
      // Content script: use existing CustomEvent approach
      const notificationEvent = new CustomEvent<NotificationProps>(
        "notificationDispatch",
        {
          detail: payload,
        },
      );
      console.debug("Content: Dispatching notification event:", payload);
      window.dispatchEvent(notificationEvent);
    }
  }
}
