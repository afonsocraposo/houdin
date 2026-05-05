export type ElementSelectionSource = "inspector" | "ai-chat" | "workflow-action";

export interface ElementSelectionPayload {
  source?: ElementSelectionSource;
  silent?: boolean;
}

export interface ElementSelectedDetail {
  selector: string;
  source?: ElementSelectionSource;
  silent?: boolean;
  element: {
    tagName: string;
    className: string;
    id: string;
    textContent: string | null;
  };
}

export interface ElementSelectionResponse {
  ok: boolean;
  canceled?: boolean;
  error?: string;
  data?: ElementSelectedDetail;
}
