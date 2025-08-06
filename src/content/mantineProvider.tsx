import { ColorSchemeScript, createTheme, MantineProvider } from "@mantine/core";

declare global {
  interface WindowEventMap {
    modalDispatch: CustomEvent;
    notificationDispatch: CustomEvent;
  }
}

export default function CustomMantineProvider({
  parent,
  children,
}: {
  parent: HTMLElement;
  children: React.ReactNode;
}) {
  return (
    <>
      <ColorSchemeScript defaultColorScheme="auto" />
      <MantineProvider
        forceColorScheme="light"
        cssVariablesSelector="#app"
        getRootElement={() => parent}
        theme={createTheme({
          components: {
            Portal: {
              // Property 'extend' does not exist on type 'ForwardRefExoticComponent<PortalProps & RefAttributes<HTMLDivElement>>'.
              defaultProps: {
                target: parent,
              },
            },
          },
        })}
      >
        {children}
      </MantineProvider>
    </>
  );
}
