import { Button, Text } from "@mantine/core";

interface ButtonProps {
  recipe: any;
  onClick?: () => void;
}

export default function ButtonFactory({ recipe, onClick }: ButtonProps) {
  return (
    <Button onClick={onClick}>
      <Text>{recipe.componentText || "Click Me"}</Text>
    </Button>
  );
}
