import { useStore } from "@/store";
import { Select } from "@mantine/core";
import { useMemo } from "react";

type ChatSessionSelectProps = {
  value?: string | null;
  onSelect: (workflowId: string | null) => void;
};
export default function ChatSessionSelect({
  value,
  onSelect,
}: ChatSessionSelectProps) {
  const workflows = useStore((state) => state.workflows);
  const hasSelectedWorkflow = useMemo(
    () => workflows.some((workflow) => workflow.id === value),
    [workflows, value],
  );
  const selectOptions = useMemo(
    () =>
      [...workflows]
        .sort((a, b) => (a.modifiedAt < b.modifiedAt ? 1 : -1))
        .map((wf) => ({
          label: wf.name,
          value: wf.id,
        })),
    [workflows],
  );
  const selectValue = hasSelectedWorkflow ? value : null;

  return (
    <Select
      placeholder="New session"
      data={selectOptions}
      value={selectValue}
      onChange={onSelect}
    />
  );
}
