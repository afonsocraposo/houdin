import { Routes, Route, useParams } from "react-router-dom";
import ConfigInterface from "./ConfigInterface";
import DesignerView from "./designer/DesignerView";
import ExecutionHistoryPage from "./history/ExecutionHistoryPage";
import HelpModal from "@/components/HelpModal";
import { useDisclosure } from "@mantine/hooks";
import { ActionIcon, Affix } from "@mantine/core";
import { IconQuestionMark } from "@tabler/icons-react";

function DesignerWithParams() {
  const { workflowId } = useParams<{ workflowId?: string }>();
  return <DesignerView workflowId={workflowId} />;
}

function ConfigApp() {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
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
    </>
  );
}

export default ConfigApp;
