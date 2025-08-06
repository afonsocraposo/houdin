import { TextInput } from "@mantine/core";

interface InputProps {
  recipe: any;
  onSubmit: (text: string) => void;
}

export default function InputFactory({ recipe, onSubmit }: InputProps) {
  return (
    <TextInput
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault(); // Prevent default form submission
          onSubmit((e.target as HTMLInputElement).value);
        }
      }}
      placeholder={recipe.componentText}
    />
  );
}
