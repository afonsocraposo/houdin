import { useStore } from "@/store";
import {
  booleanProperty,
  credentialsProperty,
  selectProperty,
  textProperty,
} from "@/types/config-properties";
import { SchemaBasedProperties } from "../designer/SchemaBasedProperties";
import { Container, Divider, Stack, Text, Title } from "@mantine/core";

const generalSchema = {
  properties: {
    analytics: booleanProperty({
      label: "Enable Analytics",
      description:
        "Allow anonymous usage data collection to help us improve the app. No personal data is collected, and you can opt out at any time.",
    }),
  },
};
const syncSchema = {
  properties: {
    enabled: booleanProperty({
      label: "Enable Sync",
      description:
        "Toggle to enable or disable synchronization across devices. Requires a Houdin Plus subscription 🪄",
    }),
  },
};
const aiAssistantSchema = {
  properties: {
    provider: selectProperty({
      label: "AI Assistant Provider",
      description: "Select the provider for the AI Assistant",
      options: [
        { label: "Houdin Plus 🪄", value: "houdin" },
        { label: "OpenRouter", value: "openrouter" },
        { label: "OpenAI", value: "openai" },
        { label: "Custom", value: "custom" },
      ],
      defaultValue: "houdin",
    }),
    providerUrl: textProperty({
      label: "Custom Provider URL",
      placeholder: "e.g., https://api.yourprovider.com/v1",
      description: "Specify the API endpoint for the custom provider",
      showWhen: {
        field: "provider",
        value: "custom",
      },
    }),
    credentialId: credentialsProperty({
      label: "Provider Credentials",
      placeholder: "Select credentials for the chosen provider",
      description:
        "Select the credentials to use for the AI provider. You can manage credentials in the Credential Manager.",
      showWhen: {
        field: "provider",
        value: ["openai", "openrouter", "custom"],
      },
    }),
    model: textProperty({
      label: "Provider Model Name",
      placeholder: "e.g., gpt-4.1-mini",
      description: "Specify the model name",
      showWhen: [
        {
          field: "provider",
          value: ["openai", "openrouter", "custom"],
        },
      ],
    }),
  },
};

export default function SettingsTab() {
  const settings = useStore((state) => state.settings);
  const setSettings = useStore((state) => state.setSettings);
  return (
    <Container mt="md">
      <Stack>
        <Title order={2}>Settings</Title>
        <Text c="dimmed">
          Adjust your preferences for synchronization and AI assistant
          configuration.
        </Text>
        <Divider my="md" />
        <Title order={3}>General</Title>
        <SchemaBasedProperties
          schema={generalSchema}
          values={settings.general}
          onChange={(key, value) =>
            setSettings({
              ...settings,
              general: { ...settings.general, [key]: value },
            })
          }
        />
        <Divider my="md" />
        <Title order={3}>Synchronization</Title>
        <SchemaBasedProperties
          schema={syncSchema}
          values={settings.sync}
          onChange={(key, value) =>
            setSettings({
              ...settings,
              sync: { ...settings.sync, [key]: value },
            })
          }
        />
        <Divider my="md" />
        <Title order={3}>AI Assistant Configuration</Title>
        <SchemaBasedProperties
          schema={aiAssistantSchema}
          values={settings.workfowGeneration}
          onChange={(key, value) =>
            setSettings({
              ...settings,
              workfowGeneration: {
                ...settings.workfowGeneration,
                [key]: value,
              },
            })
          }
        />
      </Stack>
    </Container>
  );
}
