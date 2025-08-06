export class NotificationService {
  public static showNotification({
    title,
    message,
    timeout = 3000,
  }: {
    title?: string;
    message?: string;
    timeout?: number;
  }): void {
    const notificationEvent = new CustomEvent("notificationDispatch", {
      detail: {
        title,
        message,
        autoclose: timeout,
      },
    });
    window.dispatchEvent(notificationEvent);
  }

  public static showErrorNotification({
    title = "Error",
    message,
    timeout = 3000,
  }: {
    title?: string;
    message?: string;
    timeout?: number;
  }): void {
    const notificationEvent = new CustomEvent("notificationDispatch", {
      detail: {
        title,
        message,
        color: "red",
        autoclose: timeout,
      },
    });
    window.dispatchEvent(notificationEvent);
  }
}
