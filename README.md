# changeme Browser Extension

A cross-browser extension built with TypeScript, React, Mantine UI, and Vite with hot reload support.

## Features

- 🌐 Cross-browser compatibility (Chrome, Firefox, Edge)
- ⚡ Hot reload development with Vite
- 🎨 Beautiful UI components with Mantine
- 📦 TypeScript for type safety
- 🔧 Modern development setup

## Development

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Load the extension in your browser:
   - **Chrome**: Go to `chrome://extensions/`, enable Developer mode, click "Load unpacked" and select the `dist` folder
   - **Firefox**: Go to `about:debugging`, click "This Firefox", click "Load Temporary Add-on" and select the manifest.json from the `dist` folder

## Build

```bash
npm run build
```

## Project Structure

```
src/
├── manifest.json          # Extension manifest
├── popup/                 # Extension popup
│   ├── index.html
│   ├── popup.tsx
│   └── App.tsx
├── background/            # Background script
│   └── background.ts
└── content/              # Content script
    └── content.ts
```
