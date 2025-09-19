import {
  createTheme,
  MantineProvider,
  mergeThemeOverrides,
} from "@mantine/core";
import mantineStyles from "@mantine/core/styles.css?inline";
import mantineNotificationsStyles from "@mantine/notifications/styles.css?inline";
import mantineCodeHighlightStyles from "@mantine/code-highlight/styles.css?inline";
import { mantineTheme } from "@/theme";

declare global {
  interface WindowEventMap {
    modalDispatch: CustomEvent;
    notificationDispatch: CustomEvent;
  }
}

export default function CustomMantineProvider({
  parent,
  children,
  coreOnly = false,
}: {
  parent: HTMLElement;
  children: React.ReactNode;
  coreOnly?: boolean;
}) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  const lightTheme = {
    colorScheme: "light",
    text: "#000000",
    body: "#ffffff",
    dimmed: "#868e96",
    default: "#f8f9fa",
    defaultHover: "#e9ecef",
  };

  const darkTheme = {
    colorScheme: "dark",
    text: "#c1c2c5",
    body: "#1a1b1e",
    dimmed: "#909296",
    default: "#25262b",
    defaultHover: "#2c2e33",
  };

  const currentTheme = prefersDark ? darkTheme : lightTheme;

  const remInPx = parseFloat(
    getComputedStyle(document.documentElement).fontSize,
  );
  const mantineScale = 16 / remInPx;

  return (
    <>
      <style type="text/css">
        {`
    :host, #app, * {
        --mantine-scale: ${mantineScale} !important;
      }

    #app {
      --mantine-color-scheme: ${currentTheme.colorScheme};
      --mantine-color-text: ${currentTheme.text};
      --mantine-color-body: ${currentTheme.body};
      --mantine-color-dimmed: ${currentTheme.dimmed};
      --mantine-color-default: ${currentTheme.default};
      --mantine-color-default-hover: ${currentTheme.defaultHover};
      --mantine-font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;
     /* Reset Mantine's font size variables */
    --mantine-font-size-xs: 0.75rem;
    --mantine-font-size-sm: 0.875rem;
    --mantine-font-size-md: 1rem;
    --mantine-font-size-lg: 1.125rem;
    --mantine-font-size-xl: 1.25rem;
      --mantine-line-height: 1.55;
      color: var(--mantine-color-text) !important;
      font-family: var(--mantine-font-family) !important;
      line-height: var(--mantine-line-height) !important;
    }

    /* Responsive to system theme changes */
    @media (prefers-color-scheme: light) {
      :host, #app {
        --mantine-color-scheme: light;
        --mantine-color-text: ${lightTheme.text};
        --mantine-color-body: ${lightTheme.body};
        --mantine-color-dimmed: ${lightTheme.dimmed};
        --mantine-color-default: ${lightTheme.default};
        --mantine-color-default-hover: ${lightTheme.defaultHover};
      }
    }

    @media (prefers-color-scheme: dark) {
      :host, #app {
        --mantine-color-scheme: dark;
        --mantine-color-text: ${darkTheme.text};
        --mantine-color-body: ${darkTheme.body};
        --mantine-color-dimmed: ${darkTheme.dimmed};
        --mantine-color-default: ${darkTheme.default};
        --mantine-color-default-hover: ${darkTheme.defaultHover};
      }
    }
  `}
      </style>
      <style type="text/css">{mantineStyles}</style>
      {coreOnly ? (
        <></>
      ) : (
        <>
          <style type="text/css">{mantineNotificationsStyles}</style>
          <style type="text/css">{mantineCodeHighlightStyles}</style>
        </>
      )}
      <MantineProvider
        defaultColorScheme="auto"
        cssVariablesSelector="#app"
        getRootElement={() => parent}
        theme={mergeThemeOverrides(
          mantineTheme,
          createTheme({
            components: {
              Portal: {
                // Property 'extend' does not exist on type 'ForwardRefExoticComponent<PortalProps & RefAttributes<HTMLDivElement>>'.
                defaultProps: {
                  target: parent,
                },
              },
            },
          }),
        )}
      >
        {children}
      </MantineProvider>
    </>
  );
}
