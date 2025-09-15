import { Modal, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { TIMEOUT_DURATION } from "@/services/modal";

interface ElementSelectedModalProps {
  data: {
    id: string;
    title: string;
  };
}
export default function InputModal({
  data: { id, title },
}: ElementSelectedModalProps) {
  const [opened, { close }] = useDisclosure(true);
  const [input, setInput] = useState("");

  const sendResponse = (input: string | null = null) => {
    const responseEvent = new CustomEvent("inputModalResponse", {
      detail: {
        id,
        input,
      },
    });
    window.dispatchEvent(responseEvent);
  };

  useEffect(() => {
    setTimeout(close, TIMEOUT_DURATION);
  }, []); // Close after timeout

  useEffect(() => {
    if (opened) {
      return;
    }
    sendResponse();
  }, [opened]);

  return (
    <Modal
      opened={opened}
      onClose={close}
      title={title}
      trapFocus={false}
      zIndex={1000000} // Ensure modal is on top
    >
      <TextInput
        value={input}
        onChange={(e) => setInput(e.currentTarget.value)}
        onKeyUp={(e) => {
          if (e.key === "Enter") {
            sendResponse(input);
            close();
          }
        }}
      />
    </Modal>
  );
}
