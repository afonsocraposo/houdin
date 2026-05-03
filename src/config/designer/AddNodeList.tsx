import { nodeCatalog } from "@/services/nodeCatalog";
import { NodeType } from "@/types/workflow";
import {
  ActionIcon,
  Button,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Transition,
  useComputedColorScheme,
} from "@mantine/core";
import { useDebouncedCallback } from "@mantine/hooks";
import {
  IconArrowBarToRight,
  IconMinus,
  IconPlus,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";

interface NodeMetadata {
  type: string;
  label: string;
  icon: string | React.ComponentType<any>;
  description: string;
}

interface NodeCategories {
  trigger: NodeMetadata[];
  action: NodeMetadata[];
}

interface AddNodeListProps {
  createNode: (type: string, category: NodeType) => void;
  opened?: boolean;
  onChange?: (opened: boolean) => void;
  prioritizeActions?: boolean;
}
export default function AddNodeList({
  createNode,
  opened = false,
  onChange,
  prioritizeActions = false,
}: AddNodeListProps) {
  const [showNodePalette, setShowNodePalette] = useState(opened);
  const [search, setSearch] = useState("");

  const fullCategories = useMemo(() => {
    return {
      trigger: Object.values(nodeCatalog.triggers).map((entry) => ({
        type: entry.metadata.type,
        label: entry.metadata.label,
        icon: entry.metadata.icon,
        description: entry.metadata.description,
      })),
      action: Object.values(nodeCatalog.actions).map((entry) => ({
        type: entry.metadata.type,
        label: entry.metadata.label,
        icon: entry.metadata.icon,
        description: entry.metadata.description,
      })),
    };
  }, []);

  const [nodeCategories, setNodeCategories] =
    useState<NodeCategories>(fullCategories);

  useEffect(() => {
    setShowNodePalette(opened);
    setSearch("");
  }, [opened]);

  useEffect(() => {
    if (onChange) {
      onChange(showNodePalette);
    }
  }, [showNodePalette]);

  useEffect(() => { }, []);

  const colorScheme = useComputedColorScheme();

  const handleSearch = useDebouncedCallback((value: string) => {
    const filteredCategories = {
      trigger: fullCategories.trigger.filter(
        (item) =>
          item.label.toLowerCase().includes(value.toLowerCase()) ||
          item.description.toLowerCase().includes(value.toLowerCase()) ||
          item.type.toLowerCase().includes(value.toLowerCase()),
      ),
      action: fullCategories.action.filter(
        (item) =>
          item.label.toLowerCase().includes(value.toLowerCase()) ||
          item.description.toLowerCase().includes(value.toLowerCase()) ||
          item.type.toLowerCase().includes(value.toLowerCase()),
      ),
    };
    setNodeCategories(filteredCategories);
  }, 300);

  useEffect(() => {
    const value = search.trim();
    if (value === "") {
      setNodeCategories(fullCategories);
      return;
    }
    handleSearch(value);
  }, [search]);

  const orderedCategories = useMemo(() => {
    const categoryOrder = prioritizeActions
      ? (["action", "trigger"] as const)
      : (["trigger", "action"] as const);

    return categoryOrder.map(
      (category) => [category, nodeCategories[category]] as const,
    );
  }, [nodeCategories, prioritizeActions]);

  return (
    <>
      <ActionIcon
        id="add-node-button"
        style={{ position: "absolute", top: 16, right: 16 }}
        onClick={() => setShowNodePalette(true)}
      >
        <IconPlus size={32} />
      </ActionIcon>
      {/* Drawer */}
      <Transition
        mounted={showNodePalette}
        transition="slide-left"
        duration={200}
        timingFunction="ease"
      >
        {(styles) => (
          <Paper
            shadow="md"
            p="sm"
            m="sm"
            mah="98%"
            style={{
              ...styles,
              position: "absolute",
              top: 0,
              right: 0,
              width: 300,
              zIndex: 1,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Stack
              style={{ flex: "1 1 auto", minHeight: 0, maxHeight: "100%" }}
            >
              <Group justify="space-between">
                <Text fw={500}>Add Node</Text>
                <ActionIcon
                  onClick={() => setShowNodePalette(false)}
                  variant="subtle"
                  c="dimmed"
                  aria-label="Close node palette"
                >
                  <IconMinus />
                </ActionIcon>
              </Group>
              <TextInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search nodes..."
                mb="md"
                leftSection={<IconSearch size={16} />}
                rightSection={
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    aria-label="Clear search"
                    onClick={() => setSearch("")}
                  >
                    <IconX size={16} />
                  </ActionIcon>
                }
              />

              <ScrollArea.Autosize
                type="hover"
                mah="100%"
                style={{ minHeight: 0 }}
              >
                <Stack>
                  {orderedCategories.map(([category, items]) => {
                    const nodes = items as NodeMetadata[];
                    if (nodes.length === 0) return null;
                    return (
                      <div key={category}>
                        <Text
                          size="sm"
                          fw={500}
                          c="dimmed"
                          tt="capitalize"
                          mb="xs"
                        >
                          {category + "s"}
                        </Text>
                        {nodes.map((item) => (
                          <Button
                            key={item.type}
                            variant="subtle"
                            fullWidth
                            justify="start"
                            leftSection={
                              typeof item.icon === "string" ? (
                                <Text size="lg">{item.icon}</Text>
                              ) : (
                                (() => {
                                  const IconComponent =
                                    item.icon as React.ComponentType<any>;
                                  return (
                                    <IconComponent
                                      size={22}
                                      color={
                                        colorScheme === "dark"
                                          ? "white"
                                          : "black"
                                      }
                                    />
                                  );
                                })()
                              )
                            }
                            mb="xs"
                            onClick={() =>
                              createNode(item.type, category as NodeType)
                            }
                          >
                            <Stack align="flex-start" gap={0} w="100%">
                              <Text size="sm">{item.label}</Text>
                              <Text
                                w="100%"
                                size="xs"
                                c="dimmed"
                                title={item.description}
                                lineClamp={2}
                                truncate="end"
                              >
                                {item.description}
                              </Text>
                            </Stack>
                          </Button>
                        ))}
                      </div>
                    );
                  })}
                </Stack>
              </ScrollArea.Autosize>
            </Stack>
          </Paper>
        )}
      </Transition>
    </>
  );
}
