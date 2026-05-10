import { ActionIcon, Textarea } from "@mantine/core";
import { IconSend2, IconSquareFilled } from "@tabler/icons-react";
import { KeyboardEvent, useState } from "react";

type ChatInputProps = {
  pending: boolean;
  onSubmit: (input: string) => void;
  onAbort: () => void;
};
export default function ChatInput({
  pending,
  onSubmit,
  onAbort,
}: ChatInputProps) {
  const [input, setinput] = useState("");
  const handleKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void onSubmit(input.trim());
      setinput("");
    }
  };
  return (
    <Textarea
      value={input}
      onChange={(event) => setinput(event.currentTarget.value)}
      rightSection={
        <ActionIcon
          onClick={() => (pending ? onAbort() : onSubmit(input.trim()))}
          disabled={!pending && !input.trim()}
          color={pending ? "red" : !input.trim() ? "dimmed" : undefined}
          variant="transparent"
          style={{ background: "transparent" }}
          aria-label={pending ? "Stop generation" : "Send input"}
        >
          {pending ? <IconSquareFilled size={14} /> : <IconSend2 size={16} />}
        </ActionIcon>
      }
      onKeyDown={handleKeyDown}
      placeholder="Describe the workflow you want to create..."
      autosize
      size="sm"
      minRows={1}
      maxRows={5}
    />
  );
}
