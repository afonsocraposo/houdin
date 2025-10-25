import {
  ActionIcon,
  Box,
  Group,
  InputLabel,
  Modal,
  Stack,
  Text,
  Textarea,
  TextareaProps,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconMaximize } from "@tabler/icons-react";

export default function MaximizableTextArea(props: TextareaProps) {
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <>
      <Group h={28} justify="space-between" wrap="nowrap" align="center">
        {props.label && (
          <InputLabel required={props.required}>{props.label}</InputLabel>
        )}
        <ActionIcon variant="subtle" onClick={open}>
          <IconMaximize />
        </ActionIcon>
      </Group>
      {props.description && (
        <Text size="xs" c="dimmed" mb="xs">
          {props.description}
        </Text>
      )}
      <Textarea
        {...props}
        required={undefined}
        label={undefined}
        description={undefined}
        autosize
        labelProps={{ style: { width: "100%" } }}
        maxRows={10}
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
          <Stack h="100%" gap="0">
            {props.description && (
              <Text size="xs" c="dimmed" mb="xs">
                {props.description}
              </Text>
            )}
            <Box flex={1}>
              <Textarea
                {...props}
                label={undefined}
                description={undefined}
                required={undefined}
                wrapperProps={{
                  style: {
                    width: "100%",
                    height: "100%",
                  },
                }}
                styles={{
                  wrapper: { height: "100%" },
                  input: { height: "100%" },
                }}
              />
            </Box>
          </Stack>
        </Box>
      </Modal>
    </>
  );
}
