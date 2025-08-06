import ModalDispatcher from "../components/ModalDispatcher";
import NotificationDispatcher from "../components/NotificationDispatcher";
import CustomMantineProvider from "./mantineProvider";

declare global {
  interface WindowEventMap {
    modalDispatch: CustomEvent;
    notificationDispatch: CustomEvent;
  }
}

const MantineDispatcher = (parent: HTMLElement) => {
  return (
    <CustomMantineProvider parent={parent}>
      <ModalDispatcher />
      <NotificationDispatcher />
    </CustomMantineProvider>
  );
};

export default MantineDispatcher;
