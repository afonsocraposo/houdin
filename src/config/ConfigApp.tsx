import { Routes, Route, useParams } from "react-router-dom";
import ConfigInterface from "./ConfigInterface";
import DesignerView from "./designer/DesignerView";
import ExecutionHistoryPage from "./history/ExecutionHistoryPage";
import HelpModal from "@/components/HelpModal";
import { useDisclosure } from "@mantine/hooks";
import { ActionIcon, Affix } from "@mantine/core";
import { IconQuestionMark } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { ApiClient } from "@/api/client";
import { Account } from "@/api/types/account";

function DesignerWithParams() {
  const { workflowId } = useParams<{ workflowId?: string }>();
  return <DesignerView workflowId={workflowId} />;
}

function ConfigApp() {
  const [opened, { open, close }] = useDisclosure(false);
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    fetchAccount();
  }, []);

  const fetchAccount = async () => {
    const client = ApiClient.getInstance();
    try {
      const account = await client.getAccount();
      setAccount(account);
      console.log("Fetched account:", account);
    } catch (error) {
      console.error("Error fetching account:", error);
    }
  };

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
