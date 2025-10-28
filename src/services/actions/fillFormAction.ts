import { BaseAction, ActionMetadata } from "@/types/actions";
import React from "react";
import { customProperty } from "@/types/config-properties";
import { IconForms } from "@tabler/icons-react";
import FillFormBuilder, {
  FillFormFieldDefinition,
  FillFormSelectorType,
} from "@/components/fillFormAction/FillFormBuilder";

export interface FillFormActionConfig {
  fields: FillFormFieldDefinition[];
}

interface FillFormActionFieldOutput {
  selectorType: string;
  selector: string;
  value: string;
}

interface FillFormActionOutput {
  fields: FillFormActionFieldOutput[]; // Dynamic keys based on form fields
  _timestamp: number; // Timestamp of form submission
}

export class FillFormAction extends BaseAction<
  FillFormActionConfig,
  FillFormActionOutput
> {
  static readonly metadata: ActionMetadata = {
    type: "fill-form",
    label: "Fill Form",
    icon: IconForms,
    description: "Fill out multiple fields in a form",
    disableTimeout: true,
  };

  readonly configSchema = {
    properties: {
      fields: customProperty({
        label: "Form Fields",
        description: "Define the fields to fill in the form and their values",
        // required: true,
        render: (
          values: Record<string, any>,
          onChange: (key: string, value: any) => void,
        ) => {
          const fields = values.fields || [];
          return React.createElement(
            "div",
            null,
            FillFormBuilder({ fields, onChange }),
          );
        },
      }),
    },
  };

  readonly outputExample = {
    fields: [
      {
        selectorType: "css",
        selector: "#email",
        value: "email@example.com",
      },
      {
        selectorType: "css",
        selector: "#password",
        value: "password123",
      },
    ],
    _timestamp: Date.now(),
  };

  static getRichOutputExample(
    config: FillFormActionConfig,
  ): FillFormActionOutput {
    const fieldsExample =
      config.fields?.map((field) => ({
        selectorType: field.selectorType || "css",
        selector: field.selector || "#id",
        value: field.value || "example value",
      })) ?? [];
    return {
      _timestamp: Date.now(),
      fields: fieldsExample,
    };
  }

  private fillField(
    selectorType: FillFormSelectorType,
    selector: string,
    value: string,
  ): boolean {}

  async execute(
    config: FillFormActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data?: any) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    // fill fields
    const { fields } = config;
    try {
      const result = fields.map((field) => ({
        ...field,
        success: this.fillField(
          field.selectorType,
          field.selector,
          field.value,
        ),
      }));
      onSuccess({ fieds: result });
    } catch (error) {
      onError(error as Error);
    }
  }
}
