import { ExecutionMetadata, WorkflowExecutionContext } from "@/types/workflow";
import { Liquid } from "liquidjs";

export class ExecutionContext implements WorkflowExecutionContext {
  public outputs: Record<string, any>;
  private liquidEngine = new Liquid();
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

    return this.liquidEngine.parseAndRenderSync(text, {
      ...this.outputs,
      env: this.env,
      metadata: this.metadata,
    });
  }
}
