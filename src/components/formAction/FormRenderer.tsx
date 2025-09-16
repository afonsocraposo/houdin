import { Button, Stack } from "@mantine/core";
import { FormFieldDefinition } from "./FormBuilder";
import FormItem from "./FormItem";
import { useForm } from "@mantine/form";

export default function FormRenderer({
  fields,
  onSubmit,
}: {
  fields: FormFieldDefinition[];
  onSubmit: (data: Record<string, any>) => void;
}) {
  const form = useForm({
    mode: "uncontrolled",
    initialValues: fields.reduce(
      (acc, field) => {
        acc[field.name] = field.defaultValue || null;
        return acc;
      },
      {} as Record<string, any>,
    ),
  });
  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        {fields.map((field) => (
          <FormItem
            field={field}
            key={field.name}
            props={form.getInputProps(field.name, {
              type: field.type === "checkbox" ? "checkbox" : undefined,
            })}
          />
        ))}
        <Button type="submit">Submit</Button>
      </Stack>
    </form>
  );
}
