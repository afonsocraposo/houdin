import { BaseAction, ActionMetadata } from "@/types/actions";
import React from "react";
import { customProperty } from "@/types/config-properties";
import { IconForms } from "@tabler/icons-react";
import { getElement } from "@/utils/helpers";
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
  success: boolean;
  error?: string;
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

  static readonly configSchema = {
    properties: {
      fields: customProperty({
        label: "Form Fields",
        description: "Define the fields to fill in the form and their values",
        defaultValue: [
          {
            selectorType: "label",
            selector: "",
            value: "",
          },
        ],
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
        selectorType: "placeholder",
        selector: "email@example.com",
        value: "email@example.com",
        success: true,
        error: undefined,
      },
      {
        selectorType: "label",
        selector: "Password",
        value: "password123",
        success: false,
        error: "Element not found",
      },
    ],
    _timestamp: Date.now(),
  };

  static getRichOutputExample(
    config: FillFormActionConfig,
  ): FillFormActionOutput {
    const fieldsExample =
      config.fields?.map((field, index) => ({
        selectorType: field.selectorType || "css",
        selector: field.selector || "#id",
        value: field.value || "example value",
        success: index % 2 === 0,
        result: index % 2 === 0 ? undefined : "Element not found",
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
  ): string | undefined {
    try {
      const element = getElement(selector, selectorType);
      if (!element) {
        return `Element not found for selector: ${selector} (type: ${selectorType})`;
      }

      if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement
      ) {
        // Clear existing value and set new value
        element.value = value;

        // Trigger input events to notify any listeners
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));

        return undefined; // Success
      } else if (element instanceof HTMLSelectElement) {
        // For select elements, try to find matching option
        const option = Array.from(element.options).find(
          (opt) => opt.value === value || opt.text === value,
        );
        if (option) {
          element.value = option.value;
          element.dispatchEvent(new Event("change", { bubbles: true }));
          return undefined; // Success
        } else {
          return `Option not found for select element with value: ${value}`;
        }
      } else {
        return `Element is not a form input: ${element.tagName}`;
      }
    } catch (e) {
      return `Error: ${(e as Error).message}`;
    }
  }

  async execute(
    config: FillFormActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data?: any) => void,
    _onError: (error: Error) => void,
  ): Promise<void> {
    // fill fields
    const { fields } = config;
    const result: FillFormActionFieldOutput[] = fields.map((field) => {
      const error = this.fillField(
        field.selectorType,
        field.selector,
        field.value,
      );
      return {
        selectorType: field.selectorType,
        selector: field.selector,
        value: field.value,
        success: error === undefined,
        error: error,
      };
    });
    onSuccess({
      fields: result,
      _timestamp: Date.now(),
    });
  }
}
