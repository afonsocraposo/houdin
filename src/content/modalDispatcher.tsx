/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRoot } from "react-dom/client";
import App from "./modalDispacherApp";
/* eslint-disable-next-line import/no-unresolved */
// import mantineStyles from "@mantine/core/styles.css?inline";
import { createTheme, MantineProvider } from "@mantine/core";

const injectReact = (rootId: string): void => {
  try {
    const body = document.querySelector("body");
    if (!body) throw new Error("Body element not found.");

    const app = document.createElement("div");
    app.id = rootId;

    // Attach a Shadow Root
    const shadowRoot = app.attachShadow({ mode: "closed" });

    // Append the app container to the body
    body.append(app);

    // Create a container for React to mount
    const appElement = document.createElement("div");
    appElement.setAttribute("id", "app");
    shadowRoot.appendChild(appElement);

    // Inject Mantine styles into the Shadow DOM
    const mantineStyleTag = document.createElement("style");
    // mantineStyleTag.textContent = mantineStyles;
    shadowRoot.appendChild(mantineStyleTag);

    // Create a React root and render the app
    const root = createRoot(appElement);
    root.render(
      <MantineProvider
        defaultColorScheme="auto"
        cssVariablesSelector="#app"
        getRootElement={() => appElement}
        theme={createTheme({
          components: {
            Portal: {
              // Property 'extend' does not exist on type 'ForwardRefExoticComponent<PortalProps & RefAttributes<HTMLDivElement>>'.
              defaultProps: {
                target: appElement,
              },
            },
          },
        })}
      >
        <App />
      </MantineProvider>,
    );
    console.debug("Modal dispatcher injected successfully.");
  } catch (error) {
    console.error("Error Injecting React:", error);
  }
};

injectReact("modal-dispatcher-root");
