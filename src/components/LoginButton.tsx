import { Button } from "@mantine/core";
import Avatar from "@/components/Avatar";
import { useStore } from "@/config/store";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export default function LoginButton() {
  const account = useStore((state) => state.account);
  if (account === undefined) {
    return null;
  }
  if (!account) {
    const url = window.location.href;
    return (
      <Button
        component={"a"}
        href={`${BASE_URL}/login?next=${encodeURIComponent(url)}`}
        variant="light"
        size="sm"
      >
        Log In
      </Button>
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
