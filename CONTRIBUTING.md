# Contributing to Houdin

Thank you for your interest in contributing to Houdin! This guide will help you understand how to extend the automation capabilities by adding new actions, triggers, and other components.

## 🚀 Getting Started

### Development Setup

1. **Clone and Install**

   ```bash
   git clone <repository-url>
   cd houdin
   npm install
   ```

2. **Start Development**

   ```bash
   npm run dev # chrome
   npm run dev:firefox # firefox
   ```

3. **Load Extension**
   - Chrome: `chrome://extensions/` → Enable Developer mode → Load unpacked
   - Firefox: `about:debugging` → This Firefox → Load Temporary Add-on

## 📚 Architecture Overview

Houdin uses a modular architecture with these key components:

```
src/
├── services/
│   ├── actions/           # Workflow action implementations
│   ├── triggers/          # Workflow trigger implementations
│   ├── credentials/       # Credential management
│   ├── actionRegistry.ts  # Action registration system
│   └── triggerRegistry.ts # Trigger registration system
├── types/
│   ├── actions.ts         # Action type definitions
│   ├── triggers.ts        # Trigger type definitions
│   ├── base.ts           # Base classes and interfaces
│   └── config-properties.ts # Configuration schema system
└── components/           # React UI components
```

## 🔧 Adding New Actions

Actions are the building blocks that perform operations in workflows. Follow these steps to create a new action:

### 1. Create the Action Class

Create a new file in `src/services/actions/` (e.g., `myCustomAction.ts`):

```typescript
import { BaseAction, ActionMetadata } from "@/types/actions";
import { textProperty, selectProperty } from "@/types/config-properties";
import { IconStar } from "@tabler/icons-react";

// Define the configuration interface
interface MyCustomActionConfig {
  message: string;
  type: "info" | "warning" | "error";
}

// Define the output interface
interface MyCustomActionOutput {
  result: string;
  timestamp: number;
}

export class MyCustomAction extends BaseAction<
  MyCustomActionConfig,
  MyCustomActionOutput
> {
  // Action metadata for UI display
  static readonly metadata: ActionMetadata = {
    type: "my-custom-action",
    label: "My Custom Action",
    icon: IconStar,
    description: "A custom action that demonstrates the pattern",
  };

  // Configuration schema defines the UI form
  readonly configSchema = {
    properties: {
      message: textProperty({
        label: "Message",
        placeholder: "Enter your message",
        description: "The message to process",
        required: true,
        defaultValue: "Hello World",
      }),
      type: selectProperty({
        label: "Message Type",
        options: [
          { label: "Information", value: "info" },
          { label: "Warning", value: "warning" },
          { label: "Error", value: "error" },
        ],
        defaultValue: "info",
        description: "Type of message",
        required: true,
      }),
    },
  };

  // Example output for UI preview
  readonly outputExample = {
    result: "Processed: Hello World",
    timestamp: Date.now(),
  };

  // Main execution method
  async execute(
    config: MyCustomActionConfig,
    workflowId: string,
    nodeId: string,
    onSuccess: (data: MyCustomActionOutput) => void,
    onError: (error: Error) => void,
    tabId?: number,
  ): Promise<void> {
    try {
      // Your action logic here
      const result = `Processed: ${config.message} (${config.type})`;

      // Call onSuccess with the result
      onSuccess({
        result,
        timestamp: Date.now(),
      });
    } catch (error) {
      // Call onError if something goes wrong
      onError(error as Error);
    }
  }
}
```

### 2. Register the Action

Add your action to `src/services/actionInitializer.ts`:

```typescript
import { MyCustomAction } from "./actions/myCustomAction";

export function initializeActions(): void {
  const registry = ActionRegistry.getInstance();

  // Add your action to the list
  registry.register(MyCustomAction);
  // ... other actions
}
```

If your action should run on the background script, **also** add it to `initializeBackgroundActions`:

```typescript
import { MyCustomAction } from "./actions/myCustomAction";

export function initializeBackgroundActions(): void {
  const registry = ActionRegistry.getInstance();

  // Add your background action to the list
  registry.registerBackgroundAction(MyCustomAction);
  // ... other background actions
}
```

