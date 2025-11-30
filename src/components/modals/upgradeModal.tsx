import {
  Button,
  Modal,
  ModalProps,
  Stack,
  Text,
  List,
  ThemeIcon,
  Box,
  Badge,
  Group,
} from "@mantine/core";
import {
  IconCheck,
  IconCloud,
  IconPlus,
  IconShieldCheck,
  IconSparkles,
} from "@tabler/icons-react";

const BASE_URL = import.meta.env.VITE_BASE_URL || "https://houdin.dev";
export default function UpgradeModal(props: ModalProps) {
  return (
    <Modal
      {...props}
      title={
        <Text fw="bold" size="xl">
          Unlock the Full Power of Houdin
        </Text>
      }
      size="md"
    >
      <Stack gap="lg">
        <Text size="sm" c="dimmed">
          Sync your workflows seamlessly across all your devices and unlock
          premium features for just <strong>$2.99/month</strong>
        </Text>

        <List
          spacing="md"
          size="sm"
          center
          icon={
            <ThemeIcon color="teal" size={24} radius="xl">
              <IconCheck size={16} />
            </ThemeIcon>
          }
        >
          <List.Item
            icon={
              <ThemeIcon color="blue" size={24} radius="xl" variant="light">
                <IconCloud size={16} />
              </ThemeIcon>
            }
          >
            <Text fw={500}>Cloud Sync</Text>
            <Text size="xs" c="dimmed">
              Keep your workflows synchronized across all devices
            </Text>
          </List.Item>
          <List.Item
            icon={
              <ThemeIcon color="violet" size={24} radius="xl" variant="light">
                <IconShieldCheck size={16} />
              </ThemeIcon>
            }
          >
            <Text fw={500}>Automatic Backup</Text>
            <Text size="xs" c="dimmed">
              Never lose your workflows with automatic cloud backups
            </Text>
          </List.Item>
          <List.Item
            icon={
              <ThemeIcon color="grape" size={24} radius="xl" variant="light">
                <IconSparkles size={16} />
              </ThemeIcon>
            }
          >
            <Text fw={500}>Premium Features</Text>
            <Text size="xs" c="dimmed">
              Get early access to new features and priority support
            </Text>
          </List.Item>
        </List>

        <Box mt="md">
          <Button
            component="a"
            href={`${BASE_URL}/upgrade?plan=plus`}
            target="_blank"
            fullWidth
            size="lg"
            variant="gradient"
            rightSection={<IconPlus size={18} />}
          >
            Upgrade to Plus - $2.99/month
          </Button>
          <Group justify="center" mt="xs">
            <Badge variant="light" color="green" size="sm">
              14-day money-back guarantee
            </Badge>
          </Group>
        </Box>
      </Stack>
    </Modal>
  );
}
