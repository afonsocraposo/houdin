# Houdin Project Overview

## What This Project Is

Houdin is a Manifest V3 browser extension for visual browser automation.

Users define workflows made of:

- trigger nodes that decide when a workflow starts
- action nodes that perform work in the page, background worker, or network layer
- connections that route outputs from one node into the next

The product has two main user-facing surfaces:

- the popup for quick workflow access and execution history
- the configuration app for workflow design, credentials, history, and account-linked features

## High-Level Runtime Model

The extension is split across the standard browser-extension contexts:

1. `src/background/background.ts`
   Runs the service worker. It boots storage, migrations, sync, API proxying, and the background workflow engine.

2. `src/content/content.ts`
   Runs on matched pages. It exposes readiness checks, initializes triggers/actions on demand, injects UI into the page, and bridges execution messages back to the background worker.

3. `src/popup/*`
   Implements the browser action popup. It shows active workflows for the current page, opens the configuration app, launches the element inspector, and shows execution history.

4. `src/config/*`
   Implements the full configuration UI. This is where workflows are created, edited, validated, deleted, restored, exported, and synced.

## Core Workflow Data Model

The central model lives in `src/types/workflow.ts`.

- `WorkflowDefinition`
  A saved workflow with `id`, `name`, `urlPattern`, `nodes`, `connections`, `enabled`, optional environment `variables`, and timestamps.

- `WorkflowNode`
  A graph node with `type: "trigger" | "action"`, positioning data for the editor, and typed node data.

- `WorkflowConnection`
  A directed edge from one node to another, optionally through named handles.

- `WorkflowExecution`
  A persisted execution record used for history and debugging.

At runtime, node outputs are collected in `ExecutionContext` (`src/services/workflow/executionContext.ts`). It stores outputs by node id and interpolates strings using Liquid templates with three namespaces:

- direct node outputs
- `env` for workflow variables
- `meta` for execution metadata

## How Execution Works

### 1. Background startup

`src/background/background.ts` does the main boot sequence:

- initializes `StorageServer`
- runs storage migrations
- starts `WorkflowSyncer`
- starts the API background fetch proxy
- creates `BackgroundWorkflowEngine`
- listens for top-level navigation completions and trigger events

It also rewrites `https://houdin.config` to the extension's config page so users can open the UI from the address bar.

### 2. Matching workflows to a page

When a top-level page finishes loading, `BackgroundWorkflowEngine.onNewUrl()` (`src/services/backgroundEngine.ts`) runs.

It:

- loads enabled workflows from the persisted Zustand store
- filters them by `urlPattern`
- waits for the content script to report readiness
- finds trigger nodes in each matching workflow
- sends an `INIT_TRIGGER` command for each trigger node to the content script

### 3. Content script lazy initialization

`src/content/content.ts` starts in a minimal mode first.

On the first readiness check from the background worker, it performs full initialization:

- creates the page UI injector
- registers built-in triggers
- registers built-in actions
- registers credential types
- installs message bridges for notifications, workflow execution, and custom script responses

This keeps the content script light until a workflow actually needs to run.

### 4. Trigger setup and firing

Triggers are managed by `TriggerRegistry` (`src/services/triggerRegistry.ts`) and registered in `src/services/triggerInitializer.ts`.

Built-in triggers include:

- page load
- component load
- delay
- key press
- HTTP request listener bridge
- button click
- popup click

When a trigger fires in the content script, it sends `TRIGGER_FIRED` back to the background worker with:

- workflow id
- trigger node id
- page URL
- trigger output data
- trigger setup config
- elapsed setup duration

### 5. Workflow execution

The background worker creates a `WorkflowExecutor` (`src/services/workflow/workflow.ts`) for each trigger event.

The executor:

- creates an execution id and execution context
- records execution state through `ExecutionTracker`
- stores the trigger output in the context
- finds connected action nodes
- executes downstream actions and records per-node results

Action configuration strings are interpolated before execution, so actions can consume earlier outputs and workflow variables.

### 6. Action execution

Actions are managed by `ActionRegistry` (`src/services/actionRegistry.ts`).

There are two execution modes:

- content-script actions, sent to the page through `EXECUTE_ACTION`
- background actions, executed directly in the service worker

The background set is registered in `src/services/backgroundActionInitializer.ts`. The content set is registered in `src/services/actionInitializer.ts`.

Representative actions include:

- DOM interaction: click, type, input, fill form, remove element
- data extraction: copy content, get element content
- browser state: cookies, local storage, session storage, clipboard
- control flow: wait, if, create variable, navigate URL
- UI injection: modal, notification, component, style
- integration: HTTP request, OpenAI-backed action, custom script

Each action type provides:

