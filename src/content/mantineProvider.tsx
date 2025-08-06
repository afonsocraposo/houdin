import { createTheme, MantineProvider } from "@mantine/core";

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
      <MantineProvider
        forceColorScheme="dark"
        cssVariablesSelector=":host, #app"
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
