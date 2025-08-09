import { Routes, Route, useParams } from "react-router-dom";
import ConfigInterface from "../components/ConfigInterface";
import DesignerView from "../components/DesignerView";
import ExecutionHistoryPage from "../components/ExecutionHistoryPage";

function DesignerWithParams() {
  const { workflowId } = useParams<{ workflowId?: string }>();
  return <DesignerView workflowId={workflowId} />;
}

function ExecutionHistoryWithParams() {
  return <ExecutionHistoryPage />;
}

function ConfigApp() {
  return (
    <Routes>
      <Route path="/" element={<ConfigInterface />} />
      <Route path="/designer" element={<DesignerView />} />
      <Route path="/designer/:workflowId" element={<DesignerWithParams />} />
      <Route path="/executions" element={<ExecutionHistoryPage />} />
      <Route
        path="/executions/:workflowId"
        element={<ExecutionHistoryWithParams />}
      />
    </Routes>
  );
}

export default ConfigApp;