### 3. Action Configuration Properties

Use these property types for your configuration schema:

```typescript
import {
  textProperty,
  passwordProperty,
  textareaProperty,
  selectProperty,
  numberProperty,
  booleanProperty,
  colorProperty,
  codeProperty,
  customProperty,
  credentialsProperty,
} from "@/types/config-properties";

// Examples:
textProperty({
  label: "Text Input",
  placeholder: "Enter text...",
  required: true,
  defaultValue: "default",
});

selectProperty({
  label: "Choose Option",
  options: [
    { label: "Option 1", value: "opt1" },
    { label: "Option 2", value: "opt2" },
  ],
  defaultValue: "opt1",
});

numberProperty({
  label: "Number Input",
  min: 0,
  max: 100,
  step: 1,
  defaultValue: 50,
});

booleanProperty({
  label: "Enable Feature",
  defaultValue: false,
});

credentialsProperty({
  label: "API Credentials",
  credentialType: "openai", // matches credential type
});
```

## 🎯 Adding New Triggers

Triggers start workflows based on events. Here's how to create one:

### 1. Create the Trigger Class

Create a new file in `src/services/triggers/` (e.g., `myCustomTrigger.ts`):

```typescript
import { BaseTrigger, TriggerMetadata } from "@/types/triggers";
import { textProperty, numberProperty } from "@/types/config-properties";
import { IconBolt } from "@tabler/icons-react";

interface MyCustomTriggerConfig {
  selector: string;
  delay: number;
}

interface MyCustomTriggerOutput {
  element: string;
  timestamp: number;
}

export class MyCustomTrigger extends BaseTrigger<
  MyCustomTriggerConfig,
  MyCustomTriggerOutput
> {
  static readonly metadata: TriggerMetadata = {
    type: "my-custom-trigger",
    label: "My Custom Trigger",
    icon: IconBolt,
    description: "Triggers when custom conditions are met",
  };

  readonly configSchema = {
    properties: {
      selector: textProperty({
        label: "Element Selector",
        placeholder: ".my-element",
        required: true,
        defaultValue: "body",
      }),
      delay: numberProperty({
        label: "Delay (ms)",
        min: 0,
        defaultValue: 1000,
      }),
    },
  };

  readonly outputExample = {
    element: "<div>Example element</div>",
    timestamp: Date.now(),
  };

  async setup(
    config: MyCustomTriggerConfig,
    workflowId: string,
    nodeId: string,
    onTrigger: (data?: MyCustomTriggerOutput) => Promise<void>,
  ): Promise<void> {
    // Setup your trigger logic
    const handleEvent = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.matches(config.selector)) {
        onTrigger({
          element: target.outerHTML,
          timestamp: Date.now(),
        });
      }
    };

    // Add event listeners
    document.addEventListener("click", handleEvent);

    // Return cleanup function if needed
    // The base class will handle cleanup automatically
  }
}
```

### 2. Register the Trigger

Add your trigger to `src/services/triggerInitializer.ts`:

```typescript
import { MyCustomTrigger } from "./triggers/myCustomTrigger";

export function initializeTriggers(): void {
  const registry = TriggerRegistry.getInstance();
  registry.register(MyCustomTrigger);
  // ... other triggers
}
```

## 🔐 Adding New Credentials

For actions that need authentication, create credential types:

### 1. Create the Credential Class

Create a new file in `src/services/credentials/` (e.g., `myApiCredential.ts`):

