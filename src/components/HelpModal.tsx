import { Modal, ModalProps } from "@mantine/core";

interface HelpModalProps extends ModalProps {}
export default function HelpModal(props: HelpModalProps) {
  return (
    <Modal {...props} size="auto" title="Contact us">
      <iframe
        src="https://docs.google.com/forms/d/e/1FAIpQLSfH9Wxu0dxcc6X-B9lEmA4Aop5AIfH4Mr1q7YjER8KmQkZR-g/viewform?embedded=true"
        width="640"
        height="880"
        style={{ maxHeight: "75vh" }}
      >
        Loading...
      </iframe>
    </Modal>
  );
}
