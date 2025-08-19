import React from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { HashRouter } from "react-router-dom";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/code-highlight/styles.css";
import ConfigApp from "./ConfigApp";
import NotificationDispatcher from "../components/NotificationDispatcher";
import {
  CodeHighlightAdapterProvider,
  createHighlightJsAdapter,
} from "@mantine/code-highlight";
import hljs from "highlight.js/lib/core";
import "highlight.js/styles/github.css";

import jsonLang from "highlight.js/lib/languages/json";

hljs.registerLanguage("json", jsonLang);

const highlightJsAdapter = createHighlightJsAdapter(hljs);

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <MantineProvider>
        <CodeHighlightAdapterProvider adapter={highlightJsAdapter}>
          <HashRouter>
            <ConfigApp />
          </HashRouter>
          <NotificationDispatcher />
        </CodeHighlightAdapterProvider>
      </MantineProvider>
    </React.StrictMode>,
  );
}
