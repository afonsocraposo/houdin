import { TIMEOUT_DURATION } from "@/services/modal";
import { Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect } from "react";
import { FormFieldDefinition } from "../formAction/FormBuilder";
import FormRenderer from "../formAction/FormRenderer";

interface FormModalProps {
  data: {
    nonce: string;
    fields: FormFieldDefinition[];
  };
  onClose?: () => void;
}
export default function FormModal({
  data: { nonce, fields },
  onClose,
}: FormModalProps) {
  const [opened, { close }] = useDisclosure(true);

  const sendResponse = (values: Record<string, any> | null = null) => {
    const responseEvent = new CustomEvent("formModalResponse", {
      detail: {
        nonce,
        values,
      },
    });
    window.dispatchEvent(responseEvent);
  };

  const handleClose = () => {
    close();
    if (onClose) {
      onClose();
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(handleClose, TIMEOUT_DURATION);
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!opened) {
      sendResponse();
    }
  }, [opened]);

  return (
    <Modal opened={opened} onClose={handleClose} trapFocus={false}>
      <FormRenderer
        fields={fields}
        onSubmit={(data) => {
          sendResponse(data);
          handleClose();
        }}
      />
    </Modal>
  );
}
