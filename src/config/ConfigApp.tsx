import { ActionIcon, Affix, Box, useComputedColorScheme } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconQuestionMark } from "@tabler/icons-react";
import HelpModal from "@/components/HelpModal";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useLocation } from "@tanstack/react-router";
import { trackPageView } from "@/services/plausible";

function ConfigApp({ children }: { children: ReactNode }) {
  const [opened, { open, close }] = useDisclosure(false);
  const colorScheme = useComputedColorScheme();
  const location = useLocation();
  useEffect(() => {
    let path = location.pathname;
    if (path.startsWith("/designer")) {
      path = "/designer";
    } else if (path === "/") {
      if (location.search.tab) {
        path = `/config/${location.search.tab}`;
      }
    }
    trackPageView(path);
  }, [location.pathname, location.search.tab]);

  return (
    <Box
      w="100vw"
      h="100vh"
      style={{
        background:
          colorScheme === "dark"
            ? "linear-gradient(135deg, var(--mantine-color-dark-7) 0%, var(--mantine-color-dark-8) 100%)"
            : undefined,
      }}
    >
      {children}
      <HelpModal key="help-modal" opened={opened} onClose={close} />
      <Affix position={{ bottom: 20, right: 20 }}>
        <ActionIcon onClick={open} size="lg" radius="xl" variant="light">
          <IconQuestionMark />
        </ActionIcon>
      </Affix>
    </Box>
  );
}

export default ConfigApp;
