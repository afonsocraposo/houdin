import { Routes, Route, useParams } from "react-router-dom";
import ConfigInterface from "../components/ConfigInterface";
import DesignerView from "../components/DesignerView";

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
    </Routes>
  );
}

export default ConfigApp;
