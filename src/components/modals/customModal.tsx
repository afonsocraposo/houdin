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
  
  const handleClose = () => {
    close();
    // Dispatch modal dismissed event for workflow continuation
    const dismissEvent = new CustomEvent("modalDispatch", {
      detail: {
        type: "modalDismissed"
      },
    });
    window.dispatchEvent(dismissEvent);
  };
  
  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={title}
      trapFocus={false}
      zIndex={1000} // Ensure modal is on top
    >
      <MarkdownText>{content}</MarkdownText>
    </Modal>
  );
}
