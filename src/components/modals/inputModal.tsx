import { TIMEOUT_DURATION } from "@/services/modal";
import { Modal, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useState } from "react";

interface InputModalProps {
  data: {
    nonce: string;
    title: string;
  };
  onClose?: () => void;
}
export default function InputModal({
  data: { nonce, title },
  onClose,
}: InputModalProps) {
  const [opened, { close }] = useDisclosure(true);
  const [input, setInput] = useState("");

  const sendResponse = (input: string | null = null) => {
    const responseEvent = new CustomEvent("inputModalResponse", {
      detail: {
        nonce,
        input,
      },
    });
    window.dispatchEvent(responseEvent);
  };

  const handleClose = (input: string | null = null) => {
    sendResponse(input);
    close();
    if (onClose) {
      onClose();
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(handleClose, TIMEOUT_DURATION);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={title}
      trapFocus={false}
      zIndex={1000000} // Ensure modal is on top
    >
      <TextInput
        value={input}
        onChange={(e) => setInput(e.currentTarget.value)}
        onKeyUp={(e) => {
          if (e.key === "Enter") {
            handleClose(input);
          }
        }}
      />
    </Modal>
  );
}
