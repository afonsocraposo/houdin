import {
  WorkflowConnection,
  WorkflowDefinition,
  WorkflowNode,
} from "@/types/workflow";
import { useStateHistory } from "@mantine/hooks";
import isEqual from "lodash/isequal";
import cloneDeep from "lodash/cloneDeep";

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
    if (isEqual(nodes, state.nodes)) return;
    setState({ nodes, connections: state.connections });
  };
  const setConnections = (connections: WorkflowConnection[]) => {
    // check if connections is same as state.connections
    if (isEqual(connections, state.connections)) return;
    setState({ nodes: state.nodes, connections });
  };
  return {
    nodes: cloneDeep(state.nodes) as WorkflowNode[],
    connections: cloneDeep(state.connections) as WorkflowConnection[],
    setNodes,
    setConnections,
    undo,
    redo,
    current: history.current,
    total: history.history.length,
  };
};
