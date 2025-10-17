import { Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

export default function ModalBase({
  title,
  onClose,
  children,
}: {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
}) {
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
      lockScroll={false}
    >
      {children}
    </Modal>
  );
}
