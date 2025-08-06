import { Button, Modal, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

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
    <Modal opened={opened} onClose={close} title={title}>
      <Button>Test</Button>
      <Text>{content}</Text>
    </Modal>
  );
}
