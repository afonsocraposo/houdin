import {
  ActionIcon,
  Container,
  List,
  ListItem,
  Modal,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconHelpTriangle } from "@tabler/icons-react";

const BASE_URL = import.meta.env.VITE_BASE_URL || "https://houdin.dev";

export default function HelpLoginButton() {
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <>
      <Tooltip label="Trouble logging in? Click here for help." withArrow>
        <ActionIcon variant="subtle" onClick={open}>
          <IconHelpTriangle />
        </ActionIcon>
      </Tooltip>
      <Modal title="Tips for login issues" opened={opened} onClose={close}>
        <Container>
          <Stack>
            <Text>
              If you're logged in at <a href={BASE_URL}>{BASE_URL}</a> but the
              extension still shows you as logged out, here are some possible
              reasons:
            </Text>
            <List>
              <ListItem>
                You might be using Firefox's Multi-Account Containers. Make sure
                to login in the default container, as extensions can't share
                cookies across containers.
              </ListItem>
              <ListItem>
                If you're using Zen Browser, you might need to login in a space
                without any attached profile, as profiles isolate cookies from
                extensions. Try creating a new space without a profile and
                logging in there.
              </ListItem>
            </List>
            After every attempt, please refresh the extension page to see if
            you're logged in.
          </Stack>
        </Container>
      </Modal>
    </>
  );
}
