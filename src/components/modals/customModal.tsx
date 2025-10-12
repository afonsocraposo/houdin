import { Container } from "@mantine/core";
import MarkdownText from "@/components/MarkdownText";
import ModalBase from "./modalBase";

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
  return (
    <ModalBase title={title} onClose={onClose}>
      <Container fluid>
        <MarkdownText style={{ overflowWrap: "break-word" }}>
          {content}
        </MarkdownText>
      </Container>
    </ModalBase>
  );
}
