import { WorkflowExecutionStatus } from "@/types/workflow";

export type GenerationSessionStatus =
  | "idle"
  | "drafting"
  | "testing"
  | "paused"
  | "completed"
  | "failed";

export type GenerationMessageRole = "system" | "user" | "assistant" | "tool";

export type GenerationMessageKind =
  | "chat"
  | "plan"
  | "patch"
  | "test"
  | "result"
  | "error"
  | "thinking"
  | "tool";

export interface GenerationMessage {
  id: string;
  role: GenerationMessageRole;
  content: string;
  createdAt: number;
  kind?: GenerationMessageKind;
}

export interface SelectedElementContext {
  selector: string;
  tagName?: string;
  text?: string;
  ariaLabel?: string;
  id?: string;
  className?: string;
}

export interface VisibleElementContext {
  selector: string;
  tagName: string;
  text?: string;
  ariaLabel?: string;
  role?: string;
}

export interface PageContextSnapshot {
  url: string;
  title: string;
  selectedText?: string;
  selectedElement?: SelectedElementContext;
  visibleElements: VisibleElementContext[];
}

export interface GenerationExecutionRef {
  executionId: string;
  workflowId: string;
  status: WorkflowExecutionStatus;
  startedAt: number;
  completedAt?: number;
  summary?: string;
}

export interface GenerationSession {
  id: string;
  status: GenerationSessionStatus;
  workflowId: string | null;
  messages: GenerationMessage[];
  pageContext: PageContextSnapshot | null;
  executionRefs: GenerationExecutionRef[];
  revision: number;
  createdAt: number;
  updatedAt: number;
}

export interface GenerationPromptRequest {
  prompt: string;
  session: GenerationSession;
}

export interface GenerationPromptResponse {
  session: GenerationSession;
}

export interface StopGenerationRequest {
  sessionId: string;
}

export interface SelectedElementMessage {
  source: "inspector" | "ai-chat";
  selectedElement: SelectedElementContext;
}
