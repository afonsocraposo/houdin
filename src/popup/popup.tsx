import React from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import App from "./App";
import { mantineTheme } from "@/theme";
import {
  CodeHighlightAdapterProvider,
  createHighlightJsAdapter,
} from "@mantine/code-highlight";
import hljs from "highlight.js/lib/core";
import "@/style.css";

import jsonLang from "highlight.js/lib/languages/json";

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
          <App />
        </CodeHighlightAdapterProvider>
      </MantineProvider>
    </React.StrictMode>,
  );
}
