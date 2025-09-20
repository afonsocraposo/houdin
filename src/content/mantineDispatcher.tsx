import ModalDispatcher from "@/components/ModalDispatcher";
import NotificationDispatcher from "@/components/NotificationDispatcher";
import { ModalEventDetail, ModalEventBaseDetail } from "@/services/modal";
import { NotificationProps } from "@/services/notification";
import { ComponentTriggerEventDetail } from "@/components/ComponentFactory";

declare global {
  interface WindowEventMap {
    modalDispatch: CustomEvent<ModalEventDetail>;
    modalClose: CustomEvent<ModalEventBaseDetail>;
    modalCleanup: CustomEvent;
    notificationDispatch: CustomEvent<NotificationProps>;
    notificationCleanup: CustomEvent;
    "workflow-component-trigger": CustomEvent<ComponentTriggerEventDetail>;
    inputModalResponse: CustomEvent;
    formModalResponse: CustomEvent;
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
