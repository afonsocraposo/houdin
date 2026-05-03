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
  IconPointer,
  IconRefresh,
  IconSend2,
  IconSquareFilled,
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
import { MessageType } from "@/types/messages";
import MarkdownText from "../MarkdownText";

const PENDING_AI_SELECTED_ELEMENT_KEY = "pending-ai-selected-element";

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

interface AiWorkflowChatPanelProps {
  workflowId?: string | null;
  popup?: boolean;
}

export default function AiWorkflowChatPanel({
  workflowId,
  popup = false,
}: AiWorkflowChatPanelProps) {
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
  const [isSelectingElement, setIsSelectingElement] = useState(false);
  const [usePageContext, togglePageContext] = useToggle([true, false]);
  const { ref, height } = useElementSize();
  const { ref: inputRef } = useElementSize();

  const session = getActiveGenerationSession();
  const hasMessages = Boolean(session?.messages.length);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const normalizedActiveWorkflowValue =
    typeof activeGenerationWorkflowId === "string"
      ? activeGenerationWorkflowId
      : null;

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

  const activeWorkflow = useMemo(
    () =>
      normalizedActiveWorkflowValue
        ? workflows.find((workflow) => workflow.id === normalizedActiveWorkflowValue)
        : null,
    [workflows, normalizedActiveWorkflowValue],
  );

  const hasNamedActiveWorkflow = Boolean(
    activeWorkflow?.name && activeWorkflow.name !== "Untitled workflow",
  );

  const activeWorkflowValue = hasNamedActiveWorkflow
    ? normalizedActiveWorkflowValue
    : "__new__";

  const workflowOptions = useMemo(() => {
    const w = [
      {
        value: "__new__",
        label: "Start new workflow",
      },
      ...workflows
      .filter(
        (workflow) =>
          typeof workflow.id === "string" && typeof workflow.name === "string",
      )
      .map((workflow) => ({
        value: workflow.id,
        label: workflow.name,
      })),
    ];

    return w;
  }, [workflows]);

  const appendMessage = (message: GenerationMessage) => {
    updateActiveGenerationSession((current) => ({
      ...current,
      messages: [...current.messages, message],
      updatedAt: Date.now(),
    }));
  };

  const ensureCurrentSession = () => {
    if (session) {
      return session;
    }

    const nextSession = createInitialSession();
    setActiveGenerationSession(nextSession);
    return nextSession;
  };

  const getActiveTabId = async () => {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    return tabs[0]?.id ?? null;
  };

  const loadPageContext = async () => {
    const activeTabId = await getActiveTabId();
    if (!activeTabId) {
      return null;
    }

    const response = await sendMessageToContentScript(
      activeTabId,
      "GET_PAGE_CONTEXT",
      {},
    );
    return response?.data ?? null;
  };

  const capturePageContext = async () => {
    if (!usePageContext) return null;

    try {
      const snapshot = await loadPageContext();
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

  const handleSelectElement = async () => {
    try {
      const activeTabId = await getActiveTabId();
      if (!activeTabId) {
        return;
      }

      ensureCurrentSession();
      setIsSelectingElement(true);
      await sendMessageToContentScript(
        activeTabId,
        "START_ELEMENT_SELECTION",
        { source: "ai-chat" },
      );
      appendMessage({
        id: generateId("msg", 10),
        role: "assistant",
        kind: "tool",
        content:
          "Click an element on the page, then return here to use it as the selected target.",
        createdAt: Date.now(),
      });
      if (popup) {
        window.close();
      }
    } catch (error) {
      setIsSelectingElement(false);
      appendMessage({
        id: generateId("msg", 10),
        role: "assistant",
        kind: "error",
        content: `Failed to start element selection: ${(error as Error).message}`,
        createdAt: Date.now(),
      });
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

  const handleStop = async () => {
    if (!session || !isSending) {
      return;
    }

    await sendMessageToBackground(MessageType.AI_GENERATION_STOP, {
      sessionId: session.id,
    });
    setIsSending(false);
  };

  useEffect(() => {
    if (workflowId) {
      const existingSession = getGenerationSessionForWorkflow(workflowId);

      if (existingSession) {
        setActiveGenerationSessionForWorkflow(workflowId, existingSession);
        return;
      }

      if (!session || session.workflowId !== workflowId) {
        const initialSession = buildSessionForWorkflow(workflowId);
        setActiveGenerationSessionForWorkflow(workflowId, initialSession);
      }

      return;
    }

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
    workflowId,
    session,
    activeGenerationWorkflowId,
    getGenerationSessionForWorkflow,
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
      const canMergeAssistantMessages =
        message.role === "assistant" &&
        last?.role === "assistant" &&
        last.kind === message.kind &&
        message.kind !== "tool";

      if (last && canMergeAssistantMessages) {
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

  useEffect(() => {
    if (!popup) {
      return;
    }

    const consumePendingSelection = async () => {
      const result = await browser.storage.local.get([PENDING_AI_SELECTED_ELEMENT_KEY]);
      const pendingSelection = result[PENDING_AI_SELECTED_ELEMENT_KEY];
      if (!pendingSelection) {
        return;
      }

      await browser.storage.local.remove([PENDING_AI_SELECTED_ELEMENT_KEY]);

      const snapshot = await loadPageContext();
      const nextPageContext = snapshot ?? {
        url: "",
        title: "",
        selectedElement: pendingSelection,
        visibleElements: [],
      };

      ensureCurrentSession();
      updateActiveGenerationSession((current) => ({
        ...current,
        pageContext: {
          ...nextPageContext,
          selectedElement: nextPageContext.selectedElement ?? pendingSelection,
        },
        updatedAt: Date.now(),
      }));
      appendMessage({
        id: generateId("msg", 10),
        role: "assistant",
        kind: "result",
        content: `Selected element: ${(nextPageContext.selectedElement ?? pendingSelection).selector}`,
        createdAt: Date.now(),
      });
      setIsSelectingElement(false);
    };

    consumePendingSelection().catch((error) => {
      console.error("Failed to consume pending selected element:", error);
    });
  }, [popup]);

  useEffect(() => {
    if (!isSelectingElement) {
      return;
    }

    const handleFocus = async () => {
      const snapshot = await loadPageContext();
      if (!snapshot?.selectedElement) {
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
        content: `Selected element: ${snapshot.selectedElement.selector}`,
        createdAt: Date.now(),
      });
      setIsSelectingElement(false);
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [isSelectingElement, updateActiveGenerationSession]);

  return (
    <Stack gap="sm" h="100%" style={{ minHeight: 0 }}>
      <Card p="sm">
        <Stack gap="xs">
          <Group justify="space-between" align="center" wrap="nowrap">
            <Group gap="xs" wrap="nowrap" flex={1} miw={0}>
                <Select
                  value={activeWorkflowValue}
                  onChange={handleWorkflowSelect}
                  data={workflowOptions}
                size="xs"
                aria-label="Active workflow draft"
                style={{ flex: 1, minWidth: 0 }}
              />
              {hasMessages && (
                <Tooltip label="Open in designer" withArrow>
                  <ActionIcon
                    variant="subtle"
                    onClick={openDesigner}
                    aria-label="Open in designer"
                    size="input-sm"
                  >
                    <IconExternalLink size={16} />
                  </ActionIcon>
                </Tooltip>
              )}
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
                  style={{ flexShrink: 0 }}
                >
                  Reset
                </Button>
              </Tooltip>
            )}
          </Group>
          <Group gap="xs" wrap="wrap">
            <Badge variant="light" color="blue" size="sm" radius="sm">
              {draftSummary.nodeCount} node
              {draftSummary.nodeCount === 1 ? "" : "s"}
            </Badge>
            <Badge
              variant="light"
              color="grape"
              size="sm"
              radius="sm"
              maw="100%"
            >
              <Text size="xs" truncate="end">
                {draftSummary.urlPattern}
              </Text>
            </Badge>
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
                    {message.kind === "thinking" ? (
                      <ThinkingWave />
                    ) : (
                      <MarkdownText
                        compact
                        c={
                          isUser || isResult
                            ? "white"
                            : isError
                              ? "red"
                              : "dimmed"
                        }
                      >
                        {message.content}
                      </MarkdownText>
                    )}
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
          rightSectionWidth={popup ? 100 : undefined}
          rightSection={
            <Group gap="4" wrap="nowrap">
              {popup && (
                <>
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
                  <Tooltip label="Select page element" withArrow>
                    <ActionIcon
                      onClick={handleSelectElement}
                      color={isSelectingElement ? "blue" : undefined}
                      variant="transparent"
                      style={{ background: "transparent" }}
                      aria-label="Select page element"
                    >
                      <IconPointer size={16} />
                    </ActionIcon>
                  </Tooltip>
                </>
              )}
              <ActionIcon
                onClick={isSending ? handleStop : handleSend}
                disabled={!isSending && !prompt.trim()}
                color={
                  !isSending && !prompt.trim()
                    ? "dimmed"
                    : isSending
                      ? "red"
                      : undefined
                }
                variant="transparent"
                style={{ background: "transparent" }}
                aria-label={isSending ? "Stop generation" : "Send prompt"}
              >
                {isSending ? (
                  <IconSquareFilled size={14} />
                ) : (
                  <IconSend2 size={16} />
                )}
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
