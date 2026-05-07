import { Box, Group, Paper, Stack, Text } from "@mantine/core";
import { UIMessage } from "ai";
import MarkdownText from "../MarkdownText";

type ChatMessageItemProps = {
  message: UIMessage;
};
export default function ChatMessageItem({ message }: ChatMessageItemProps) {
  const isUser = message.role === "user";
  return (
    <Group justify={message.role === "user" ? "end" : "start"} align="start">
      <Paper
        p="sm"
        maw="85%"
        px={isUser ? "md" : undefined}
        withBorder={isUser}
        radius="xl"
      >
        <Stack>
          {message.parts.map((part, index) => {
            if (part.type === "text") {
              if (message.role === "assistant") {
                return <MarkdownText key={index}>{part.text}</MarkdownText>;
              }
              return (
                <Text key={index} fz="sm" style={{ whiteSpace: "pre-wrap" }}>
                  {part.text}
                </Text>
              );
            }

            if (part.type.startsWith("tool-")) {
              return (
                <Box key={index}>
                  <Text size="xs" c="dimmed" style={{ whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(part, null, 2)}
                  </Text>
                </Box>
              );
            }
          })}
        </Stack>
      </Paper>
    </Group>
  );
}
