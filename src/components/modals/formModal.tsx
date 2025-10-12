import { FormModalResponseDetail, TIMEOUT_DURATION } from "@/services/modal";
import { useEffect } from "react";
import { FormFieldDefinition } from "../formAction/FormBuilder";
import FormRenderer from "../formAction/FormRenderer";
import ModalBase from "./modalBase";

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
      <FormRenderer fields={fields} onSubmit={(data) => handleClose(data)} />
    </ModalBase>
  );
}
