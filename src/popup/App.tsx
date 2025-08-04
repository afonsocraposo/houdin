import { Container, Title, Text, Button, Stack } from "@mantine/core";
import { IconBrandChrome, IconPointer } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { ElementInfoModal } from "../components/ElementInfoModal";

function App() {
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  // Cross-browser API compatibility
  const browserAPI = (typeof browser !== "undefined" ? browser : chrome) as any;

  useEffect(() => {
    // Load last selected element from storage
    browserAPI.storage.local.get(["lastSelectedElement"], (result: any) => {
      if (result.lastSelectedElement) {
        setSelectedElement(result.lastSelectedElement);
      }
    });

    // Listen for element selection messages
    const messageListener = (message: any) => {
      if (message.type === "ELEMENT_SELECTED") {
        const elementInfo = {
          selector: message.selector,
          element: message.element,
          timestamp: Date.now(),
        };
        setSelectedElement(elementInfo);
        setShowModal(true);
      }
    };

    browserAPI.runtime.onMessage.addListener(messageListener);

    return () => {
      if (browserAPI.runtime.onMessage.removeListener) {
        browserAPI.runtime.onMessage.removeListener(messageListener);
      }
    };
  }, []);

  const handleClick = () => {
    // open a new tab with a specific URL
    browserAPI.tabs.create({ url: "https://changeme.config" });
  };

  const handleSelectElement = async () => {
    try {
      // Get the active tab
      const tabs = (await new Promise((resolve) => {
        browserAPI.tabs.query({ active: true, currentWindow: true }, resolve);
      })) as any[];

      const tab = tabs[0];

      if (tab && tab.id) {
        console.log("Injecting element selector script into tab:", tab.id);

        // Inject the script code directly for better compatibility
        browserAPI.tabs.executeScript(
          tab.id,
          {
            code: `
            // Element selector content script
            (function() {
              // Check if already running
              if (window.changemeElementSelector) {
                window.changemeElementSelector.cleanup();
              }

              let isSelecting = false;
              let highlightedElement = null;
              let overlay = null;

              // Create overlay element for highlighting
              function createOverlay() {
                const div = document.createElement('div');
                div.id = 'changeme-element-selector-overlay';
                div.style.cssText = 'position: absolute; background-color: rgba(74, 144, 226, 0.3); border: 2px solid #4A90E2; pointer-events: none; z-index: 999999; box-sizing: border-box;';
                document.body.appendChild(div);
                return div;
              }

              // Position overlay on target element
              function positionOverlay(element) {
                if (!overlay) return;

                const rect = element.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

                overlay.style.top = (rect.top + scrollTop) + 'px';
                overlay.style.left = (rect.left + scrollLeft) + 'px';
                overlay.style.width = rect.width + 'px';
                overlay.style.height = rect.height + 'px';
              }

              // Generate CSS selector
              function generateCSSSelector(element) {
                if (element.id) {
                  return '#' + element.id;
                }

                const path = [];

                while (element && element.nodeType === Node.ELEMENT_NODE) {
                  let selector = element.nodeName.toLowerCase();

                  if (element.className) {
                    const classes = element.className.trim().split(/\\s+/).filter(Boolean);
                    if (classes.length > 0) {
                      selector += '.' + classes.join('.');
                    }
                  }

                  const parent = element.parentElement;
                  if (parent) {
                    const siblings = Array.from(parent.children).filter(
                      child => child.nodeName === element.nodeName
                    );

                    if (siblings.length > 1) {
                      const index = siblings.indexOf(element) + 1;
                      selector += ':nth-child(' + index + ')';
                    }
                  }

                  path.unshift(selector);
                  element = parent;
                }

                return path.join(' > ');
              }

              // Mouse move handler
              function handleMouseMove(event) {
                if (!isSelecting) return;

                const target = event.target;
                if (target === overlay || target.id === 'changeme-element-selector-overlay') {
                  return;
                }

                highlightedElement = target;
                positionOverlay(target);
              }

              // Click handler
              function handleClick(event) {
                if (!isSelecting || !highlightedElement) return;

                event.preventDefault();
                event.stopPropagation();

                const selector = generateCSSSelector(highlightedElement);
                const elementInfo = {
                  selector: selector,
                  element: {
                    tagName: highlightedElement.tagName,
                    className: highlightedElement.className,
                    id: highlightedElement.id,
                    textContent: (highlightedElement.textContent || '').slice(0, 500)
                  }
                };

                // Send selector back to extension
                const browserAPI = (typeof browser !== 'undefined' ? browser : chrome);
                browserAPI.runtime.sendMessage({
                  type: 'ELEMENT_SELECTED',
                  ...elementInfo
                });

                // Show modal with element info
                showElementModal(elementInfo);

                cleanup();
              }

              // Escape key handler
              function handleKeydown(event) {
                if (event.key === 'Escape') {
                  cleanup();
                }
              }

              // Show element info modal
              function showElementModal(elementInfo) {
                // Remove any existing modal
                const existingModal = document.getElementById('changeme-element-modal');
                if (existingModal) {
                  existingModal.remove();
                }

                // Create modal backdrop
                const backdrop = document.createElement('div');
                backdrop.id = 'changeme-element-modal';
                backdrop.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.5); z-index: 999999; display: flex; align-items: center; justify-content: center; font-family: system-ui, -apple-system, sans-serif;';

                // Create modal content
                const modal = document.createElement('div');
                modal.style.cssText = 'background-color: white; border-radius: 8px; padding: 24px; max-width: 600px; width: 90%; max-height: 80vh; overflow: auto; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);';

                // Helper function to copy text
                function copyToClipboard(text, button) {
                  navigator.clipboard.writeText(text).then(() => {
                    const originalText = button.textContent;
                    button.textContent = 'Copied!';
                    button.style.backgroundColor = '#28a745';
                    setTimeout(() => {
                      button.textContent = originalText;
                      button.style.backgroundColor = '#007bff';
                    }, 2000);
                  }).catch(err => {
                    console.error('Failed to copy:', err);
                  });
                }

                // Helper function to create info row
                function createInfoRow(label, value, container) {
                  if (!value) return;

                  const row = document.createElement('div');
                  row.style.marginBottom = '12px';

                  const labelDiv = document.createElement('div');
                  labelDiv.textContent = label;
                  labelDiv.style.cssText = 'font-size: 14px; font-weight: 600; margin-bottom: 4px; color: #333;';

                  const contentDiv = document.createElement('div');
                  contentDiv.style.cssText = 'display: flex; align-items: center; gap: 8px; background-color: #f8f9fa; padding: 8px; border-radius: 4px; border: 1px solid #dee2e6;';

                  const code = document.createElement('code');
                  code.textContent = value || '(empty)';
                  code.style.cssText = 'flex: 1; font-size: 12px; font-family: monospace; word-break: break-all; background-color: transparent; padding: 0; border: none;';

                  const copyBtn = document.createElement('button');
                  copyBtn.textContent = 'Copy';
                  copyBtn.style.cssText = 'padding: 4px 8px; font-size: 11px; border: 1px solid #007bff; background-color: #007bff; color: white; border-radius: 3px; cursor: pointer; min-width: 60px;';
                  copyBtn.onclick = () => copyToClipboard(value, copyBtn);

                  contentDiv.appendChild(code);
                  contentDiv.appendChild(copyBtn);
                  row.appendChild(labelDiv);
                  row.appendChild(contentDiv);
                  container.appendChild(row);
                }

                modal.innerHTML = '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid #dee2e6;"><h2 style="margin: 0; font-size: 18px; color: #212529;">Selected Element Information</h2><button id="close-modal" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6c757d; padding: 0; width: 30px; height: 30px;">×</button></div><div id="modal-content"></div>';

                const content = modal.querySelector('#modal-content');

                // Add element information
                createInfoRow('CSS Selector', elementInfo.selector, content);
                createInfoRow('Tag Name', elementInfo.element.tagName.toLowerCase(), content);
                if (elementInfo.element.id) {
                  createInfoRow('ID', elementInfo.element.id, content);
                }
                if (elementInfo.element.className) {
                  createInfoRow('Class Names', elementInfo.element.className, content);
                }
                if (elementInfo.element.textContent) {
                  createInfoRow('Text Content', elementInfo.element.textContent, content);
                }

                // Close button functionality
                modal.querySelector('#close-modal').onclick = () => backdrop.remove();
                backdrop.onclick = (e) => {
                  if (e.target === backdrop) backdrop.remove();
                };

                // Escape key to close
                const escapeHandler = (e) => {
                  if (e.key === 'Escape') {
                    backdrop.remove();
                    document.removeEventListener('keydown', escapeHandler);
                  }
                };
                document.addEventListener('keydown', escapeHandler);

                backdrop.appendChild(modal);
                document.body.appendChild(backdrop);
              }
              function cleanup() {
                isSelecting = false;

                if (overlay) {
                  overlay.remove();
                  overlay = null;
                }

                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('click', handleClick, true);
                document.removeEventListener('keydown', handleKeydown);

                document.body.style.cursor = '';

                const instructions = document.getElementById('changeme-selector-instructions');
                if (instructions) {
                  instructions.remove();
                }
              }

              // Initialize selector
              function initSelector() {
                if (isSelecting) {
                  cleanup();
                  return;
                }

                isSelecting = true;
                overlay = createOverlay();

                document.body.style.cursor = 'crosshair';

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('click', handleClick, true);
                document.addEventListener('keydown', handleKeydown);

                // Show instructions
                const instructions = document.createElement('div');
                instructions.id = 'changeme-selector-instructions';
                instructions.innerHTML = '<div style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #333; color: white; padding: 10px 20px; border-radius: 5px; z-index: 1000000; font-family: sans-serif; font-size: 14px;">Click on an element to select it. Press ESC to cancel.</div>';
                document.body.appendChild(instructions);

                // Remove instructions after 3 seconds
                setTimeout(() => {
                  const instructionsEl = document.getElementById('changeme-selector-instructions');
                  if (instructionsEl) {
                    instructionsEl.remove();
                  }
                }, 3000);
              }

              // Expose cleanup globally for reuse
              window.changemeElementSelector = { cleanup };

              // Start the selector
              initSelector();
            })();
          `,
          },
          () => {
            if (browserAPI.runtime.lastError) {
              console.error(
                "Script injection failed:",
                browserAPI.runtime.lastError,
              );
            } else {
              console.log("Element selector script injected successfully");
            }
          },
        );

        // Close the popup after a short delay to allow script injection
        setTimeout(() => {
          window.close();
        }, 100);
      }
    } catch (error) {
      console.error("Error in handleSelectElement:", error);
    }
  };

  return (
    <>
      <Container size="xs" p="md" style={{ width: "300px", height: "400px" }}>
        <Stack gap="md">
          <div style={{ textAlign: "center" }}>
            <IconBrandChrome size={48} />
            <Title order={2} mt="sm">
              changeme
            </Title>
            <Text size="sm" c="dimmed">
              Browser automation made easy
            </Text>
          </div>

          <Button variant="filled" onClick={handleClick} fullWidth>
            Open Configuration
          </Button>

          <Button
            variant="outline"
            onClick={handleSelectElement}
            fullWidth
            leftSection={<IconPointer size={16} />}
          >
            Select Element
          </Button>
        </Stack>
      </Container>

      <ElementInfoModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        elementInfo={selectedElement}
      />
    </>
  );
}

export default App;
