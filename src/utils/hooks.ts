import { useRef, useEffect } from "react";

export function useLastFocusedInput() {
  const lastFocused = useRef<HTMLInputElement | HTMLTextAreaElement | null>(
    null,
  );

  useEffect(() => {
    const handler = (event: FocusEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        lastFocused.current = event.target;
      }
    };

    document.addEventListener("focusin", handler);
    return () => document.removeEventListener("focusin", handler);
  }, []);

  return lastFocused;
}
