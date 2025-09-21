import { Routes, Route, useParams } from "react-router-dom";
import ConfigInterface from "./ConfigInterface";
import DesignerView from "./designer/DesignerView";
import ExecutionHistoryPage from "./history/ExecutionHistoryPage";

function DesignerWithParams() {
  const { workflowId } = useParams<{ workflowId?: string }>();
  return <DesignerView workflowId={workflowId} />;
}

function ConfigApp() {
  return (
    <Routes>
      <Route path="/" element={<ConfigInterface />} />
      <Route path="/designer" element={<DesignerView />} />
      <Route path="/designer/:workflowId" element={<DesignerWithParams />} />
      <Route path="/executions" element={<ExecutionHistoryPage />} />
    </Routes>
  );
}

export default ConfigApp;
