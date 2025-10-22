import {
  IconCheck,
  IconX,
  IconPlayerPlay,
  IconClock,
} from "@tabler/icons-react";

export const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
    case "success":
      return "green";
    case "failed":
    case "error":
      return "red";
    case "running":
      return "blue";
    default:
      return "gray";
  }
};

export const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <IconCheck size={16} />;
    case "failed":
      return <IconX size={16} />;
    case "running":
      return <IconPlayerPlay size={16} />;
    default:
      return <IconClock size={16} />;
  }
};
