import { Stack, Textarea, TextInput } from "@mantine/core";
import CopyToClipboardButton from "@/components/CopyToClibooardButton";
import ModalBase from "./modalBase";

interface ElementSelectedModalProps {
  data: {
    selector: string;
    element: {
      tagName: string;
      id: string | null;
      className: string | null;
      textContent: string;
    };
  };
  onClose?: () => void;
}
export default function ElementSelectedModal({
  data: { selector, element },
  onClose,
}: ElementSelectedModalProps) {
  return (
    <ModalBase onClose={onClose} title="Element Inspector">
      <Stack justify="stretch">
        <InfoRow label="Selector" value={selector} />
        <InfoRow label="Tag Name" value={element.tagName} />
        <InfoRow label="ID" value={element.id || null} />
        <InfoRow label="Class Name" value={element.className || null} />
        <InfoRow
          label="Text Content"
          value={element.textContent || null}
          textArea
        />
      </Stack>
    </ModalBase>
  );
}

function InfoRow({
  label,
  value,
  textArea = false,
}: {
  label: string;
  value: string | null;
  textArea?: boolean;
}) {
  if (textArea) {
    return (
      <Textarea
        label={label}
        defaultValue={value || ""}
        rightSection={<CopyToClipboardButton value={value || ""} />}
        autosize
        minRows={2}
        maxRows={4}
      />
    );
  }
  return (
    <TextInput
      label={label}
      defaultValue={value || ""}
      rightSection={<CopyToClipboardButton value={value || ""} />}
    />
  );
}
