import definition from "./replace-text.definition";
import { BaseAction } from "@/types/actions";
import { getElement } from "@/utils/helpers";

interface ReplaceTextActionConfig {
  searchText: string;
  replaceWith: string;
  scope: "page" | "element";
  selectorType: "css" | "xpath" | "text";
  elementSelector: string;
  caseSensitive: boolean;
}

interface ReplaceTextActionOutput {
  replacedCount: number;
}

export class ReplaceTextAction extends BaseAction<
  ReplaceTextActionConfig,
  ReplaceTextActionOutput
> {
  constructor() {
    super(definition);
  }

  async execute(
    config: ReplaceTextActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data: ReplaceTextActionOutput) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    const { searchText, replaceWith, scope, selectorType, elementSelector, caseSensitive } = config;

    if (!searchText) {
      onError(new Error("Search text cannot be empty"));
      return;
    }

    let root: Node;
    if (scope === "element") {
      const element = getElement(elementSelector, selectorType);
      if (!element) {
        onError(
          new Error(
            `Element not found using ${selectorType} selector: ${elementSelector}`,
          ),
        );
        return;
      }
      root = element;
    } else {
      root = document.body;
    }

    let replacedCount = 0;
    const flags = caseSensitive ? "g" : "gi";
    const regex = new RegExp(escapeRegExp(searchText), flags);

    const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "OPTION"]);

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      const parent = node.parentElement;
      if (!parent || SKIP_TAGS.has(parent.tagName)) continue;
      if (regex.test(node.nodeValue || "")) {
        textNodes.push(node);
      }
      regex.lastIndex = 0;
    }

    for (const textNode of textNodes) {
      const original = textNode.nodeValue || "";
      const matches = original.match(regex);
      if (matches) {
        replacedCount += matches.length;
      }
      textNode.nodeValue = original.replace(regex, replaceWith);
    }

    onSuccess({ replacedCount });
  }
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
