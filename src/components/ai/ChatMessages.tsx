import { UIMessage } from "ai";
import ChatMessageItem from "./ChatMessageItem";
import { Stack } from "@mantine/core";

type ChatMessagesProps = {
  messages: UIMessage[];
};
export default function ChatMessages({ messages }: ChatMessagesProps) {
  console.log(messages);
  return (
    <Stack gap="xs">
      {messages.map((message) => (
        <ChatMessageItem key={message.id} message={message} />
      ))}
    </Stack>
  );
}
