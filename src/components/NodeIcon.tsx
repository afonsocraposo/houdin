interface NodeIconProps {
  icon: string | React.ComponentType<any>;
  size?: number;
}
export default function NodeIcon({ icon, size = 22 }: NodeIconProps) {
  if (typeof icon === "string") {
    return icon;
  } else {
    const IconComponent = icon;
    return <IconComponent size={size} />;
  }
}
