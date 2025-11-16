import { Routes, Route, useParams } from "react-router-dom";
import ConfigInterface from "./ConfigInterface";
import DesignerView from "./designer/DesignerView";
import ExecutionHistoryPage from "./history/ExecutionHistoryPage";
import HelpModal from "@/components/HelpModal";
import { useDisclosure } from "@mantine/hooks";
import { ActionIcon, Affix, Box, useComputedColorScheme } from "@mantine/core";
import { IconQuestionMark } from "@tabler/icons-react";
import { useEffect } from "react";
import { ApiClient } from "@/api/client";
import { useStore } from "./store";

function DesignerWithParams() {
  const { workflowId } = useParams<{ workflowId?: string }>();
  return <DesignerView workflowId={workflowId} />;
}

function ConfigApp() {
  const [opened, { open, close }] = useDisclosure(false);
  const setAccount = useStore((state) => state.setAccount);
  const colorScheme = useComputedColorScheme();

  useEffect(() => {
    fetchAccount();
  }, []);

  const fetchAccount = async () => {
    try {
      const account = await ApiClient.getAccount();
      setAccount(account);
    } catch (error) {
      console.error("Error fetching account:", error);
    }
  };

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
        <Route path="/executions" element={<ExecutionHistoryPage />} />
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