- metadata for UI rendering
- a config schema for validation
- default values
- an execution implementation
- an example output payload

## UI Architecture

### Popup

`src/popup/App.tsx` is a compact control surface.

It:

- loads the active tab URL
- shows workflows relevant to the current page
- opens the config app in a new tab
- starts the element selector content script helper
- shows recent execution history

### Configuration app

`src/config/ConfigApp.tsx` and `src/config/ConfigInterface.tsx` host the main product UI.

Main tabs:

- Workflows
- Credentials
- History
- Trash

The workflow editor is in `src/config/designer/*` and is built around React Flow. `WorkflowDesigner.tsx` owns editor state, schema validation, node selection, undo/redo history, save/export behavior, and workflow-level properties such as URL pattern and variables.

## Page UI Injection

`ContentInjector` (`src/services/injector.ts`) mounts a React root inside a Shadow DOM host attached to the page. This isolates Mantine-based injected UI from the host page's CSS.

Injected workflow UI such as modals and notifications is coordinated through the dispatcher mounted at `mantine-injector-root`.

## State, Storage, and History

There are two main persistence layers:

### Zustand stores

`src/store/index.ts` defines:

- `useStore`
  Persisted in browser local storage. Holds workflows, credential records, and sync state.

- `useSessionStore`
  Persisted in session storage. Holds account/session information used by the config UI.

Workflow edits are tracked with:

- `pendingUpdates`
- `pendingDeletes`
- `lastServerTime`

These are used by the sync engine.

### Storage service

`src/services/storage.ts` wraps browser storage access and provides:

- generic get/set/remove operations
- pub-sub style notifications for storage changes
- workflow execution history storage
- session execution stats
- sync lock helpers

Execution history is capped to `MAX_EXECUTIONS_HISTORY = 50`.

## Sync and Account Features

Remote sync is handled by `WorkflowSyncer` (`src/services/workflowSyncer.ts`).

Behavior:

- checks the current account through `ApiClient.getAccount()`
- only enables sync for non-free plans
- periodically syncs every 15 minutes via browser alarms
- pulls updated and deleted workflows from the server
- pushes local pending updates and deletes
- keeps server and local state merged by `modifiedAt` and tombstone timestamps

The API client in `src/api/client.ts` also exposes:

- account lookup
- trash listing / restore / permanent delete
- workflow pull/push
- generic server-side actions

`ApiClient.startBackgroundProxy()` installs a `PROXY_FETCH` message endpoint so extension contexts can route authenticated or otherwise restricted fetches through the background worker.

## Credentials

Credential types are registered through `CredentialRegistry` and `initializeCredentials()`.

Built-in credential types:

- OpenAI
- HTTP
- Secret

Actions can look up saved credentials from the persisted store and convert them into auth material through the registry.

## Element Inspector

`src/content/elementSelector.ts` provides the element-inspection tool launched from the popup.

It:

- highlights hovered elements
- generates a CSS selector for the clicked element
- dispatches the selection back into the app through a window event

This is used to help users author selector-based workflow actions and triggers.

## Extensibility Model

The project is intentionally registry-driven.

To add a new feature class:

1. Add a new action, trigger, or credential class implementing the corresponding base type in `src/types/`.
2. Define metadata, config schema, validation, and runtime behavior.
3. Register it in the appropriate initializer.
4. The designer and static asset views can then discover it through the registry metadata.

This means most feature growth happens by adding one self-contained implementation file plus a single registration line.

## Test Coverage Shape

The repository currently contains Playwright-based extension tests in `tests/` plus a type-check based default `npm test` script.

The existing tests cover extension loading and several workflow scenarios, but the core orchestration path still relies heavily on integration behavior across background, content-script, and browser APIs.

## Key Directories

- `src/background/`: service worker entry point
- `src/content/`: page-side execution and element selection
- `src/config/`: full management UI and workflow designer
- `src/popup/`: compact popup UI
- `src/services/`: execution engine, registries, sync, storage, integrations
- `src/store/`: persisted Zustand state
- `src/types/`: shared contracts for workflows, actions, triggers, storage, and messages
- `src/api/`: remote API client and schemas
- `tests/`: Playwright-based extension tests

## Review Notes

During review, a few architectural risks stood out:

- trigger setup appears to accumulate listeners over time because there is no central teardown path for most triggers
- action timeouts do not cancel underlying work, so side effects may continue after a workflow is marked failed
- workflow branching is launched concurrently even though some comments imply sequential error propagation
- `StorageServer.get()` currently converts valid falsy values such as `false`, `0`, and `""` to `null`
- `STRUCTURE.md` is stale and no longer reflects the current code layout or terminology

Those issues do not change the overall architecture above, but they are worth addressing before treating this implementation as fully production-hardened.
