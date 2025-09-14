import { createTheme, MantineProvider } from "@mantine/core";
import ModalDispatcher from "@/components/ModalDispatcher";
import NotificationDispatcher from "@/components/NotificationDispatcher";

declare global {
  interface WindowEventMap {
    modalDispatch: CustomEvent;
    notificationDispatch: CustomEvent;
  }
}

const App = (parent: HTMLElement) => {
  return (
    <MantineProvider
      defaultColorScheme="auto"
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
      <ModalDispatcher />
      <NotificationDispatcher />
    </MantineProvider>
  );
};

export default App;
