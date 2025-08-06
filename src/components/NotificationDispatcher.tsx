import { useEffect } from "react";
import { Notifications } from "@mantine/notifications";
export default function NotificationDispatcher() {
  useEffect(() => {
    const handleNotificationDispatch = (event: CustomEvent) => {
      console.log("Notification event received:", event);
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
