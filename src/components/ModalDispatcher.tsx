import { useEffect, useState } from "react";
import ElementSelectedModal from "@/components/modals/elementSelected";
import CustomModal from "@/components/modals/customModal";
import InputModal from "./modals/inputModal";
import FormModal from "./modals/formModal";
import { generateId } from "@/utils/helpers";
import { ModalEventBaseDetail, ModalEventDetail } from "@/services/modal";

interface ModalInstance {
  id: string;
  type: string;
  data: any;
  nonce: number;
}

export default function ModalDispatcher() {
  const [modals, setModals] = useState<ModalInstance[]>([]);

  useEffect(() => {
    const handleModalDispatch = (event: CustomEventInit<ModalEventDetail>) => {
      const customEvent = event as CustomEvent;
      const modal = customEvent.detail;
      const modalInstance: ModalInstance = {
        id: modal.id || generateId("modal"),
        type: modal.type,
        data: modal.data,
        nonce: modal.nonce,
      };
      setModals((prev) => [...prev, modalInstance]);
    };

    const handleModalClose = (event: CustomEventInit<ModalEventBaseDetail>) => {
      const customEvent = event as CustomEvent;
      const modalId = customEvent.detail.id;
      setModals((prev) => prev.filter((modal) => modal.id !== modalId));
    };

    const handleModalCleanup = () => {
      console.debug("Cleaning up all modals");
      setModals([]);
    };

    window.addEventListener("modalDispatch", handleModalDispatch);
    window.addEventListener("modalClose", handleModalClose);
    window.addEventListener("modalCleanup", handleModalCleanup);

    return () => {
      window.removeEventListener("modalDispatch", handleModalDispatch);
      window.removeEventListener("modalClose", handleModalClose);
      window.removeEventListener("modalCleanup", handleModalCleanup);
    };
  }, []);

  const handleModalClose = (modalId: string) => {
    setModals((prev) => prev.filter((modal) => modal.id !== modalId));
  };

  return (
    <>
      {modals.map((modal) => {
        switch (modal.type) {
          case "elementSelected":
            return (
              <ElementSelectedModal
                key={modal.id}
                data={modal.data}
                onClose={() => handleModalClose(modal.id)}
              />
            );
          case "customModal":
            return (
              <CustomModal
                key={modal.id}
                data={modal.data}
                onClose={() => handleModalClose(modal.id)}
              />
            );
          case "inputModal":
            return (
              <InputModal
                key={modal.id}
                data={modal.data}
                onClose={() => handleModalClose(modal.id)}
                nonce={modal.nonce}
              />
            );
          case "formModal":
            return (
              <FormModal
                key={modal.id}
                data={modal.data}
                onClose={() => handleModalClose(modal.id)}
                nonce={modal.nonce}
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
}
