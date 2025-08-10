import React from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { HashRouter } from "react-router-dom";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/code-highlight/styles.css";
import ConfigApp from "./ConfigApp";
import NotificationDispatcher from "../components/NotificationDispatcher";

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <MantineProvider>
        <HashRouter>
          <ConfigApp />
        </HashRouter>
        <NotificationDispatcher />
      </MantineProvider>
    </React.StrictMode>,
  );
}
