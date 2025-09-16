import {
  BaseAction,
  ActionConfigSchema,
  ActionMetadata,
} from "@/types/actions";
import FormBuilder, {
  FormFieldDefinition,
} from "@/components/formAction/FormBuilder";
import React from "react";
import { ModalService } from "../modal";

interface FormActionConfig {
  fields: FormFieldDefinition[];
}

export class FormAction extends BaseAction<FormActionConfig> {
  readonly metadata: ActionMetadata = {
    type: "form",
    label: "Form",
    icon: "📝",
    description: "Show a form to collect user input",
    disableTimeout: true,
  };

  getConfigSchema(): ActionConfigSchema {
    return {
      properties: {
        fields: {
          type: "custom",
          label: "Form Fields",
          description: "Define the fields to collect user input",
          // required: true,
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
        },
      },
    };
  }

  async execute(
    config: FormActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data?: any) => void,
    _onError: (error: Error) => void,
  ): Promise<void> {
    const { fields } = config;

    try {
      const values = await ModalService.showFormModal({ fields });
      onSuccess(values);
    } catch (error) {
      console.error("Error collecting form input:", error);
      onSuccess(null); // or handle error as needed
    }
  }
}
