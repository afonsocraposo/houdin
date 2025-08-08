# Agent Development Guidelines

## Build Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production (runs TypeScript compilation + Vite build). You should never run this code unless you are asked to do so.
- `npm run type-check` - Run TypeScript type checking without emitting files
- `npm run preview` - Preview production build locally

## Code Style Guidelines

### TypeScript & Types

- Use strict TypeScript configuration with `noUnusedLocals` and `noUnusedParameters`
- Define explicit interfaces for all data structures (see `src/types/`)
- Use proper generic types and avoid `any` except in `data` fields
- Export interfaces with clear naming conventions

### Imports & Structure

- Group imports: React first, then external libraries, then internal modules
- Use named exports for components and utilities
- Follow the established directory structure: `components/`, `services/`, `types/`

### Naming Conventions

- Components: PascalCase with descriptive names (e.g., `WorkflowDesigner`)
- Interfaces: PascalCase with descriptive names (e.g., `WorkflowDefinition`)
- Files: camelCase for utilities, PascalCase for components
- Variables: camelCase with descriptive names

### React Components

- Use functional components with TypeScript interfaces for props
- Destructure props in function parameters
- Use proper React hooks pattern with clear state management
