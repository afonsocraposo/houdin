import React from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/code-highlight/styles.css";
import NotificationDispatcher from "@/components/NotificationDispatcher";
import {
  CodeHighlightAdapterProvider,
  createHighlightJsAdapter,
} from "@mantine/code-highlight";
import hljs from "highlight.js/lib/core";
import "@/style.css";

import jsonLang from "highlight.js/lib/languages/json";
import { mantineTheme } from "@/theme";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";

hljs.registerLanguage("json", jsonLang);
hljs.registerLanguage("plaintext", () => ({
  name: "plaintext",
  contains: [],
}));

const highlightJsAdapter = createHighlightJsAdapter(hljs);

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <MantineProvider defaultColorScheme="auto" theme={mantineTheme}>
        <CodeHighlightAdapterProvider adapter={highlightJsAdapter}>
          <RouterProvider router={router} />
          <NotificationDispatcher />
        </CodeHighlightAdapterProvider>
      </MantineProvider>
    </React.StrictMode>,
  );
}
