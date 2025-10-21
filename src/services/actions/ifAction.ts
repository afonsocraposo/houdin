import { BaseAction, ActionMetadata } from "@/types/actions";
import { selectProperty, textProperty } from "@/types/config-properties";
import { IconGitBranch } from "@tabler/icons-react";

interface IfActionConfig {
  a: any; // Left operand
  b: any; // Right operand
  operator: "==" | "!=" | "<" | "<=" | ">" | ">=" | "contains"; // Comparison operator
}

interface IfActionOutput {
  a: any;
  b: any;
  operator: string;
  result: boolean;
}

export class IfAction extends BaseAction<IfActionConfig, IfActionOutput> {
  static readonly metadata: ActionMetadata = {
    type: "if",
    label: "If Comparison",
    description:
      "Perform a comparison between two values with true/false outputs",
    icon: IconGitBranch,
    outputs: new Set(["true", "false"]),
  };

  readonly configSchema = {
    properties: {
      a: textProperty({
        label: "Left Operand (A)",
        placeholder: "Enter left operand",
        description: "The left operand for comparison",
        required: true,
      }),
      operator: selectProperty({
        label: "Operator",
        options: ["==", "!=", "<", "<=", ">", ">=", "contains"],
        defaultValue: "==",
        description: "Comparison operator",
        required: true,
      }),
      b: textProperty({
        label: "Right Operand (B)",
        placeholder: "Enter right operand",
        description: "The right operand for comparison",
        required: true,
      }),
    },
  };

  readonly outputExample = {
    a: "value1",
    b: "value2",
    operator: "==",
    result: true,
  };

  private performComparison(a: any, b: any, operator: string): boolean {
    // Convert values for comparison
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
      // Try to parse as number if it looks like one
      const num = Number(value);
      if (!isNaN(num) && value.trim() !== "") {
        return num;
      }
      // Try to parse as boolean
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
    const { a, b, operator } = config;

    try {
      // Perform the comparison
      const result = this.performComparison(a, b, operator);

      // Create output data
      const outputData: IfActionOutput = {
        a,
        b,
        operator,
        result,
      };

      // Determine which output handle to trigger
      const outputHandle = result ? "true" : "false";

      // Call success with the appropriate output handle
      onSuccess(outputData, outputHandle);
    } catch (error) {
      onError(new Error(`Comparison failed: ${error}`));
    }
  }
}
