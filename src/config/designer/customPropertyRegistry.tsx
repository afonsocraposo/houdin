import React from "react";

import { ComponentFactory } from "@/components/ComponentFactory";
import { KeybindingSetter } from "@/components/KeybindingSetter";
import PermissionButton from "@/config/designer/PermissionButton";
import FormBuilder from "@/components/formAction/FormBuilder";
import FillFormBuilder from "@/components/fillFormAction/FillFormBuilder";

export type CustomPropertyRendererProps = {
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
};

function InjectComponentPreview({ values }: CustomPropertyRendererProps) {
  const previewComponent = ComponentFactory.create(
    values,
    "preview-workflow",
    "preview-node",
    true,
  );

  return React.createElement(
    "div",
    {
      style: {
        position: "relative",
        padding: "10px",
        minHeight: "32px",
      },
    },
    previewComponent,
  );
}

function KeybindingSetterRenderer({ values, onChange }: CustomPropertyRendererProps) {
  return <KeybindingSetter value={values.keyCombo} onChange={(combo) => onChange("keyCombo", combo)} />;
}

function PermissionButtonRenderer() {
  return <PermissionButton />;
}

function FormBuilderRenderer({ values, onChange }: CustomPropertyRendererProps) {
  return <FormBuilder fields={values.fields || []} onChange={onChange} />;
}

function FillFormBuilderRenderer({ values, onChange }: CustomPropertyRendererProps) {
  return <FillFormBuilder fields={values.fields || []} onChange={onChange} />;
}

export const customPropertyRenderers: Record<
  string,
  React.ComponentType<CustomPropertyRendererProps>
> = {
  InjectComponentPreview,
  KeybindingSetter: KeybindingSetterRenderer,
  PermissionButton: PermissionButtonRenderer,
  FormBuilder: FormBuilderRenderer,
  FillFormBuilder: FillFormBuilderRenderer,
};
