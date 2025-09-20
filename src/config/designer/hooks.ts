import {
  WorkflowConnection,
  WorkflowDefinition,
  WorkflowNode,
} from "@/types/workflow";
import { useStateHistory } from "@mantine/hooks";

export const useWorkflowState = (workflow: WorkflowDefinition | null) => {
  const [state, { set: setState, back: undo, forward: redo }, history] =
    useStateHistory<{
      nodes: WorkflowNode[];
      connections: WorkflowConnection[];
    }>({
      nodes: workflow?.nodes || [],
      connections: workflow?.connections || [],
    });
  const setNodes = (nodes: WorkflowNode[]) => {
    // check if nodes is same as state.nodes
    if (JSON.stringify(nodes) === JSON.stringify(state.nodes)) return;
    setState({ nodes, connections: state.connections });
  };
  const setConnections = (connections: WorkflowConnection[]) => {
    // check if connections is same as state.connections
    if (JSON.stringify(connections) === JSON.stringify(state.connections))
      return;
    setState({ nodes: state.nodes, connections });
  };
  return {
    nodes: JSON.parse(JSON.stringify(state.nodes)) as WorkflowNode[],
    connections: JSON.parse(
      JSON.stringify(state.connections),
    ) as WorkflowConnection[],
    setNodes,
    setConnections,
    undo,
    redo,
    current: history.current,
    total: history.history.length,
  };
};
