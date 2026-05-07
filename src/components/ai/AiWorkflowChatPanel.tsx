import browser from "@/services/browser";
import {
  sendMessageToBackground,
  sendMessageToContentScript,
} from "@/lib/messages";
import { selectElementInTab } from "@/services/elementSelectionService";
import { useStore } from "@/store";
import {
  GenerationMessage,
  GenerationPromptRequest,
  GenerationSession,
} from "@/types/generation-session";
import { generateId, newWorkflowId } from "@/utils/helpers";
import {
  ActionIcon,
  Box,
  Card,
  Group,
  ScrollArea,
  Stack,
  Textarea,
  Tooltip,
} from "@mantine/core";
import {
  IconFileSearch,
  IconPointer,
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
import WorkingWave from "./WorkingWave";
import { PlausibleEvent, trackCustomEvent } from "@/services/plausible";

interface AiWorkflowChatPanelProps {
  workflowId?: string | null;
  popup?: boolean;
}

export default function AiWorkflowChatPanel({
  workflowId,
  popup = false,
}: AiWorkflowChatPanelProps) {
  const workflows = useStore((state) => state.workflows);
  const popupActiveWorkflowId = useStore(
    (state) => state.popupActiveWorkflowId,
  );
  const setPopupActiveWorkflowId = useStore(
    (state) => state.setPopupActiveWorkflowId,
  );
  const getGenerationSessionForWorkflow = useStore(
    (state) => state.getGenerationSessionForWorkflow,
  );
  const setSessionForWorkflow = useStore(
    (state) => state.setSessionForWorkflow,
  );
  const updateSessionForWorkflow = useStore(
    (state) => state.updateSessionForWorkflow,
  );
  const generationProvider = useStore(
    (state) => state.settings.workfowGeneration.provider,
  );
  const [prompt, setPrompt] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSelectingElement, setIsSelectingElement] = useState(false);
  const [usePageContext, togglePageContext] = useToggle([true, false]);
  const { ref, height } = useElementSize();
  const { ref: inputRef } = useElementSize();

  const isScopedToWorkflow =
    typeof workflowId === "string" && workflowId.length > 0;
  const currentWorkflowId = isScopedToWorkflow
    ? workflowId
    : popupActiveWorkflowId;

  const session = getGenerationSessionForWorkflow(currentWorkflowId);
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

  const activeWorkflow = useMemo(
    () =>
      currentWorkflowId
        ? workflows.find((workflow) => workflow.id === currentWorkflowId)
        : null,
    [workflows, currentWorkflowId],
  );

  const hasNamedActiveWorkflow = Boolean(
    activeWorkflow?.name && activeWorkflow.name !== "Untitled workflow",
  );

  const activeWorkflowValue = isScopedToWorkflow
    ? workflowId
    : hasNamedActiveWorkflow
      ? currentWorkflowId
      : "__new__";

  const workflowOptions = useMemo(() => {
    if (isScopedToWorkflow) {
      return [
        {
          value: workflowId,
          label:
            activeWorkflow?.name && activeWorkflow.name !== "Untitled workflow"
              ? activeWorkflow.name
              : "Current workflow",
        },
      ];
    }

    const w = [
      {
        value: "__new__",
        label: "Start new workflow",
      },
      ...workflows
        .filter(
          (workflow) =>
            typeof workflow.id === "string" &&
            typeof workflow.name === "string",
        )
        .map((workflow) => ({
          value: workflow.id,
          label: workflow.name,
        })),
    ];

    return w;
  }, [workflows, isScopedToWorkflow, workflowId, activeWorkflow]);

  const appendMessage = (message: GenerationMessage) => {
    const update = (current: GenerationSession) => ({
      ...current,
      messages: [...current.messages, message],
      updatedAt: Date.now(),
    });
    updateSessionForWorkflow(currentWorkflowId, update);
  };

  const ensureCurrentSession = () => {
    if (session) {
      return session;
    }

    const nextSession = buildSessionForWorkflow(currentWorkflowId);
    setSessionForWorkflow(currentWorkflowId, nextSession);
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

      updateSessionForWorkflow(currentWorkflowId, (current) => ({
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
      const response = await selectElementInTab(activeTabId, {
        source: "ai-chat",
        silent: true,
      });

      if (!response?.ok) {
        throw new Error(response?.error || "Failed to start element selection");
      }

      if (response.canceled || !response.data) {
        appendMessage({
          id: generateId("msg", 10),
          role: "assistant",
          kind: "tool",
          content: "Element selection canceled.",
          createdAt: Date.now(),
        });
        setIsSelectingElement(false);
        return;
      }

      const selectedElement = {
        selector: response.data.selector,
        tagName: response.data.element.tagName.toLowerCase(),
        text:
          response.data.element.textContent?.trim().slice(0, 50) || undefined,
        id: response.data.element.id || undefined,
        className: response.data.element.className || undefined,
      };

      const snapshot = await loadPageContext();
      const nextPageContext = snapshot ?? {
        url: "",
        title: "",
        selectedElement,
        visibleElements: [],
      };

      updateSessionForWorkflow(currentWorkflowId, (current) => ({
        ...current,
        pageContext: {
          ...nextPageContext,
          selectedElement,
        },
        updatedAt: Date.now(),
      }));

      appendMessage({
        id: generateId("msg", 10),
        role: "assistant",
        kind: "result",
        content: `Selected element: ${selectedElement.selector}`,
        createdAt: Date.now(),
      });
      setIsSelectingElement(false);
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

    const currentSession =
      session ?? buildSessionForWorkflow(currentWorkflowId);
    if (!session) {
      setSessionForWorkflow(currentWorkflowId, currentSession);
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

      const sessionWithPendingMessages = {
        ...currentSession,
        messages: [...currentSession.messages, userMessage],
        pageContext: pageContext ?? currentSession.pageContext,
        updatedAt: Date.now(),
      };

      setSessionForWorkflow(currentWorkflowId, sessionWithPendingMessages);
      // wait 10ms to ensure store is updated
      await new Promise((resolve) => setTimeout(resolve, 10));

      const request: GenerationPromptRequest = {
        workflowId: currentWorkflowId,
        prompt: trimmedPrompt,
      };

      void trackCustomEvent(
        PlausibleEvent.AIPromptSubmitted,
        popup ? "/popup" : "/designer",
        {
          provider: generationProvider,
        },
      );

      await sendMessageToBackground(MessageType.AI_GENERATION_SUBMIT, request);

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
    setSessionForWorkflow(currentWorkflowId, null);
    if (!isScopedToWorkflow) {
      const nextWorkflowId = newWorkflowId();
      setPopupActiveWorkflowId(nextWorkflowId);
    }
    setPrompt("");
  };

  const handleStop = async () => {
    if (!session || !isSending) {
      return;
    }

    await sendMessageToBackground(MessageType.AI_GENERATION_STOP, {
      workflowId: currentWorkflowId,
    });
    setIsSending(false);
  };

  useEffect(() => {
    if (!session) {
      const initialSession = buildSessionForWorkflow(currentWorkflowId);
      setSessionForWorkflow(currentWorkflowId, initialSession);
    }
  }, [currentWorkflowId, session, setSessionForWorkflow]);

  const openDesigner = () => {
    const workflowId = session?.workflowId;
    browser.tabs.create({
      url:
        browser.runtime.getURL("src/config/index.html") +
        (workflowId ? `#/designer/${workflowId}` : "#/designer"),
    });
  };

  const handleWorkflowSelect = (value: string | null) => {
    if (isScopedToWorkflow) {
      return;
    }

    if (!value || value === "__new__") {
      const workflowId = newWorkflowId();
      setPopupActiveWorkflowId(workflowId);
      if (!getGenerationSessionForWorkflow(workflowId)) {
        const newSession = buildSessionForWorkflow(workflowId);
        setSessionForWorkflow(workflowId, newSession);
      }
      return;
    }

    setPopupActiveWorkflowId(value);
    if (!getGenerationSessionForWorkflow(value)) {
      setSessionForWorkflow(value, buildSessionForWorkflow(value));
    }
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
    if (!isSelectingElement) {
      return;
    }

    const handleFocus = async () => {
      const snapshot = await loadPageContext();
      if (!snapshot?.selectedElement) {
        return;
      }

      updateSessionForWorkflow(currentWorkflowId, (current) => ({
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
  }, [currentWorkflowId, isSelectingElement, updateSessionForWorkflow]);

  return (
    <Stack gap="sm" h="100%" style={{ minHeight: 0 }}>
      <Box flex={1} ref={ref} style={{ minHeight: 0 }}>
        <ScrollArea h={height} type="scroll">
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
            {isSending &&
              displayedMessages[displayedMessages.length - 1]?.role ===
                "user" && <ThinkingWave />}
            {isSending &&
              displayedMessages[displayedMessages.length - 1]?.role !==
                "user" && <WorkingWave />}
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
