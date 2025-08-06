import { Button, Text } from "@mantine/core";
import { CSSProperties } from "react";

interface ButtonProps {
  recipe: any;
  onClick?: () => void;
}

export default function ButtonFactory({ recipe, onClick }: ButtonProps) {
  // Build styles object from recipe properties
  const buttonStyle: CSSProperties = {};
  const textStyle: CSSProperties = {};

  // Apply button background color if specified
  if (recipe.buttonColor) {
    buttonStyle.backgroundColor = recipe.buttonColor;
  }

  // Apply text color if specified
  if (recipe.buttonTextColor) {
    textStyle.color = recipe.buttonTextColor;
  }

  // Parse and apply custom styles
  if (recipe.customStyle) {
    try {
      // Simple CSS parser for the custom styles
      const customStyles = recipe.customStyle
        .split(";")
        .filter((style: string) => style.trim())
        .reduce((acc: Record<string, any>, style: string) => {
          const [property, value] = style
            .split(":")
            .map((s: string) => s.trim());
          if (property && value) {
            // Convert kebab-case to camelCase for React style properties
            const camelCaseProperty = property.replace(/-([a-z])/g, (g) =>
              g[1].toUpperCase(),
            );
            acc[camelCaseProperty] = value;
          }
          return acc;
        }, {});

      Object.assign(buttonStyle, customStyles);
    } catch (error) {
      console.warn("Failed to parse custom styles:", recipe.customStyle);
    }
  }

  return (
    <Button onClick={onClick} style={buttonStyle} variant="filled">
      <Text style={textStyle}>{recipe.componentText || "Click Me"}</Text>
    </Button>
  );
}
