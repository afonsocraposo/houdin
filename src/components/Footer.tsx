import { Box, Stack, Text, Anchor } from "@mantine/core";

export default function Footer() {
  return (
    <Box py="lg" mt="xl">
      <Stack>
        <Text ta="center" c="dimmed" size="sm">
          <Anchor href="https://houdin.dev" target="_blank">
            Houdin
          </Anchor>
          {" • "}
          Made with 🧡 by{" "}
          <Anchor href="https://afonsoraposo.com" target="_blank">
            Afonso Raposo
          </Anchor>
        </Text>
        <Text ta="center" c="dimmed" size="sm">
          <Anchor
            href="https://github.com/afonsocraposo/houdin"
            target="_blank"
          >
            Github
          </Anchor>
          {" • "}
          <Anchor
            href="https://github.com/afonsocraposo/houdin/blob/main/LICENSE.md"
            target="_blank"
          >
            FSL-1.1-ALv2 License
          </Anchor>
        </Text>
      </Stack>
    </Box>
  );
}
