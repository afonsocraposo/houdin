import { useState, useEffect, useRef } from "react";
import { Button } from "@mantine/core";

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

interface KeybindingSetterProps {
  value?: string;
  onChange?: (keyCombo: string) => void;
}

export function KeybindingSetter({ value, onChange }: KeybindingSetterProps) {
  const [isListening, setIsListening] = useState(false);
  const [keyCombo, setKeyCombo] = useState<string>(value || "");
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Sync with external value changes
  useEffect(() => {
    if (value !== undefined && value !== keyCombo) {
      setKeyCombo(value);
    }
  }, [value]);

  useEffect(() => {
    if (!isListening) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      event.preventDefault();

      if (event.key === "Escape") {
        setIsListening(false);
        return;
      }

      const combo = formatKeyCombo(event);
      if (combo) {
        setKeyCombo(combo);
        setIsListening(false);
        // Notify parent component of the change
        onChange?.(combo);
      }
    };

    window.addEventListener("keyup", handleKeyPress);
    return () => window.removeEventListener("keyup", handleKeyPress);
  }, [isListening, onChange]);

  return (
    <Button
      onClick={() => setIsListening(true)}
      ref={buttonRef}
      variant={isListening ? "outline" : "filled"}
    >
      {isListening ? "Press any key..." : keyCombo || "Set Keybinding"}
    </Button>
  );
}
