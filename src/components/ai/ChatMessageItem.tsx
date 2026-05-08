import { Group, Paper, Stack, Text } from "@mantine/core";
import { UIMessage } from "ai";
import MarkdownText from "../MarkdownText";
import ToolInvocationCard from "./ToolInvocationCard";

type ChatMessageItemProps = {
  message: UIMessage;
};
export default function ChatMessageItem({ message }: ChatMessageItemProps) {
  const isUser = message.role === "user";
  const hasToolParts = message.parts.some((part) =>
    part.type.startsWith("tool-"),
  );
  return (
    <Group justify={message.role === "user" ? "end" : "start"} align="start">
      <Paper
        px={isUser ? "md" : undefined}
        py="xs"
        maw="85%"
        w={!isUser && hasToolParts ? "85%" : undefined}
        withBorder={isUser}
        radius="xl"
      >
        <Stack w="100%" gap="xs">
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
              return <ToolInvocationCard key={index} part={part} />;
            }

            return null;
          })}
        </Stack>
      </Paper>
    </Group>
  );
}
