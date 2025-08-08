import { Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import MarkdownText from "../MarkdownText";

interface ElementSelectedModalProps {
  data: {
    title: string;
    content: string;
  };
}
export default function CustomModal({
  data: { title, content },
}: ElementSelectedModalProps) {
  const [opened, { close }] = useDisclosure(true);
  return (
    <Modal
      opened={opened}
      onClose={close}
      title={title}
      trapFocus={false}
      zIndex={1000} // Ensure modal is on top
    >
      <MarkdownText>{content}</MarkdownText>
    </Modal>
  );
}
