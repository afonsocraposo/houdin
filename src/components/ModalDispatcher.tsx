import { useEffect, useState } from "react";
import ElementSelectedModal from "../components/modals/elementSelected";
import CustomModal from "../components/modals/customModal";

export default function ModalDispatcher() {
  const [modal, setModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  useEffect(() => {
    const handleModalDispatch = (event: CustomEvent) => {
      const modal = event.detail;
      setModal(modal.type);
      setModalData(modal.data);
    };

    window.addEventListener("modalDispatch", handleModalDispatch);
    return () =>
      window.removeEventListener("modalDispatch", handleModalDispatch);
  }, []);
  return (
    <>
      {modal === "elementSelected" && <ElementSelectedModal data={modalData} />}
      {modal === "customModal" && <CustomModal data={modalData} />}
    </>
  );
}
