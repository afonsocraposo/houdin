import { useEffect, useState } from "react";
import ElementSelectedModal from "@/components/modals/elementSelected";
import CustomModal from "@/components/modals/customModal";

export default function ModalDispatcher() {
  const [modal, setModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);

  useEffect(() => {
    const handleModalDispatch = (event: CustomEvent) => {
      const modal = event.detail;
      setModal(modal.type);
      setModalData(modal.data);
    };

    const handleModalCleanup = () => {
      console.debug("Cleaning up all modals");
      setModal(null);
      setModalData(null);
    };

    window.addEventListener("modalDispatch", handleModalDispatch);
    window.addEventListener("modalCleanup", handleModalCleanup);

    return () => {
      window.removeEventListener("modalDispatch", handleModalDispatch);
      window.removeEventListener("modalCleanup", handleModalCleanup);
    };
  }, []);

  return (
    <>
      {modal === "elementSelected" && (
        <ElementSelectedModal data={modalData} key={Math.random()} />
      )}
      {modal === "customModal" && (
        <CustomModal data={modalData} key={Math.random()} />
      )}
    </>
  );
}
