import { Modal, Stack, Textarea, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import CopyToClipboardButton from "@/components/CopyToClibooardButton";

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
}
export default function ElementSelectedModal({
  data: { selector, element },
}: ElementSelectedModalProps) {
  const [opened, { close }] = useDisclosure(true);
  return (
    <Modal
      opened={opened}
      onClose={close}
      title="Element Inspector"
      trapFocus={false}
      zIndex={1000000} // Ensure modal is on top
    >
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
    </Modal>
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
