import { WorkflowDefinition } from "@/types/workflow";
import * as examples from "@/examples";

export class ExampleService {
  private examples: WorkflowDefinition[];

  constructor() {
    this.examples = [
      examples.welcomeMessage,
      examples.formFiller,
      examples.contentExtractor,
      examples.askChatGPT,
      examples.summarizeNews,
    ];
  }

  getExamples(): WorkflowDefinition[] {
    return this.examples.sort((a, b) => a.name.localeCompare(b.name));
  }

  getExampleById(id: string): WorkflowDefinition | undefined {
    return this.examples.find((example) => example.id === id);
  }
}
