import React from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import App from "./App";
import { mantineTheme } from "@/theme";
import "@/style.css";

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <MantineProvider defaultColorScheme="auto" theme={mantineTheme}>
        <App />
      </MantineProvider>
    </React.StrictMode>,
  );
}
