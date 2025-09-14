import ModalDispatcher from "@/components/ModalDispatcher";
import NotificationDispatcher from "@/components/NotificationDispatcher";

declare global {
  interface WindowEventMap {
    modalDispatch: CustomEvent;
    notificationDispatch: CustomEvent;
  }
}

const MantineDispatcher = () => {
  return (
    <>
      <ModalDispatcher />
      <NotificationDispatcher />
    </>
  );
};

export default MantineDispatcher;
