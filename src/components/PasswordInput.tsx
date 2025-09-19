import { ActionIcon, TextInput, TextInputProps } from "@mantine/core";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { useState } from "react";

export default function PasswordInput(props: TextInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <TextInput
      {...props}
      rightSection={
        <ActionIcon
          onClick={() => setShowPassword((prev) => !prev)}
          tabIndex={-1}
        >
          {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
        </ActionIcon>
      }
      type={showPassword ? "text" : "password"}
    />
  );
}
