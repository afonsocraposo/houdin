import { Container, Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import MarkdownText from "@/components/MarkdownText";

interface CustomModalProps {
  data: {
    title: string;
    content: string;
  };
  onClose?: () => void;
}
export default function CustomModal({
  data: { title, content },
  onClose,
}: CustomModalProps) {
  const [opened, { close }] = useDisclosure(true);

  const handleClose = () => {
    close();
    if (onClose) {
      onClose();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={title}
      trapFocus={false}
      zIndex={1000000} // Ensure modal is on top
    >
      <Container fluid>
        <MarkdownText style={{ overflowWrap: "break-word" }}>
          {content}
        </MarkdownText>
      </Container>
    </Modal>
  );
}
