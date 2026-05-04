import { Box, Text } from "@mantine/core";
import { lazy, Suspense, ComponentType, memo } from "react";

interface NodeIconProps {
  icon: string | ComponentType<{ size?: number }>;
  size?: number;
  color?: string;
}

function DynamicTablerIcon({
  name,
  size,
  color,
}: {
  name: string;
  size: number;
  color: string;
}) {
  const IconComponent = lazy(() =>
    import("@tabler/icons-react").then((mod) => ({
      default: mod[name as keyof typeof mod] as ComponentType<{
        size?: number;
        color?: string;
      }>,
    })),
  );
  return (
    <Suspense fallback={null}>
      <IconComponent size={size} color={color} />
    </Suspense>
  );
}

const NodeIcon = ({
  icon,
  size = 22,
  color = "var(--mantine-color-text)",
}: NodeIconProps) => {
  if (typeof icon === "string") {
    if (icon.startsWith("Icon")) {
      return (
        <Box h={size}>
          <DynamicTablerIcon name={icon} size={size} color={color} />
        </Box>
      );
    }
    return (
      <Text fz={size * 0.9} style={{ lineHeight: size + "px" }}>
        {icon}
      </Text>
    );
  }
  const IconComponent = icon;
  return <IconComponent size={size} />;
};

export default memo(NodeIcon);
