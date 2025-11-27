import { Routes, Route, useParams } from "react-router-dom";
import ConfigInterface from "./ConfigInterface";
import DesignerView from "./designer/DesignerView";
import HelpModal from "@/components/HelpModal";
import { useDisclosure } from "@mantine/hooks";
import { ActionIcon, Affix, Box, useComputedColorScheme } from "@mantine/core";
import { IconQuestionMark } from "@tabler/icons-react";
import AssetsActions from "./assets/actions";
import AssetsTriggers from "./assets/triggers";

function DesignerWithParams() {
  const { workflowId } = useParams<{ workflowId?: string }>();
  return <DesignerView workflowId={workflowId} />;
}

function ConfigApp() {
  const [opened, { open, close }] = useDisclosure(false);
  const colorScheme = useComputedColorScheme();

  return (
    <Box
      w="100vw"
      h="100vh"
      style={{
        background:
          colorScheme === "dark"
            ? "linear-gradient(135deg, var(--mantine-color-dark-7) 0%, var(--mantine-color-dark-8) 100%)"
            : undefined,
      }}
    >
      <Routes>
        <Route path="/" element={<ConfigInterface />} />
        <Route path="/designer" element={<DesignerView />} />
        <Route path="/designer/:workflowId" element={<DesignerWithParams />} />
        <Route path="/assets/actions" element={<AssetsActions />} />
        <Route path="/assets/triggers" element={<AssetsTriggers />} />
      </Routes>
      <HelpModal key="help-modal" opened={opened} onClose={close} />
      <Affix position={{ bottom: 20, right: 20 }}>
        <ActionIcon onClick={open} size="lg" radius="xl" variant="light">
          <IconQuestionMark />
        </ActionIcon>
      </Affix>
    </Box>
  );
}

export default ConfigApp;
