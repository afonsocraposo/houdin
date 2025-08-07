import { useState, useEffect, useRef } from "react";
import { Button, Text } from "@mantine/core";

function formatKeyCombo(event: KeyboardEvent): string {
  const keys = [];

  if (event.ctrlKey) keys.push("Ctrl");
  if (event.altKey) keys.push("Alt");
  if (event.metaKey) keys.push("Meta");
  if (event.shiftKey) keys.push("Shift");

  const mainKey = event.key;

  if (!["Control", "Shift", "Alt", "Meta"].includes(mainKey)) {
    keys.push(mainKey.length === 1 ? mainKey.toUpperCase() : mainKey);
  }

  return keys.join(" + ");
}

export function KeybindingSetter() {
  const [isListening, setIsListening] = useState(false);
  const [keyCombo, setKeyCombo] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isListening) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();

      if (event.key === "Escape") {
        setIsListening(false);
        return;
      }

      const combo = formatKeyCombo(event);
      if (combo) {
        setKeyCombo(combo);
        setIsListening(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isListening]);

  return (
    <div>
      <Button
        onClick={() => setIsListening(true)}
        ref={buttonRef}
        variant={isListening ? "outline" : "filled"}
      >
        {isListening ? "Press any key..." : keyCombo || "Set Keybinding"}
      </Button>

      {keyCombo && !isListening && (
        <Text size="sm" mt="sm" c="dimmed">
          Keybinding: <strong>{keyCombo}</strong>
        </Text>
      )}
    </div>
  );
}
