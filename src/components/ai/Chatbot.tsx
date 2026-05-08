import { useStore } from "@/store";
import { Box, Group, ScrollArea, Stack, Text } from "@mantine/core";
import ChatInput from "./ChatInput";
import { sendMessageToBackground } from "@/lib/messages";
import { MessageType } from "@/types/messages";
import { useEffect, useMemo, useRef } from "react";
import { newWorkflowId } from "@/utils/helpers";
import ChatMessages from "./ChatMessages";
import ThinkingWave from "./ThinkingWave";

type ChatbotProps = {
  workflowId?: string;
};
export default function Chatbot({ workflowId }: ChatbotProps) {
  const id = useMemo(() => workflowId || newWorkflowId(), [workflowId]);
  const { getSessionByWorkflowId } = useStore();
  const session = getSessionByWorkflowId(id);
  const viewportRef = useRef<HTMLDivElement>(null);

  const sendMessage = (input: string) => {
    sendMessageToBackground(MessageType.RUN_CHAT, {
      workflowId: session.workflowId,
      input,
    });
  };

  const stopChat = () =>
    sendMessageToBackground(MessageType.STOP_CHAT, {
      workflowId: session.workflowId,
    });

  // scroll to bottom when chat loads
  useEffect(() => {
    viewportRef.current?.scrollTo({
      top: viewportRef.current.scrollHeight,
      behavior: "instant",
    });
  }, [workflowId]);

  // scroll to bottom when new message arrives
  useEffect(() => {
    viewportRef.current?.scrollTo({
      top: viewportRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [session.messages]);

  return (
    <Stack h="100%" gap="sm" style={{ minHeight: 0 }}>
      <Box flex={1} style={{ minHeight: 0, position: "relative" }}>
        <ScrollArea
          type="hover"
          viewportRef={viewportRef}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <ChatMessages messages={session.messages} />
          {session.status === "submitted" && (
            <Group mt="sm">
              <ThinkingWave />
            </Group>
          )}
          {session.status === "error" && (
            <Text size="sm" c="red">
              {session.error || "An error occurred during the chat session."}
            </Text>
          )}
        </ScrollArea>
      </Box>
      <Box style={{ flexShrink: 0 }}>
        <ChatInput
          pending={
            session.status === "submitted" || session.status === "streaming"
          }
          onAbort={stopChat}
          onSubmit={sendMessage}
        />
      </Box>
    </Stack>
  );
}
