import {
  WorkflowConnection,
  WorkflowDefinition,
  WorkflowNode,
} from "@/types/workflow";
import { useStateHistory, useThrottledCallback } from "@mantine/hooks";
import isEqual from "lodash/isEqual";
import cloneDeep from "lodash/cloneDeep";
import { useEffect, useState } from "react";

export const useWorkflowState = (workflow: WorkflowDefinition | null) => {
  const [state, setState] = useState<{
    nodes: WorkflowNode[];
    connections: WorkflowConnection[];
  }>({
    nodes: workflow?.nodes || [],
    connections: workflow?.connections || [],
  });
  const [historyState, { set, back: undo, forward: redo }, history] =
    useStateHistory<{
      nodes: WorkflowNode[];
      connections: WorkflowConnection[];
    }>(state);

  useEffect(() => {
    setState(historyState);
  }, [history.current]);
  const setNodes = (nodes: WorkflowNode[]) => {
    // check if nodes is same as state.nodes
    if (isEqual(nodes, state.nodes)) return;
    set({ nodes, connections: state.connections });
  };
  const setConnections = (connections: WorkflowConnection[]) => {
    // check if connections is same as state.connections
    if (isEqual(connections, state.connections)) return;
    set({ nodes: state.nodes, connections });
  };
  const throttledSet = useThrottledCallback(set, 1000);
  const setNodesAndConnections = (
    nodes?: WorkflowNode[],
    connections?: WorkflowConnection[],
  ) => {
    // check if connections is same as state.connections
    if (
      (!connections && !nodes) ||
      (isEqual(connections, state.connections) && isEqual(nodes, state.nodes))
    )
      return;
    const newState = {
      nodes: nodes || state.nodes,
      connections: connections || state.connections,
    };
    setState(newState);
    throttledSet(newState);
  };
  return {
    nodes: cloneDeep(state.nodes) as WorkflowNode[],
    connections: cloneDeep(state.connections) as WorkflowConnection[],
    setNodes,
    setConnections,
    set: setNodesAndConnections,
    undo,
    redo,
    current: history.current,
    total: history.history.length,
  };
};
