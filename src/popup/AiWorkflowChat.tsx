import browser from "@/services/browser";
import {
  sendMessageToBackground,
  sendMessageToContentScript,
} from "@/lib/messages";
import { useStore } from "@/store";
import {
  GenerationMessage,
  GenerationPromptRequest,
  GenerationPromptResponse,
  GenerationSession,
  GenerationSessionStatus,
} from "@/types/generation-session";
import { generateId, newWorkflowId } from "@/utils/helpers";
import {
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import {
  IconArrowRight,
  IconDeviceFloppy,
  IconFocus2,
  IconRefresh,
  IconSparkles,
} from "@tabler/icons-react";
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";

const getSessionGreeting = (): GenerationMessage => ({
  id: generateId("msg", 10),
  role: "assistant",
  kind: "chat",
  content:
    "Tell me what you want the workflow to do. I’ll keep the draft session saved as we build it.",
  createdAt: Date.now(),
});

const createInitialSession = (): GenerationSession => {
  const now = Date.now();

  return {
    id: generateId("session", 10),
    status: "idle",
    draftWorkflow: {
      id: newWorkflowId(),
      name: "Untitled workflow",
      description: "",
      urlPattern: "https://*",
      nodes: [],
      connections: [],
      enabled: false,
      variables: {},
      modifiedAt: now,
    },
    messages: [getSessionGreeting()],
    pageContext: null,
    executionRefs: [],
    revision: 0,
    createdAt: now,
    updatedAt: now,
  };
};

const statusLabel: Record<GenerationSessionStatus, string> = {
  idle: "Idle",
  drafting: "Drafting",
  testing: "Testing",
  paused: "Paused",
  completed: "Completed",
  failed: "Failed",
};

function AiWorkflowChat() {
  const activeGenerationSession = useStore(
    (state) => state.activeGenerationSession,
  );
  const setActiveGenerationSession = useStore(
    (state) => state.setActiveGenerationSession,
  );
  const updateActiveGenerationSession = useStore(
    (state) => state.updateActiveGenerationSession,
  );

  const [prompt, setPrompt] = useState("");
  const [isSending, setIsSending] = useState(false);

  const session = activeGenerationSession;

  const draftSummary = useMemo(() => {
    if (!session?.draftWorkflow) {
      return {
        name: "No draft yet",
        urlPattern: "—",
        nodeCount: 0,
      };
    }

    return {
      name: session.draftWorkflow.name,
      urlPattern: session.draftWorkflow.urlPattern,
      nodeCount: session.draftWorkflow.nodes.length,
    };
  }, [session]);

  const appendMessage = (message: GenerationMessage) => {
    updateActiveGenerationSession((current) => ({
      ...current,
      messages: [...current.messages, message],
      updatedAt: Date.now(),
    }));
  };

  const capturePageContext = async () => {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];
      if (!activeTab?.id) {
        return;
      }

      const response = await sendMessageToContentScript(
        activeTab.id,
        "GET_PAGE_CONTEXT",
        {},
      );

      const snapshot = response?.data;
      if (!snapshot) {
        return;
      }

      updateActiveGenerationSession((current) => ({
        ...current,
        pageContext: snapshot,
        updatedAt: Date.now(),
      }));

      appendMessage({
        id: generateId("msg", 10),
        role: "assistant",
        kind: "result",
        content: `Captured page context for ${snapshot.title || snapshot.url}.`,
        createdAt: Date.now(),
      });
    } catch (error) {
      appendMessage({
        id: generateId("msg", 10),
        role: "assistant",
        kind: "error",
        content: `Failed to capture page context: ${(error as Error).message}`,
        createdAt: Date.now(),
      });
    }
  };

  const ensureSession = () => {
    if (!session) {
      const initialSession = createInitialSession();
      setActiveGenerationSession(initialSession);
      return initialSession;
    }

    return session;
  };

  const handleSend = async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || isSending || !session) {
      return;
    }

    setIsSending(true);

    try {
      const userMessage: GenerationMessage = {
        id: generateId("msg", 10),
        role: "user",
        kind: "chat",
        content: trimmedPrompt,
        createdAt: Date.now(),
      };

      const thinkingMessage: GenerationMessage = {
        id: generateId("msg", 10),
        role: "assistant",
        kind: "thinking",
        content: "thinking",
        createdAt: Date.now(),
      };

      const sessionWithPendingMessages = {
        ...ensureSession(),
        status: "drafting" as const,
        messages: [...ensureSession().messages, userMessage, thinkingMessage],
        updatedAt: Date.now(),
      };

      setActiveGenerationSession(sessionWithPendingMessages);

      const request: GenerationPromptRequest = {
        prompt: trimmedPrompt,
        session: sessionWithPendingMessages,
      };

      const response = (await sendMessageToBackground(
        "AI_GENERATION_SUBMIT",
        request,
      )) as GenerationPromptResponse | null;

      if (response?.session) {
        setActiveGenerationSession(response.session);
      }

      setPrompt("");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      await handleSend();
    }
  };

  const handleReset = () => {
    setActiveGenerationSession(createInitialSession());
    setPrompt("");
  };

  useEffect(() => {
    if (!session) {
      setActiveGenerationSession(createInitialSession());
    }
  }, [session, setActiveGenerationSession]);

  const openDesigner = () => {
    browser.tabs.create({
      url: browser.runtime.getURL("src/config/index.html") + "#/designer",
    });
  };

  const sessionStatus = session?.status ?? "idle";
  const messages = session?.messages ?? [];

  return (
    <Stack gap="sm" h="100%">
      <Card withBorder p="sm">
        <Group justify="space-between" align="start" gap="xs">
          <Stack gap={4} style={{ flex: 1 }}>
            <Group gap="xs">
              <IconSparkles size={16} />
              <Text fw={600} size="sm">
                AI Workflow
              </Text>
              <Badge size="sm" variant="light">
                {statusLabel[sessionStatus]}
              </Badge>
            </Group>
            <Text size="xs" c="dimmed">
              Create and refine workflows by chatting here.
            </Text>
          </Stack>

          <Button
            size="xs"
            variant="subtle"
            leftSection={<IconRefresh size={14} />}
            onClick={handleReset}
          >
            Reset
          </Button>
        </Group>
      </Card>

      <Card withBorder p="sm">
        <Stack gap={4}>
          <Text size="xs" c="dimmed">
            Draft
          </Text>
          <Text size="sm" fw={500} truncate>
            {draftSummary.name}
          </Text>
        <Group gap="xs">
            <Badge variant="light" color="blue" size="sm">
              {draftSummary.nodeCount} nodes
            </Badge>
            <Badge variant="light" color="gray" size="sm">
              {draftSummary.urlPattern}
            </Badge>
            <Badge variant="light" color={session?.pageContext ? "green" : "gray"} size="sm">
              {session?.pageContext ? "Page context ready" : "No page context"}
            </Badge>
          </Group>
        </Stack>
      </Card>

      <Button
        variant="light"
        leftSection={<IconFocus2 size={16} />}
        onClick={capturePageContext}
      >
        Capture Current Page
      </Button>

      <ScrollArea h={220} type="hover">
        <Stack gap="xs">
          {messages.length === 0 ? (
            <Card withBorder>
              <Text size="sm" c="dimmed" ta="center">
                Start the session to begin chatting.
              </Text>
            </Card>
          ) : (
            messages.map((message) => {
              const isUser = message.role === "user";
              const roleLabel = isUser
                ? "You"
                : message.kind === "tool"
                  ? "Tool"
                  : message.kind === "plan"
                    ? "Assistant · Plan"
                    : message.kind === "thinking"
                      ? "Assistant · Thinking"
                    : message.kind === "error"
                      ? "Assistant · Error"
                      : "Assistant";
              return (
                <Paper
                  key={message.id}
                  withBorder
                  p="sm"
                  radius="md"
                  style={{
                    alignSelf: isUser ? "flex-end" : "flex-start",
                    maxWidth: "92%",
                    background: isUser ? "var(--mantine-color-blue-light)" : undefined,
                  }}
                >
                  <Text size="xs" c="dimmed" fw={500} mb={4}>
                    {roleLabel}
                  </Text>
                  <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                    {message.content}
                  </Text>
                </Paper>
              );
            })
          )}
        </Stack>
      </ScrollArea>

      <Textarea
        value={prompt}
        onChange={(event) => setPrompt(event.currentTarget.value)}
        onKeyDown={handleKeyDown}
        placeholder="Describe the workflow you want to create..."
        autosize
        minRows={3}
        maxRows={5}
      />

      <Group grow gap="xs">
        <Button
          leftSection={<IconArrowRight size={16} />}
          onClick={handleSend}
          loading={isSending}
          disabled={!prompt.trim()}
        >
          Send
        </Button>
        <Button
          variant="light"
          leftSection={<IconDeviceFloppy size={16} />}
          onClick={openDesigner}
          disabled={!session?.draftWorkflow}
        >
          Open Designer
        </Button>
      </Group>

      <Divider />

      <Text size="xs" c="dimmed">
        Test and AI execution feedback will plug into this session next.
      </Text>
    </Stack>
  );
}

export default AiWorkflowChat;
