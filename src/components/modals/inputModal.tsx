import { InputModalResponseDetail, TIMEOUT_DURATION } from "@/services/modal";
import { Modal, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useState } from "react";

interface InputModalProps {
  data: {
    title: string;
  };
  nonce: number;
  onClose?: () => void;
}
export default function InputModal({
  data: { title },
  nonce,
  onClose,
}: InputModalProps) {
  const [opened, { close }] = useDisclosure(true);
  const [input, setInput] = useState("");

  const sendResponse = (input?: string) => {
    const responseEvent = new CustomEvent<InputModalResponseDetail>(
      "inputModalResponse",
      {
        detail: {
          nonce,
          input,
        },
      },
    );
    window.dispatchEvent(responseEvent);
  };

  const handleClose = (input?: string) => {
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
