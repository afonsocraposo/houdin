import { Group, Title } from "@mantine/core";

export default function Logo({
  size = 48,
  title = false,
}: {
  size?: number;
  bg?: boolean;
  title?: boolean;
}) {
  return (
    <Group gap="xs">
      <img src={"/icons/icon.svg"} alt="Logo" width={size} height={size} />
      {title && (
        <Title order={1} size={size}>
          Houdin
        </Title>
      )}
    </Group>
  );
}
