import { WorkflowDefinition } from "@/types/workflow";
import * as examples from "@/examples";

export class ExampleService {
  private examples: WorkflowDefinition[];

  constructor() {
    this.examples = [
      examples.welcomeMessage,
      examples.formFiller,
      examples.contentExtractor,
      examples.buttonClicker,
    ];
  }

  getExamples(): WorkflowDefinition[] {
    return this.examples;
  }

  getExampleById(id: string): WorkflowDefinition | undefined {
    return this.examples.find((example) => example.id === id);
  }
}
