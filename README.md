# Houdin

[![Release](https://github.com/afonsocraposo/houdin/actions/workflows/release.yml/badge.svg)](https://github.com/afonsocraposo/houdin/actions/workflows/release.yml)

> Browser automation that feels like magic ✨

Houdin is a powerful browser extension that enables visual workflow automation for web browsers. Create sophisticated automation workflows using a drag-and-drop interface, inject custom code, and automate repetitive tasks across any website.

## 🚀 Features

### Core Automation

- **Visual Workflow Designer**: Drag-and-drop interface for creating complex automation workflows
- **Element Interaction**: Click, type, and interact with web page elements
- **Smart Element Selection**: Built-in element selector with CSS/XPath support
- **Form Automation**: Automated form filling and submission
- **HTTP Requests**: Make API calls and handle responses within workflows

### Advanced Capabilities

- **Custom Scripts**: Execute JavaScript code with full page context
- **LLM Integration**: OpenAI integration for AI-powered automation
- **Modal & Notifications**: Display custom UI components on web pages
- **Style Injection**: Dynamically modify page appearance
- **Wait Conditions**: Smart waiting for page changes and elements

### Developer Experience

- **TypeScript**: Full type safety and IntelliSense support
- **React + Mantine**: Modern UI components and design system
- **Hot Reload**: Fast development with Vite
- **Cross-Browser**: Works on Chrome, Firefox, and Edge
- **Execution History**: Track and debug workflow runs

## 📦 Installation

### Development Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd houdin
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

4. **Load extension in browser**
   - Chrome: Go to `chrome://extensions/`, enable Developer mode, click "Load unpacked"
   - Firefox: Go to `about:debugging`, click "This Firefox", click "Load Temporary Add-on"

### Building for Production

```bash
npm run build
```

The built extension will be in the `dist/` directory.

## 🎯 Available Actions

- **Click Element**: Simulate clicks on page elements
- **Type Text**: Input text into form fields
- **Copy Content**: Extract text content from elements
- **Navigate URL**: Navigate to different pages
- **HTTP Request**: Make API calls with credential support
- **Custom Script**: Execute arbitrary JavaScript code
- **Form Actions**: Complex form interactions and submissions
- **Wait Actions**: Wait for page changes or time delays
- **Modal & Notifications**: Display custom UI overlays
- **Style & Component Injection**: Modify page appearance

## 🔧 Available Triggers

- **Page Load**: Execute when a page finishes loading
- **Button Click**: Respond to clicks on specific elements
- **Key Press**: Trigger on keyboard shortcuts
- **Component Load**: Execute when elements appear on the page
- **HTTP Request**: Listen for specific network requests
- **Delay**: Time-based triggers

## 🛠 Development Scripts

- `npm run dev` - Start development server with hot reload
- `npm run dev-firefox` - Build for Firefox with watch mode
- `npm run build` - Build for production (TypeScript + Vite)
- `npm run type-check` - Run TypeScript type checking
- `npm run preview` - Preview production build locally

## 🏗 Architecture

```
src/
├── background/         # Service worker and background scripts
├── content/           # Content scripts injected into web pages
├── popup/            # Extension popup interface
├── config/           # Configuration pages and workflow designer
├── components/       # Reusable React components
├── services/         # Core automation services
│   ├── actions/      # Workflow action implementations
│   ├── triggers/     # Workflow trigger implementations
│   └── credentials/  # Credential management
├── types/           # TypeScript type definitions
└── utils/           # Utility functions and helpers
```

## 🔑 Credentials & Security

Houdin supports secure credential storage for:

- **HTTP Authentication**: Store API keys and authentication tokens
- **OpenAI Integration**: Securely store OpenAI API keys
- **Custom Secrets**: Store any sensitive configuration data

All credentials are encrypted and stored locally in the browser's extension storage.

## 📝 License

This project is licensed under the **PolyForm Noncommercial License 1.0.0**.

### License Summary

- ✅ **Free for noncommercial use**: Personal projects, research, education, nonprofits, government
- ✅ **Modify and share**: You can make changes and derivatives (must include license)
- ❌ **No commercial use**: Cannot sell, use in paid products/services, or for profit
- ❌ **No sublicensing**: Cannot transfer or sublicense the rights
- ⚠️ **No warranty**: Software provided "as is" with no guarantees

For commercial licensing options, please contact the project maintainers.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Documentation

- **Workflow Designer**: Visual interface for creating automation workflows
- **Action Registry**: Extensible system for adding new automation actions
- **Trigger System**: Event-driven workflow execution
- **Credential Management**: Secure storage for API keys and secrets
- **Element Selection**: Advanced CSS/XPath selector tools

## 🐛 Issues & Support

If you encounter any issues or have questions:

1. Check existing issues in the repository
2. Create a new issue with detailed reproduction steps
3. Include browser version and extension logs if applicable

---

**Version**: 3.3.0
**Browser Compatibility**: Chrome, Firefox, Edge (Manifest V3)
