import { UIMessage } from "ai";

export type ChatSession = {
  id: string;
  workflowId: string;
  status: "ready" | "submitted" | "streaming" | "error";
  error?: string;
  messages: UIMessage[];
  createdAt: number;
  updatedAt: number;
};