```typescript
import { BaseCredential, CredentialMetadata } from "@/types/credentials";
import { textProperty, passwordProperty } from "@/types/config-properties";

interface MyApiCredentialConfig {
  apiKey: string;
  baseUrl: string;
}

export class MyApiCredential extends BaseCredential<MyApiCredentialConfig> {
  static readonly metadata: CredentialMetadata = {
    type: "my-api",
    label: "My API",
    icon: "🔑",
    description: "Credentials for My API service",
  };

  readonly configSchema = {
    properties: {
      apiKey: passwordProperty({
        label: "API Key",
        placeholder: "sk-...",
        required: true,
      }),
      baseUrl: textProperty({
        label: "Base URL",
        placeholder: "https://api.example.com",
        defaultValue: "https://api.example.com",
        required: true,
      }),
    },
  };

  async validate(config: MyApiCredentialConfig): Promise<boolean> {
    try {
      // Test the credentials
      const response = await fetch(`${config.baseUrl}/health`, {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

### 2. Register the Credential

Add your credential to `src/services/credentialInitializer.ts`:

```typescript
import { MyApiCredential } from "./credentials/myApiCredential";

export function initializeCredentials(): void {
  const registry = CredentialRegistry.getInstance();
  registry.register(MyApiCredential);
  // ... other credentials
}
```

## 📋 Code Style Guidelines

### TypeScript Standards

- Use strict TypeScript with explicit interfaces
- Export interfaces with clear naming conventions
- Avoid `any` except in `data` fields where flexibility is needed
- Use proper generic types for reusable components

### React Components

- Use functional components with TypeScript interfaces for props
- Destructure props in function parameters
- Follow the existing Mantine UI component patterns
- Use proper React hooks pattern with clear state management

### Naming Conventions

- **Components**: PascalCase (e.g., `WorkflowDesigner`)
- **Files**: camelCase for utilities, PascalCase for components
- **Interfaces**: PascalCase with descriptive names (e.g., `WorkflowDefinition`)
- **Variables**: camelCase with descriptive names

## 🧪 Testing

### Type Checking

Always run type checking before submitting:

```bash
npm run type-check
```

### End-to-End Testing

Test your actions/triggers in the workflow designer:

```bash
npm run test:e2e
```

### Manual Testing

1. Build and load the extension
2. Create a test workflow using your new action/trigger
3. Execute the workflow and verify the behavior
4. Check the execution history for proper output

## 📝 Documentation

When adding new components:

1. **Add JSDoc comments** to your classes and methods
2. **Include output examples** that match real execution
3. **Document configuration properties** with clear descriptions

### Example Documentation

````typescript
/**
 * Custom action that processes messages with different severity levels.
 * Useful for logging and notification workflows.
 *
 * @example
 * ```typescript
 * const config = {
 *   message: "System alert",
 *   type: "warning"
 * };
 * ```
 */
export class MyCustomAction extends BaseAction<
  MyCustomActionConfig,
  MyCustomActionOutput
> {
  // ...
}
````

## 🔍 Common Patterns

### Element Selection

Use the helper utility for consistent element selection:

```typescript
import { getElement } from "@/utils/helpers";

// In your action/trigger
const element = getElement(config.selector, config.selectorType);
if (!element) {
  onError(new Error(`Element not found: ${config.selector}`));
  return;
}
```

### Async Operations

Handle promises properly in actions:

```typescript
async execute(config, workflowId, nodeId, onSuccess, onError) {
  try {
    const result = await someAsyncOperation(config);
    onSuccess({ result });
  } catch (error) {
    onError(error);
  }
}
```

## 🚀 Pull Request Process

1. **Fork** the repository
2. **Create a feature branch**: `git checkout -b feature/my-new-action`
3. **Follow the coding standards** outlined above
4. **Test thoroughly** with the type checker and manual testing
5. **Write clear commit messages**: `Add new webhook trigger action`
6. **Submit a pull request** with a clear description

## 🐛 Debugging Tips

### Common Issues

1. **Action not appearing in UI**: Check registration in `actionInitializer.ts`
2. **Type errors**: Ensure config interfaces match schema properties
3. **Runtime errors**: Check browser console and background script console
4. **Trigger not firing**: Verify event listeners and selectors

## 📞 Getting Help

- **GitHub Issues**: Report bugs and request features
- **Code Review**: Submit draft PRs for feedback
- **Architecture Questions**: Open discussions for design decisions

---

Thank you for contributing to Houdin! Your extensions help make browser automation more powerful and accessible. 🎩✨
