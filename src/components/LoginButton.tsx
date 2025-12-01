import { Button, Group } from "@mantine/core";
import Avatar from "@/components/Avatar";
import { useSessionStore } from "@/store";
import HelpLoginButton from "./HelpLoginButton";

const BASE_URL = import.meta.env.VITE_BASE_URL || "https://houdin.dev";

export default function LoginButton() {
  const account = useSessionStore((state) => state.account);
  if (account === undefined) {
    return null;
  }
  if (!account) {
    const url = "https://houdin.config";
    return (
      <>
        <Group>
          <HelpLoginButton />
          <Button
            component={"a"}
            href={`${BASE_URL}/login?next=${encodeURIComponent(url)}`}
            variant="light"
            size="sm"
          >
            Log In
          </Button>
        </Group>
      </>
    );
  }
  return (
    <Avatar
      image={account.image}
      name={account.name}
      href={`${BASE_URL}/account`}
    />
  );
}
