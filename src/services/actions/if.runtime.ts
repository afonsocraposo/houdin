import definition from "./if.definition";
import { BaseAction } from "@/types/actions";

interface IfActionConfig {
  a: any;
  b: any;
  operator: "==" | "!=" | "<" | "<=" | ">" | ">=" | "contains";
}

interface IfActionOutput {
  a: any;
  b: any;
  operator: string;
  result: boolean;
}

export class IfAction extends BaseAction<IfActionConfig, IfActionOutput> {
  constructor() {
    super(definition);
  }

  private performComparison(a: any, b: any, operator: string): boolean {
    const valueA = this.parseValue(a);
    const valueB = this.parseValue(b);
    switch (operator) {
      case "==":
        return valueA == valueB;
      case "!=":
        return valueA != valueB;
      case "<":
        return Number(valueA) < Number(valueB);
      case "<=":
        return Number(valueA) <= Number(valueB);
      case ">":
        return Number(valueA) > Number(valueB);
      case ">=":
        return Number(valueA) >= Number(valueB);
      case "contains":
        return String(valueA)
          .toLowerCase()
          .includes(String(valueB).toLowerCase());
      default:
        return false;
    }
  }

  private parseValue(value: any): any {
    if (typeof value === "string") {
      const num = Number(value);
      if (!isNaN(num) && value.trim() !== "") return num;
      if (value.toLowerCase() === "true") return true;
      if (value.toLowerCase() === "false") return false;
    }
    return value;
  }

  async execute(
    config: IfActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data: IfActionOutput, outputHandle?: string) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    try {
      const result = this.performComparison(
        config.a,
        config.b,
        config.operator,
      );
      onSuccess(
        { a: config.a, b: config.b, operator: config.operator, result },
        result ? "true" : "false",
      );
    } catch (error) {
      onError(new Error(`Comparison failed: ${error}`));
    }
  }
}
