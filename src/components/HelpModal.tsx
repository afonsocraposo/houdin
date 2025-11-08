import { Anchor, Modal, ModalProps, Stack, Text, Title } from "@mantine/core";

export default function HelpModal(props: ModalProps) {
  return (
    <Modal {...props} size="auto" title={<Title>Contact us</Title>}>
      <Stack>
        <Text>
          You can also send an email to{" "}
          <Anchor href="mailto:help@houdin.dev">help@houdin.dev</Anchor>.
        </Text>
        <iframe
          src="https://docs.google.com/forms/d/e/1FAIpQLSfH9Wxu0dxcc6X-B9lEmA4Aop5AIfH4Mr1q7YjER8KmQkZR-g/viewform?embedded=true"
          width="640"
          height="880"
          style={{ maxHeight: "75vh" }}
          title="Contact form"
        >
          Loading...
        </iframe>
      </Stack>
    </Modal>
  );
}
