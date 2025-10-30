import {
  WorkflowConnection,
  WorkflowDefinition,
  WorkflowNode,
} from "@/types/workflow";
import { useStateHistory, useThrottledCallback } from "@mantine/hooks";
import isEqual from "lodash/isEqual";
import cloneDeep from "lodash/cloneDeep";
import { useEffect, useState, useRef, useCallback } from "react";

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

  const throttledSet = useThrottledCallback(set, 1000);
  
  // Use a ref to access current state without recreating the callback
  const stateRef = useRef(state);
  stateRef.current = state;

  const setNodesAndConnections = useCallback((
    nodes?: WorkflowNode[],
    connections?: WorkflowConnection[],
  ) => {
    const currentState = stateRef.current;
    // check if connections is same as state.connections
    if (
      (!connections && !nodes) ||
      (isEqual(connections, currentState.connections) && isEqual(nodes, currentState.nodes))
    )
      return;
    const newState = {
      nodes: nodes || currentState.nodes,
      connections: connections || currentState.connections,
    };
    setState(newState);
    throttledSet(newState);
  }, [throttledSet]);

  return {
    nodes: cloneDeep(state.nodes) as WorkflowNode[],
    connections: cloneDeep(state.connections) as WorkflowConnection[],
    set: setNodesAndConnections,
    undo,
    redo,
    current: history.current,
    total: history.history.length,
  };
};
