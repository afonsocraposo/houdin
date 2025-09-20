import { FormModalResponseDetail, TIMEOUT_DURATION } from "@/services/modal";
import { Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect } from "react";
import { FormFieldDefinition } from "../formAction/FormBuilder";
import FormRenderer from "../formAction/FormRenderer";

interface FormModalProps {
  data: {
    fields: FormFieldDefinition[];
    title: string;
  };
  nonce: number;
  onClose?: () => void;
}
export default function FormModal({
  data: { fields, title },
  nonce,
  onClose,
}: FormModalProps) {
  const [opened, { close }] = useDisclosure(true);

  const sendResponse = (values?: Record<string, any>) => {
    const responseEvent = new CustomEvent<FormModalResponseDetail>(
      "formModalResponse",
      {
        detail: {
          nonce,
          values,
        },
      },
    );
    window.dispatchEvent(responseEvent);
  };

  const handleClose = (data?: Record<string, any>) => {
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
