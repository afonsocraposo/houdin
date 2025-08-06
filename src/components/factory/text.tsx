import { Text } from "@mantine/core";

interface TextProps {
  recipe: any;
}

export default function TextFactory({ recipe }: TextProps) {
  return <Text>{recipe.componentText || "Hello world"}</Text>;
}
