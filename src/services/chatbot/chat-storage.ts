import { useStore } from "@/store";
import { ChatSession } from "@/types/chat";
import { generateId } from "@/utils/helpers";
import { UIMessage } from "ai";
import { CredentialRegistry } from "../credentialRegistry";
import { OpenAIAuth } from "../credentials/openaiCredential";
import { SecretAuth } from "../credentials/secretCredential";
import { createBlankWorkflow } from "@/utils/workflow";
import { WorkflowDefinition } from "@/types/workflow";

export const getSession = (workflowId: string) =>
  useStore.getState().getSessionByWorkflowId(workflowId) || null;

export const saveSession = (
  session: Partial<ChatSession> & { workflowId: string },
) => useStore.getState().updateSession(session);

export const setStatus = (
  workflowId: string,
  status: ChatSession["status"],
  error?: string,
) => saveSession({ workflowId, status, error });

export const upsertAssistantMessage = async (
  workflowId: string,
  assistantMessage: UIMessage,
) => {
  const session = getSession(workflowId);
  if (!session) {
    throw new Error(`Session not found for workflowId: ${workflowId}`);
  }

  const messages = session.messages;
  const last = messages[messages.length - 1];

  const nextMessages =
    last?.role === "assistant"
      ? [...messages.slice(0, -1), assistantMessage]
      : [...messages, assistantMessage];
  console.log("Saving session with messages:", nextMessages);

  saveSession({ workflowId, messages: nextMessages });
};

export const appendUserMessage = (workflowId: string, content: string) => {
  const session = getSession(workflowId);
  if (!session) {
    throw new Error(`Session not found for workflowId: ${workflowId}`);
  }

  const userMessage: UIMessage = {
    id: generateId("message", 16),
    role: "user",
    parts: [{ type: "text", text: content }],
  };

  saveSession({
    workflowId,
    messages: [...session.messages, userMessage],
  });
};

export const getProvider = () =>
  useStore.getState().settings.workfowGeneration.provider;
export const getModel = () =>
  useStore.getState().settings.workfowGeneration.model;
export const getProviderUrl = () =>
  useStore.getState().settings.workfowGeneration.providerUrl;
export const getCredential = () => {
  const credentialId =
    useStore.getState().settings.workfowGeneration.credentialId;
  const credential = useStore
    .getState()
    .credentials.find((cred) => cred.id === credentialId);
  if (!credential) {
    throw new Error("Credential not found");
  }
  const auth = CredentialRegistry.getInstance().getAuth(
    credential.type,
    credential.config,
  );
  switch (credential?.type) {
    case "openai":
      return (auth as OpenAIAuth).apiKey;
    case "secret":
      return (auth as SecretAuth).value;
    default:
      return "";
  }
};

export const getWorkflow = (workflowId: string) => {
  const workflow = useStore.getState().readWorkflow(workflowId);
  if (!workflow) {
    return createBlankWorkflow(workflowId);
  }
  return workflow;
};

export const maybeGetWorkflow = (workflowId: string) =>
  useStore.getState().readWorkflow(workflowId);

export const saveWorkflow = (workflow: WorkflowDefinition) =>
  useStore.getState().updateWorkflow(workflow);
