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
    title: string;
  };
  onClose?: () => void;
}
export default function FormModal({
  data: { nonce, fields, title },
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

  const handleClose = (data?: any) => {
    sendResponse(data);
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
      trapFocus={false}
      title={title}
    >
      <FormRenderer fields={fields} onSubmit={(data) => handleClose(data)} />
    </Modal>
  );
}
