# changeme Extension - Project Structure

## 📁 Directory Organization

```
src/
├── types/                    # Shared TypeScript interfaces and types
│   └── index.ts             # Recipe, ExtensionStorage, and other core types
│
├── utils/                   # Utility functions and helpers
│   └── helpers.ts           # URL matching, clipboard, notifications, ID generation
│
├── services/                # Core business logic services
│   ├── storage.ts           # Chrome storage management (singleton)
│   ├── workflow.ts          # Workflow execution logic
│   └── injector.ts          # Content injection orchestration
│
├── components/              # Reusable UI and DOM components
│   ├── Modal.ts             # Modal creation and management
│   └── ComponentFactory.ts  # Dynamic component creation
│
├── pages/                   # Extension pages and their specific logic
│   └── config/
│       └── recipeHelpers.ts # Recipe form helpers and default recipes
│
├── popup/                   # Extension popup (currently minimal)
│   ├── index.html
│   ├── popup.tsx
│   └── App.tsx
│
├── config/                  # Configuration page
│   ├── index.html
│   ├── config.tsx
│   └── ConfigApp.tsx        # Main config interface
│
├── content/                 # Content script entry point
│   └── content.ts           # Initializes ContentInjector
│
├── background/              # Background script
│   └── background.ts        # Extension lifecycle and URL routing
│
├── manifest.json            # Development manifest (with CSP for hot reload)
└── manifest.prod.json       # Production manifest (strict security)
```

## 🏗️ Architecture Overview

### **Service Layer**

- **StorageManager**: Handles Chrome storage operations (singleton pattern)
- **WorkflowExecutor**: Executes different workflow types (copy, modal, navigate, custom)
- **ContentInjector**: Orchestrates component injection and lifecycle management

### **Component Layer**

- **ComponentFactory**: Creates DOM elements based on recipe configuration
- **Modal**: Handles modal creation and user interaction

### **Utility Layer**

- **helpers.ts**: Pure utility functions for common operations
- **types/index.ts**: Centralized type definitions

### **Page Layer**

- **ConfigApp**: Main configuration interface with recipe management
- **recipeHelpers**: Recipe-specific business logic and default configurations

## 🔄 Data Flow

1. **Config Page** → **StorageManager** → Chrome Storage
2. **Chrome Storage** → **ContentInjector** → **ComponentFactory** → DOM
3. **Component Click** → **WorkflowExecutor** → Action (copy/modal/navigate/custom)

## 🎯 Key Benefits

- **Separation of Concerns**: Each file has a single responsibility
- **Reusability**: Services and components can be easily reused
- **Maintainability**: Clear structure makes it easy to find and modify code
- **Testability**: Services are isolated and can be unit tested
- **Scalability**: Easy to add new features without affecting existing code

## 🔧 Development Workflow

- **Hot Reload**: `npm run dev` uses development manifest with relaxed CSP
- **Production Build**: `npm run build` uses production manifest with strict security
- **Type Safety**: TypeScript ensures type safety across all modules
- **Storage Management**: Centralized storage operations with automatic sync
