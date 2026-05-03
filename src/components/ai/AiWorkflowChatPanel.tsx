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
} from "@/types/generation-session";
import { generateId, newWorkflowId } from "@/utils/helpers";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Select,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  Tooltip,
} from "@mantine/core";
import {
  IconExternalLink,
  IconFileSearch,
  IconRefresh,
  IconSend2,
} from "@tabler/icons-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useElementSize, useToggle } from "@mantine/hooks";
import ThinkingWave from "./ThinkingWave";

const createInitialSession = (): GenerationSession => {
  const now = Date.now();

  return {
    id: generateId("session", 10),
    status: "idle",
    workflowId: null,
    messages: [],
    pageContext: null,
    executionRefs: [],
    revision: 0,
    createdAt: now,
    updatedAt: now,
  };
};

export default function AiWorkflowChatPanel() {
  const workflows = useStore((state) => state.workflows);
  const activeGenerationWorkflowId = useStore(
    (state) => state.activeGenerationWorkflowId,
  );
  const setActiveGenerationSessionForWorkflow = useStore(
    (state) => state.setActiveGenerationSessionForWorkflow,
  );
  const getGenerationSessionForWorkflow = useStore(
    (state) => state.getGenerationSessionForWorkflow,
  );
  const setActiveGenerationSession = useStore(
    (state) => state.setActiveGenerationSession,
  );
  const getActiveGenerationSession = useStore(
    (state) => state.getActiveGenerationSession,
  );
  const updateActiveGenerationSession = useStore(
    (state) => state.updateActiveGenerationSession,
  );
  const [prompt, setPrompt] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [usePageContext, togglePageContext] = useToggle([true, false]);
  const { ref, height } = useElementSize();
  const { ref: inputRef } = useElementSize();

  const session = getActiveGenerationSession();
  const hasMessages = Boolean(session?.messages.length);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const draftSummary = useMemo(() => {
    const workflow = session?.workflowId
      ? workflows.find((item) => item.id === session.workflowId)
      : null;

    if (!workflow) {
      return { name: "No draft yet", urlPattern: "—", nodeCount: 0 };
    }

    return {
      name: workflow.name,
      urlPattern: workflow.urlPattern,
      nodeCount: workflow.nodes.length,
    };
  }, [session, workflows]);

  const activeWorkflowValue = activeGenerationWorkflowId;
  const workflowOptions = useMemo(() => {
    const w = [
      ...workflows.map((workflow) => ({
        value: workflow.id,
        label: workflow.name,
      })),
    ];

    if (!workflows.some((wf) => wf.id === activeWorkflowValue)) {
      w.unshift({
        value: activeWorkflowValue!,
        label:
          workflows.find((wf) => wf.id === activeWorkflowValue)?.name ||
          "Start new workflow",
      });
    } else {
      w.unshift({
        value: "__new__",
        label: "Start new workflow",
      });
    }
    return w;
  }, [workflows, activeWorkflowValue]);

  const appendMessage = (message: GenerationMessage) => {
    updateActiveGenerationSession((current) => ({
      ...current,
      messages: [...current.messages, message],
      updatedAt: Date.now(),
    }));
  };

  const capturePageContext = async () => {
    if (!usePageContext) return null;

    try {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const activeTab = tabs[0];
      if (!activeTab?.id) return null;

      const response = await sendMessageToContentScript(
        activeTab.id,
        "GET_PAGE_CONTEXT",
        {},
      );

      const snapshot = response?.data;
      if (!snapshot) return null;

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

      return snapshot;
    } catch (error) {
      appendMessage({
        id: generateId("msg", 10),
        role: "assistant",
        kind: "error",
        content: `Failed to capture page context: ${(error as Error).message}`,
        createdAt: Date.now(),
      });

      return null;
    }
  };

  const buildSessionForWorkflow = (workflowId: string): GenerationSession => {
    const now = Date.now();

    return {
      id: generateId("session", 10),
      status: "idle",
      workflowId,
      messages: [],
      pageContext: null,
      executionRefs: [],
      revision: 0,
      createdAt: now,
      updatedAt: now,
    };
  };

  const handleSend = async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || isSending) return;

    const currentSession = session ?? createInitialSession();
    if (!session) {
      setActiveGenerationSession(currentSession);
    }

    setPrompt("");
    setIsSending(true);
    const pageContext = await capturePageContext();

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
        content: "Thinking...",
        createdAt: Date.now(),
      };

      const sessionWithPendingMessages = {
        ...currentSession,
        status: "drafting" as const,
        messages: [...currentSession.messages, userMessage, thinkingMessage],
        pageContext: pageContext ?? currentSession.pageContext,
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
        setActiveGenerationSession({
          ...response.session,
          workflowId: response.session.workflowId,
        });
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
    if (session?.workflowId) {
      setActiveGenerationSessionForWorkflow(session.workflowId, null);
    }
    setPrompt("");
  };

  useEffect(() => {
    if (!session && activeGenerationWorkflowId) {
      const initialSession = buildSessionForWorkflow(
        activeGenerationWorkflowId,
      );
      setActiveGenerationSessionForWorkflow(
        activeGenerationWorkflowId,
        initialSession,
      );
    }
  }, [
    session,
    activeGenerationWorkflowId,
    setActiveGenerationSessionForWorkflow,
  ]);

  const openDesigner = () => {
    const workflowId = session?.workflowId;
    browser.tabs.create({
      url:
        browser.runtime.getURL("src/config/index.html") +
        (workflowId ? `#/designer/${workflowId}` : "#/designer"),
    });
  };

  const handleWorkflowSelect = (value: string | null) => {
    if (!value || value === "__new__") {
      const workflowId = newWorkflowId();
      const newSession = buildSessionForWorkflow(workflowId);
      setActiveGenerationSessionForWorkflow(workflowId, newSession);
      return;
    }

    const existingSession = getGenerationSessionForWorkflow(value);
    if (existingSession) {
      setActiveGenerationSessionForWorkflow(value, existingSession);
      return;
    }

    const now = Date.now();
    setActiveGenerationSessionForWorkflow(value, {
      id: generateId("session", 10),
      status: "idle",
      workflowId: value,
      messages: [],
      pageContext: null,
      executionRefs: [],
      revision: 0,
      createdAt: now,
      updatedAt: now,
    });
  };

  const messages = session?.messages ?? [];
  const displayedMessages = useMemo(() => {
    return messages.reduce<GenerationMessage[]>((acc, message) => {
      const last = acc[acc.length - 1];
      if (
        last &&
        message.role === "assistant" &&
        last.role === "assistant" &&
        last.kind === message.kind
      ) {
        acc[acc.length - 1] = {
          ...last,
          content: `${last.content}\n${message.content}`,
        };
        return acc;
      }
      acc.push(message);
      return acc;
    }, []);
  }, [messages]);

  useEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 10);
  }, [displayedMessages, prompt]);

  return (
    <Stack gap="sm" h="100%" style={{ minHeight: 0 }}>
      <Card p="sm">
        <Stack gap={4}>
          <Group justify="space-between" align="center">
            <Group>
              <Select
                value={activeWorkflowValue}
                onChange={handleWorkflowSelect}
                data={workflowOptions}
                size="xs"
                w={180}
              />
              {hasMessages && (
                <Tooltip label="Open in designer" withArrow>
                  <ActionIcon
                    variant="subtle"
                    onClick={openDesigner}
                    aria-label="Open in designer"
                  >
                    <IconExternalLink size={16} />
                  </ActionIcon>
                </Tooltip>
              )}
              <Badge variant="light" color="blue" size="sm">
                {draftSummary.nodeCount} nodes
              </Badge>
              <Badge variant="light" color="gray" size="sm">
                {draftSummary.urlPattern}
              </Badge>
            </Group>
            {hasMessages && (
              <Tooltip label="Reset session" withArrow>
                <Button
                  size="xs"
                  variant="subtle"
                  color="red"
                  leftSection={<IconRefresh size={14} />}
                  aria-label="Reset session"
                  onClick={handleReset}
                >
                  Reset
                </Button>
              </Tooltip>
            )}
          </Group>
        </Stack>
      </Card>
      <Box flex={1} ref={ref} style={{ minHeight: 0 }}>
        <ScrollArea h={height} type="hover">
          <Stack gap="xs">
            {messages.length !== 0 &&
              displayedMessages.map((message) => {
                const isUser = message.role === "user";
                const isError = message.kind === "error";
                const isResult = message.kind === "result";
                return (
                  <Card
                    key={message.id}
                    p={isUser ? "sm" : 0}
                    radius={isUser ? undefined : 0}
                    bg={isUser ? undefined : "transparent"}
                    shadow={isUser ? "sm" : "none"}
                    style={{
                      alignSelf: isUser ? "flex-end" : "flex-start",
                      maxWidth: "92%",
                      background: isUser
                        ? "var(--mantine-color-blue-light)"
                        : undefined,
                    }}
                  >
                    <Text
                      size="sm"
                      style={{ whiteSpace: "pre-wrap" }}
                      c={
                        isUser || isResult
                          ? "white"
                          : isError
                            ? "red"
                            : "dimmed"
                      }
                    >
                      {message.kind === "thinking" ? (
                        <ThinkingWave />
                      ) : (
                        message.content
                      )}
                    </Text>
                  </Card>
                );
              })}
            <div ref={bottomRef} />
          </Stack>
        </ScrollArea>
      </Box>
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          flexDirection: "column-reverse",
        }}
      >
        <Textarea
          ref={inputRef}
          value={prompt}
          mah={56}
          onChange={(event) => setPrompt(event.currentTarget.value)}
          rightSectionWidth={70}
          rightSection={
            <Group gap="xs" wrap="nowrap">
              <Tooltip label="Include page context in the prompt" withArrow>
                <ActionIcon
                  onClick={() => togglePageContext()}
                  color={usePageContext ? undefined : "dimmed"}
                  variant="transparent"
                  style={{ background: "transparent" }}
                  aria-label="Toggle page context"
                >
                  <IconFileSearch size={16} />
                </ActionIcon>
              </Tooltip>
              <ActionIcon
                onClick={handleSend}
                disabled={!prompt.trim()}
                color={!prompt.trim() ? "dimmed" : undefined}
                variant="transparent"
                style={{ background: "transparent" }}
              >
                <IconSend2 size={16} />
              </ActionIcon>
            </Group>
          }
          onKeyDown={handleKeyDown}
          placeholder="Describe the workflow you want to create..."
          autosize
          size="sm"
          minRows={1}
          maxRows={2}
        />
      </div>
    </Stack>
  );
}
