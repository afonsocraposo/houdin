import { ExecutionMetadata, WorkflowExecutionContext } from "@/types/workflow";

export class ExecutionContext implements WorkflowExecutionContext {
  public outputs: Record<string, any>;
  constructor(
    public metadata: ExecutionMetadata,
    public readonly env: Record<string, string> = {},
  ) {
    this.outputs = {};
  }

  setOutput(nodeId: string, value: any): void {
    this.outputs[nodeId] = value;
  }

  getOutput(nodeId: string): any {
    return this.outputs[nodeId];
  }

  getMetadata(key: keyof ExecutionMetadata): any {
    return this.metadata[key];
  }

  getEnv(key: string): string | undefined {
    return this.env[key];
  }

  interpolateVariables(text: string): string {
    if (!text) return text;

    // Replace variables in format {{nodeId}} or {{nodeId.property}}
    return text.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
      if (expression.startsWith("env.")) {
        const envKey = expression.slice(4).trim();
        return this.getEnv(envKey) || match;
      } else if (expression.startsWith("meta.")) {
        const metaKey = expression.slice(5).trim() as keyof ExecutionMetadata;
        return this.getMetadata(metaKey) || match;
      } else {
        return this.interpolateOutputVariables(match, expression);
      }
    });
  }

  private interpolateOutputVariables(
    match: string,
    expression: string,
  ): string {
    const parts = expression.trim().split(".");
    const nodeId = parts[0];
    const properties = parts.slice(1);

    const output = this.getOutput(nodeId);
    if (output === undefined) return match; // Keep original if not found

    let result = output;
    let i = 0;
    while (
      i < properties.length &&
      typeof output === "object" &&
      output !== null
    ) {
      const property = properties[i];
      if (!(property in result)) {
        break;
      }
      result = result[property];
      i++;
    }

    if (result && typeof result === "object") {
      // If result is an object, convert to JSON string for display
      return JSON.stringify(result, null, 2);
    }
    return String(result);
  }
}
