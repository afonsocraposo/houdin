import { TextInput } from "@mantine/core";
import { CSSProperties } from "react";

interface InputProps {
  recipe: any;
  onSubmit: (text: string) => void;
}

export default function InputFactory({ recipe, onSubmit }: InputProps) {
  // Build styles object from recipe properties
  const inputStyle: CSSProperties = {};

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

      Object.assign(inputStyle, customStyles);
    } catch (error) {
      console.warn("Failed to parse custom styles:", recipe.customStyle);
    }
  }

  return (
    <TextInput
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault(); // Prevent default form submission
          onSubmit((e.target as HTMLInputElement).value);
        }
      }}
      placeholder={recipe.inputPlaceholder || recipe.componentText || "Aa"}
      label={
        recipe.componentText && recipe.inputPlaceholder
          ? recipe.componentText
          : undefined
      }
      style={inputStyle}
    />
  );
}
