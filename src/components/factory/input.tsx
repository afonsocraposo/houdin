import { TextInput } from "@mantine/core";
import { CSSProperties } from "react";

interface InputProps {
  recipe: any;
  onSubmit: (text: string) => void;
  preview?: boolean;
}

export default function InputFactory({ recipe, onSubmit, preview = false }: InputProps) {
  // Build styles object from recipe properties
  const inputStyle: CSSProperties = {};

  // Parse and apply custom styles
  if (recipe.customStyle) {
    try {
      const positioningProps = new Set([
        "position",
        "top",
        "bottom",
        "left",
        "right",
        "z-index",
        "zIndex",
      ]);

      const customStyles = recipe.customStyle
        .split(";")
        .filter((style: string) => style.trim())
        .reduce((acc: Record<string, any>, style: string) => {
          const [property, value] = style
            .split(":")
            .map((s: string) => s.trim());
          if (property && value) {
            const camelCaseProperty = property.replace(/-([a-z])/g, (g) =>
              g[1].toUpperCase(),
            );
            if (preview && positioningProps.has(property)) {
              return acc;
            }
            acc[camelCaseProperty] = value;
          }
          return acc;
        }, {});

      if (preview) {
        customStyles.position = "relative";
      }

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
