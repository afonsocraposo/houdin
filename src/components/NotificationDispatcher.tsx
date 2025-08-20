import { useEffect } from "react";
import { notifications, Notifications } from "@mantine/notifications";
export default function NotificationDispatcher() {
  useEffect(() => {
    const handleNotificationDispatch = (event: CustomEvent) => {
      const notificationProps = event.detail;
      notifications.show({
        ...notificationProps,
        position: "top-right",
      });
    };

    const handleNotificationCleanup = () => {
      console.debug("Cleaning up all notifications");
      notifications.clean();
    };

    window.addEventListener("notificationDispatch", handleNotificationDispatch);
    window.addEventListener("notificationCleanup", handleNotificationCleanup);

    return () => {
      window.removeEventListener(
        "notificationDispatch",
        handleNotificationDispatch,
      );
      window.removeEventListener(
        "notificationCleanup",
        handleNotificationCleanup,
      );
    };
  }, []);

  return (
    <div>
      <Notifications zIndex={1000000} />
    </div>
  ); // No UI component needed, just handling events
}
