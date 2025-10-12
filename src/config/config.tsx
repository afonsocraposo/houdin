import React from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { HashRouter } from "react-router-dom";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/code-highlight/styles.css";
import ConfigApp from "./ConfigApp";
import NotificationDispatcher from "@/components/NotificationDispatcher";
import {
  CodeHighlightAdapterProvider,
  createHighlightJsAdapter,
} from "@mantine/code-highlight";
import hljs from "highlight.js/lib/core";
import "@/style.css";

import jsonLang from "highlight.js/lib/languages/json";
import { mantineTheme } from "@/theme";
import mixpanel from "mixpanel-browser";

hljs.registerLanguage("json", jsonLang);

const highlightJsAdapter = createHighlightJsAdapter(hljs);

// Initialize Mixpanel only in production
if (import.meta.env.PROD) {
  // Create an instance of the Mixpanel object, your token is already added to this snippet
  mixpanel.init("98532deeb11a56194f96dca708d52821", {
    autocapture: true,
    record_sessions_percent: 100,
    api_host: "https://api-eu.mixpanel.com",
  });
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <MantineProvider defaultColorScheme="auto" theme={mantineTheme}>
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
