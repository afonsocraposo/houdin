import React, { useState, useEffect } from "react";
import { Text, TextProps, Tooltip } from "@mantine/core";
import { formatTimeAgo } from "../utils/time";

interface TimeAgoTextProps extends Omit<TextProps, "children"> {
  timestamp: number;
  prefix?: string;
  refreshInterval?: number; // in milliseconds, defaults to 60000 (1 minute)
}

export const TimeAgoText: React.FC<TimeAgoTextProps> = ({
  timestamp,
  prefix = "",
  refreshInterval = 60000,
  ...textProps
}) => {
  const [timeAgoText, setTimeAgoText] = useState<string>("");

  useEffect(() => {
    const updateTimeAgo = () => {
      const formattedTime = formatTimeAgo(timestamp);
      setTimeAgoText(prefix ? `${prefix} ${formattedTime}` : formattedTime);
    };

    // Update immediately
    updateTimeAgo();

    // Set up interval for periodic updates
    const interval = setInterval(updateTimeAgo, refreshInterval);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [timestamp, prefix, refreshInterval]);

  return (
    <Tooltip label={new Date(timestamp).toLocaleString()}>
      <Text {...textProps}>{timeAgoText}</Text>
    </Tooltip>
  );
};
