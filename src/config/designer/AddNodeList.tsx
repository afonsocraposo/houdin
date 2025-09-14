import { initializeActions } from "@/services/actionInitializer";
import { ActionRegistry } from "@/services/actionRegistry";
import {
  initializeTriggers,
  TriggerRegistry,
} from "@/services/triggerInitializer";
import { NodeType } from "@/types/workflow";
import {
  ActionIcon,
  Button,
  Paper,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Transition,
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";

interface AddNodeListProps {
  createNode: (type: string, category: NodeType) => void;
  opened?: boolean;
}
export default function AddNodeList({
  createNode,
  opened = false,
}: AddNodeListProps) {
  const [showNodePalette, setShowNodePalette] = useState(opened);
  // Helper function to get node categories from registries
  const nodeCategories = useMemo(() => {
    // Initialize registries to ensure they're loaded
    initializeTriggers();
    initializeActions();

    const actionRegistry = ActionRegistry.getInstance();
    const triggerRegistry = TriggerRegistry.getInstance();

    const categories = {
      trigger: triggerRegistry.getAllTriggerMetadata().map((metadata) => ({
        type: metadata.type,
        label: metadata.label,
        icon: metadata.icon,
        description: metadata.description,
      })),
      action: actionRegistry.getAllActionMetadata().map((metadata) => ({
        type: metadata.type,
        label: metadata.label,
        icon: metadata.icon,
        description: metadata.description,
      })),
      // TODO: Add conditions when we have a condition registry
      condition: [],
    };

    return categories;
  }, []);

  useEffect(() => {
    setShowNodePalette(opened);
  }, [opened]);
  return (
    <>
      <ActionIcon
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
            p="md"
            style={{
              ...styles,
              position: "absolute",
              top: 0,
              right: 0,
              height: "100%",
              width: 300,
              zIndex: 1,
            }}
          >
            <Text fw={500} mb="md">
              Add Node
            </Text>
            <TextInput />

            <ScrollArea h="100%" pb="xl">
              <Stack>
                {Object.entries(nodeCategories).map(([category, items]) => {
                  if (items.length === 0) return null;
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
                      {items.map((item) => (
                        <Button
                          key={item.type}
                          variant="subtle"
                          fullWidth
                          justify="start"
                          leftSection={<Text size="lg">{item.icon}</Text>}
                          mb="xs"
                          onClick={() =>
                            createNode(item.type, category as NodeType)
                          }
                        >
                          <Stack align="flex-start" gap={0}>
                            <Text size="sm">{item.label}</Text>
                            <Text size="xs" c="dimmed">
                              {item.description}
                            </Text>
                          </Stack>
                        </Button>
                      ))}
                    </div>
                  );
                })}
              </Stack>
            </ScrollArea>
          </Paper>
        )}
      </Transition>
    </>
  );
}
