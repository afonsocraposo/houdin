import { ActionIcon, Affix, Tooltip } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { CSSProperties } from "react";

interface FloatingActionButtonProps {
  recipe: any;
  onClick?: () => void;
  preview?: boolean;
}

export default function FloatingActionButtonFactory({
  recipe,
  onClick,
  preview = false,
}: FloatingActionButtonProps) {
  // Default position for the floating action button
  const defaultPosition: {
    bottom?: number;
    right?: number;
    top?: number;
    left?: number;
  } = { bottom: 40, right: 40 };

  // Parse custom position if provided in customStyle
  let position: {
    bottom?: number;
    right?: number;
    top?: number;
    left?: number;
  } = { ...defaultPosition };
  if (recipe.customStyle) {
    try {
      const customStyles = recipe.customStyle
        .split(";")
        .filter((style: string) => style.trim())
        .reduce((acc: Record<string, any>, style: string) => {
          const [property, value] = style
            .split(":")
            .map((s: string) => s.trim());
          if (property && value) {
            acc[property] = value;
          }
          return acc;
        }, {});

      // Extract position values if specified
      if (customStyles.bottom) {
        position.bottom = parseInt(customStyles.bottom) || 40;
      }
      if (customStyles.right) {
        position.right = parseInt(customStyles.right) || 40;
      }
      if (customStyles.top) {
        position = { ...position, top: parseInt(customStyles.top) };
        delete (position as any).bottom;
      }
      if (customStyles.left) {
        position = { ...position, left: parseInt(customStyles.left) };
        delete (position as any).right;
      }
    } catch (error) {
      console.warn("Failed to parse custom position:", recipe.customStyle);
    }
  }

  // Button styling
  const buttonStyle: CSSProperties = {};
  if (recipe.buttonColor) {
    buttonStyle.backgroundColor = recipe.buttonColor;
  }

  const iconColor = recipe.buttonTextColor || "#ffffff";

  // Check if an emoji icon is provided, otherwise use the Plus icon
  const emojiIcon = recipe.componentText?.substring(0, 2); // Use the first character as the emoji icon
  const hasEmojiIcon = emojiIcon && emojiIcon.trim().length > 0;

  const button = (
    <ActionIcon
      onClick={onClick}
      style={buttonStyle}
      color={recipe.buttonColor ? undefined : "blue"}
      radius="xl"
      size={60}
      variant="filled"
    >
      {hasEmojiIcon ? (
        <span style={{ fontSize: "24px", lineHeight: 1 }}>{emojiIcon}</span>
      ) : (
        <IconPlus stroke={1.5} size={30} color={iconColor} />
      )}
    </ActionIcon>
  );
  if (preview) {
    return button;
  }

  return <Affix position={position}>{button}</Affix>;
}
