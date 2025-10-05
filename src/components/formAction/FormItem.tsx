import { Checkbox, NativeSelect, NumberInput, TextInput } from "@mantine/core";
import { FormFieldDefinition } from "./FormBuilder";
import PasswordInput from "../PasswordInput";

export default function FormItem({
  field,
  props,
}: {
  field: FormFieldDefinition;
  props: any;
}) {
  switch (field.type) {
    case "text":
      return (
        <TextInput
          label={field.label}
          placeholder={field.placeholder}
          withAsterisk={field.required}
          required={field.required}
          {...props}
        />
      );
    case "password":
      return (
        <PasswordInput
          label={field.label}
          placeholder={field.placeholder}
          autoComplete="current-password"
          withAsterisk={field.required}
          required={field.required}
          {...props}
        />
      );
    case "number":
      return (
        <NumberInput
          label={field.label}
          placeholder={field.placeholder}
          withAsterisk={field.required}
          required={field.required}
          {...props}
        />
      );
    case "checkbox":
      return (
        <Checkbox
          label={field.label}
          placeholder={field.placeholder}
          required={field.required}
          {...props}
        />
      );
    case "select":
      return (
        <NativeSelect
          label={field.label}
          placeholder={field.placeholder}
          data={field.options || []}
          required={field.required}
          {...props}
        />
      );
    default:
      return null;
  }
}
