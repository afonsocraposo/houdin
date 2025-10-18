// Element selector content script
import { CustomMessage } from "@/lib/messages";

import browser from "@/services/browser";

interface ElementSelectedDetail {
  selector: string;
  element: {
    tagName: string;
    className: string;
    id: string;
    textContent: string | null;
  };
}

let isSelecting = false;
let highlightedElement: HTMLElement | null = null;
let overlay: HTMLDivElement | null = null;

// Create overlay element for highlighting
function createOverlay(): HTMLDivElement {
  const div = document.createElement("div");
  div.id = "houdin-element-selector-overlay";
  div.style.cssText = `
      position: absolute;
      background-color: rgba(74, 144, 226, 0.3);
      border: 2px solid #4A90E2;
      pointer-events: none;
      z-index: 999999;
      box-sizing: border-box;
    `;
  document.body.appendChild(div);
  return div;
}

// Position overlay on target element
function positionOverlay(element: HTMLElement) {
  if (!overlay) return;

  const rect = element.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

  overlay.style.top = `${rect.top + scrollTop}px`;
  overlay.style.left = `${rect.left + scrollLeft}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
}

// Generate CSS selector
function generateCSSSelector(element: Element): string {
  if (element.id) {
    return `#${element.id}`;
  }

  const path: string[] = [];

  while (element && element.nodeType === Node.ELEMENT_NODE) {
    let selector = element.nodeName.toLowerCase();

    if (element.className) {
      const classes = element.className.trim().split(/\s+/).filter(Boolean);
      if (classes.length > 0) {
        selector += "." + classes.join(".");
      }
    }

    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (child) => child.nodeName === element.nodeName,
      );

      if (siblings.length > 1) {
        const index = siblings.indexOf(element) + 1;
        selector += `:nth-child(${index})`;
      }
    }

    path.unshift(selector);
    element = parent as Element;
  }

  return path.join(" > ");
}

// Mouse move handler
function handleMouseMove(event: MouseEvent) {
  if (!isSelecting) return;

  const target = event.target as HTMLElement;
  if (target === overlay || target.id === "houdin-element-selector-overlay") {
    return;
  }

  highlightedElement = target;
  positionOverlay(target);
}

// Click handler
function handleClick(event: MouseEvent) {
  if (!isSelecting || !highlightedElement) return;

  event.preventDefault();
  event.stopPropagation();

  const selector = generateCSSSelector(highlightedElement);

  showSelectedElement(selector, highlightedElement);

  cleanup();
}

function showSelectedElement(selector: string, element: HTMLElement) {
  const event = new CustomEvent<{
    type: string;
    data: ElementSelectedDetail;
  }>("modalDispatch", {
    detail: {
      type: "elementSelected",
      data: {
        selector: selector,
        element: {
          tagName: element.tagName,
          className: element.className,
          id: element.id,
          textContent: element.textContent,
        },
      },
    },
  });
  window.dispatchEvent(event);
}

// Escape key handler
function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    cleanup();
  }
}

// Cleanup function
function cleanup() {
  isSelecting = false;

  if (overlay) {
    overlay.remove();
    overlay = null;
  }

  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("click", handleClick, true);
  document.removeEventListener("keydown", handleKeydown);

  document.body.style.cursor = "";
}

// Initialize selector
function initSelector() {
  if (isSelecting) {
    cleanup();
    return;
  }

  isSelecting = true;
  overlay = createOverlay();

  document.body.style.cursor = "crosshair";

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("click", handleClick, true);
  document.addEventListener("keydown", handleKeydown);

  // Show instructions
  const instructions = document.createElement("div");
  instructions.id = "houdin-selector-instructions";
  instructions.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #333;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 1000000;
        font-family: sans-serif;
        font-size: 14px;
      ">
        Click on an element to select it. Press ESC to cancel.
      </div>
    `;
  document.body.appendChild(instructions);

  // Remove instructions after 3 seconds
  setTimeout(() => {
    const instructionsEl = document.getElementById(
      "houdin-selector-instructions",
    );
    if (instructionsEl) {
      instructionsEl.remove();
    }
  }, 3000);
}

// Listen for messages from the extension
browser.runtime.onMessage.addListener(
  (message: CustomMessage, _, sendResponse: (a: any) => void) => {
    if (message.type === "START_ELEMENT_SELECTION") {
      initSelector();
      sendResponse({ status: "selector_started" });
    }
  },
);
