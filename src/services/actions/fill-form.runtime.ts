import definition from "./fill-form.definition";
import { BaseAction } from "@/types/actions";
import { getElement } from "@/utils/helpers";
import {
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
  fields: FillFormActionFieldOutput[];
  _timestamp: number;
}

export class FillFormAction extends BaseAction<
  FillFormActionConfig,
  FillFormActionOutput
> {
  constructor() {
    super(definition);
  }

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
    return { _timestamp: Date.now(), fields: fieldsExample as any };
  }
  private fillField(
    selectorType: FillFormSelectorType,
    selector: string,
    value: string,
  ): string | undefined {
    try {
      const element = getElement(selector, selectorType);
      if (!element)
        return `Element not found for selector: ${selector} (type: ${selectorType})`;
      if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement
      ) {
        element.value = value;
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
        return undefined;
      }
      if (element instanceof HTMLSelectElement) {
        const option = Array.from(element.options).find(
          (opt) => opt.value === value || opt.text === value,
        );
        if (option) {
          element.value = option.value;
          element.dispatchEvent(new Event("change", { bubbles: true }));
          return undefined;
        }
        return `Option not found for select element with value: ${value}`;
      }
      return `Element is not a form input: ${element.tagName}`;
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
    const result = config.fields.map((field) => {
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
        error,
      };
    });
    onSuccess({ fields: result, _timestamp: Date.now() });
  }
}
