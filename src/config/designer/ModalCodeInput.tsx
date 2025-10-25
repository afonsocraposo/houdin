import { ActionIcon, Box, InputLabel, Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconMaximize } from "@tabler/icons-react";
import CodeInput, { CodeInputProps } from "./CodeInput";

export default function MaximizableCodeInput(props: CodeInputProps) {
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <>
      <CodeInput
        {...props}
        label={props.label}
        labelRightSection={
          <ActionIcon variant="subtle" onClick={open}>
            <IconMaximize />
          </ActionIcon>
        }
      />
      <Modal
        size="80vw"
        centered
        transitionProps={{ transition: "fade", duration: 200 }}
        opened={opened}
        onClose={close}
        title={
          props.label && (
            <InputLabel required={props.required}>{props.label}</InputLabel>
          )
        }
      >
        <Box h="80vh" style={{ overflow: "hidden" }}>
          <CodeInput
            {...props}
            label={undefined}
            height="100%"
            required={false}
          />
        </Box>
      </Modal>
    </>
  );
}
