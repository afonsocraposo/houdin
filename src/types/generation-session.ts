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
