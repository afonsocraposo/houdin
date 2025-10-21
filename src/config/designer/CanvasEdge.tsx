import React, { useState } from "react";
import { getBezierPath, BaseEdge, EdgeToolbar, EdgeProps } from "@xyflow/react";
import { ActionIcon } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { useHover } from "@mantine/hooks";

interface CanvasEdgeProps extends EdgeProps {
  data?: {
    onDelete?: (id: string) => void;
  };
}

const CanvasEdge: React.FC<CanvasEdgeProps> = ({
  id,
  data,
  markerEnd,
  selected,
  ...props
}) => {
  const [edgePath, centerX, centerY] = getBezierPath(props);
  const { hovered: edgeHovered, ref: edgeRef } = useHover();
  const { hovered: toolbarHovered, ref: toolbarRef } = useHover();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data?.onDelete) {
      data.onDelete(id);
    }
  };

  return (
    <>
      <g ref={edgeRef}>
        <BaseEdge
          id={id}
          path={edgePath}
          style={{
            strokeWidth: 2,
            cursor: "pointer",
          }}
          markerEnd={markerEnd}
        />
      </g>

      <EdgeToolbar
        edgeId={id}
        x={centerX}
        y={centerY}
        isVisible
        style={{
          transition: "opacity 0.2s",
          opacity: edgeHovered || toolbarHovered || selected ? 1 : 0,
        }}
      >
        <ActionIcon
          ref={toolbarRef}
          size="sm"
          color="red"
          variant="light"
          onClick={handleDelete}
        >
          <IconTrash size={14} />
        </ActionIcon>
      </EdgeToolbar>
    </>
  );
};

export default CanvasEdge;
