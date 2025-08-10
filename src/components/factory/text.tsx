import { Text } from "@mantine/core";
import { CSSProperties } from "react";
import MarkdownText from "../MarkdownText";

interface TextProps {
  recipe: any;
}

export default function TextFactory({ recipe }: TextProps) {
  if (
    recipe.componentText === undefined ||
    recipe.componentText === null ||
    recipe.componentText === ""
  ) {
    return <span />; // Return null if componentText is empty or undefined
  }
  // Build styles object from recipe properties
  const textStyle: CSSProperties = {};

  // Apply text color if specified
  if (recipe.textColor) {
    textStyle.color = recipe.textColor;
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

      Object.assign(textStyle, customStyles);
    } catch (error) {
      console.warn("Failed to parse custom styles:", recipe.customStyle);
    }
  }

  if (recipe.useMarkdown) {
    return (
      <MarkdownText style={textStyle}>{recipe.componentText}</MarkdownText>
    );
  }

  return (
    <Text style={textStyle} c={recipe.componentText ? undefined : "dimmed"}>
      {recipe.componentText}
    </Text>
  );
}
