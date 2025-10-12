import { InputModalResponseDetail, TIMEOUT_DURATION } from "@/services/modal";
import { TextInput } from "@mantine/core";
import { useEffect, useState } from "react";
import ModalBase from "./modalBase";

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
    if (onClose) {
      onClose();
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(handleClose, TIMEOUT_DURATION);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <ModalBase onClose={handleClose} title={title}>
      <TextInput
        value={input}
        onChange={(e) => setInput(e.currentTarget.value)}
        onKeyUp={(e) => {
          if (e.key === "Enter") {
            handleClose(input);
          }
        }}
      />
    </ModalBase>
  );
}
