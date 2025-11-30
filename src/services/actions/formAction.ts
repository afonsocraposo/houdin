import { BaseAction, ActionMetadata } from "@/types/actions";
import FormBuilder, {
  FormFieldDefinition,
} from "@/components/formAction/FormBuilder";
import React from "react";
import { ModalService } from "../modal";
import { customProperty, textProperty } from "@/types/config-properties";

export interface FormActionConfig {
  title: string;
  fields: FormFieldDefinition[];
}

interface FormActionOutput {
  [key: string]: any; // Dynamic keys based on form fields
  _timestamp: number; // Timestamp of form submission
}

export class FormAction extends BaseAction<FormActionConfig, FormActionOutput> {
  static readonly metadata: ActionMetadata = {
    type: "form",
    label: "Form",
    icon: "📝",
    description: "Show a form to collect user input",
    disableTimeout: true,
  };

  static readonly configSchema = {
    properties: {
      title: textProperty({
        label: "Form Title",
        placeholder: "Enter form title",
        description: "Title of the form to display to the user",
      }),
      fields: customProperty({
        label: "Form Fields",
        description: "Define the fields to collect user input",
        defaultValue: [
          {
            name: "",
            label: "",
            type: "text",
            required: false,
            placeholder: "",
            defaultValue: "",
          },
        ],
        component: "FormBuilder",
        render: (
          values: Record<string, any>,
          onChange: (key: string, value: any) => void,
        ) => {
          const fields = values.fields || [];
          return React.createElement(
            "div",
            null,
            FormBuilder({ fields, onChange }),
          );
        },
      }),
    },
  };

  readonly outputExample = {
    email: "email@example.com",
    password: "password123",
    _timestamp: Date.now(),
  };

  static getRichOutputExample(config: FormActionConfig): FormActionOutput {
    const fieldsExample =
      config.fields?.map((field) => {
        return {
          [field.name]:
            field.defaultValue || field.placeholder || field.label || "",
        };
      }) ?? [];
    return {
      _timestamp: Date.now(),
      ...Object.assign({}, ...fieldsExample),
    };
  }

  async execute(
    config: FormActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data?: any) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    const { title, fields } = config;

    try {
      const values = await ModalService.showFormModal({ title, fields });
      onSuccess({
        ...values,
        _timestamp: Date.now(),
      });
    } catch (error) {
      onError(error as Error);
    }
  }
}
