import React from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { HashRouter } from "react-router-dom";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/code-highlight/styles.css";
import ConfigApp from "./ConfigApp";
import { initializeActions } from "../services/actionInitializer";
import NotificationDispatcher from "../components/NotificationDispatcher";

// Initialize actions for the config/designer interface
initializeActions();

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
