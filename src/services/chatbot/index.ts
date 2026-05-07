import { CustomMessage } from "@/lib/messages";
import browser from "../browser";
import { MessageType } from "@/types/messages";
import {
  getCredential,
  getModel,
  getProvider,
  getProviderUrl,
  getSession,
  getWorkflow,
  saveWorkflow,
  saveSession,
  setStatus,
  upsertAssistantMessage,
} from "./chat-storage";
import {
  convertToModelMessages,
  readUIMessageStream,
  stepCountIs,
  streamText,
  UIMessage,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { API_BASE_URL } from "@/api/client";
import { generateId } from "@/utils/helpers";
import buildSystemPrompt from "./system-prompt";
import { createTools } from "./tools";
import { WorkflowDefinition } from "@/types/workflow";

export class ChatbotService {
  private static instance: ChatbotService;
  private activeRuns = {} as Record<string, AbortController>;

  private constructor() {
    // Initialize any necessary properties here
  }

  public static getInstance(): ChatbotService {
    if (!ChatbotService.instance) {
      ChatbotService.instance = new ChatbotService();
    }
    return ChatbotService.instance;
  }

  init(): void {
    browser.runtime.onMessage.addListener(
      (message: CustomMessage, sender: any) => {
        const url = sender?.url || sender?.tab?.url || "";
        const isPopup =
          url.startsWith("chrome-extension://") ||
          url.startsWith("moz-extension://");
        switch (message.type) {
          case MessageType.RUN_CHAT: {
            // Handle incoming chat messages here
            const { workflowId, input } = message.data;
            return this.runChat(workflowId, input, isPopup);
          }
          case MessageType.STOP_CHAT: {
            // Handle chat stop messages here
            const { workflowId } = message.data;
            return this.stopChat(workflowId);
          }
        }
      },
    );
  }

  private async runChat(workflowId: string, input: string, isPopup: boolean) {
    if (this.activeRuns[workflowId]) return;
    this.activeRuns[workflowId] = new AbortController();

    try {
      console.log(
        `Starting chat for workflowId: ${workflowId} with input: ${input}`,
      );
      const session = getSession(workflowId);
      if (!session) throw new Error();

      const userMessage: UIMessage = {
        id: generateId("message", 16),
        role: "user",
        parts: [{ type: "text", text: input }],
      };
      session.messages = [...session.messages, userMessage];
      saveSession(session);

      // Only send the last 20 messages to the model for context to avoid token limits
      const modelMessages = await convertToModelMessages(
        session.messages.slice(-20),
      );
      let workflowState: WorkflowDefinition = getWorkflow(workflowId);

      const getWorkflowState = () => workflowState;
      const saveWorkflowState = (workflow: WorkflowDefinition) => {
        workflowState = workflow;
        saveWorkflow(workflow);
      };

      const result = streamText({
        system: buildSystemPrompt({ workflow: workflowState }),
        model: this.getModel(),
        tools: createTools({
          workflowId,
          getWorkflowState,
          saveWorkflowState,
          popup: isPopup,
        }),
        messages: modelMessages,
        temperature: 0.2,
        maxOutputTokens: 2000,
        abortSignal: this.activeRuns[workflowId].signal,
        stopWhen: stepCountIs(10),
      });
      setStatus(workflowId, "submitted");

      let streaming = false;
      const uiStream = result.toUIMessageStream();
      for await (const uiMessage of readUIMessageStream({ stream: uiStream })) {
        if (!streaming) {
          streaming = true;
          setStatus(workflowId, "streaming");
        }
        await upsertAssistantMessage(workflowId, uiMessage);
      }
      setStatus(workflowId, "ready");
    } catch (error) {
      console.log("Error in runChat:", error);
      setStatus(
        workflowId,
        "error",
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      delete this.activeRuns[workflowId];
    }
  }

  private stopChat(workflowId: string) {
    const controller = this.activeRuns[workflowId];
    if (controller) {
      controller.abort();
      delete this.activeRuns[workflowId];
      setStatus(workflowId, "ready");
    }
  }

  private getModel() {
    const provider = getProvider();
    const model = getModel();
    const requireModel = () => {
      if (!model?.trim()) {
        throw new Error(`Model is required for provider: ${provider}`);
      }
      return model;
    };
    switch (provider) {
      case "houdin":
        return createOpenAI({
          baseURL: `${API_BASE_URL}/ai`,
          apiKey: "houdin-client",
        }).chat("");
      case "openai":
        return createOpenAI({ apiKey: getCredential() }).chat(requireModel());
      case "openrouter":
        return createOpenAI({
          apiKey: getCredential(),
          baseURL: "https://openrouter.ai/api/v1",
        }).chat(requireModel());
      case "custom":
        return createOpenAI({
          apiKey: getCredential(),
          baseURL: getProviderUrl(),
        }).chat(getModel() || "");
      default:
        throw new Error(`Unsupported generation provider: ${provider}`);
    }
  }
}
