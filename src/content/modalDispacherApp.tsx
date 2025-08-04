import { useEffect, useState } from "react";
import ElementSelectedModal from "./modals/elementSelected";

declare global {
  interface WindowEventMap {
    modalDispatch: CustomEvent;
  }
}

const App = () => {
  const [modal, setModal] = useState<{ type: string; data: any } | null>(null);

  useEffect(() => {
    const handleModalDispatch = (event: CustomEvent) => {
      console.log(event.detail);
      setModal(event.detail);
    };

    window.addEventListener("modalDispatch", handleModalDispatch);
    return () =>
      window.removeEventListener("modalDispatch", handleModalDispatch);
  }, []);

  switch (modal?.type) {
    case "elementSelected":
      const { selector, element } = modal.data;
      return (
        <ElementSelectedModal
          // Use a unique key to force re-render when modal data changes
          key={Math.random()}
          selector={selector}
          element={element}
        />
      );
    default:
      return null;
  }
};

export default App;
