import definition from "./form.definition";
import { BaseAction } from "@/types/actions";
import { FormFieldDefinition } from "@/components/formAction/FormBuilder";
import { ModalService } from "../modal";

export interface FormActionConfig {
  title: string;
  fields: FormFieldDefinition[];
}

interface FormActionOutput {
  [key: string]: any; // Dynamic keys based on form fields
  _timestamp: number; // Timestamp of form submission
}

export class FormAction extends BaseAction<FormActionConfig, FormActionOutput> {
  constructor() {
    super(definition);
  }

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
