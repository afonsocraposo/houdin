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

    window.addEventListener("notificationDispatch", handleNotificationDispatch);
    return () =>
      window.removeEventListener(
        "notificationDispatch",
        handleNotificationDispatch,
      );
  }, []);

  return (
    <>
      <Notifications />
    </>
  ); // No UI component needed, just handling events
}
