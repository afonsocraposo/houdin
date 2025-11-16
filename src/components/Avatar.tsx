import { Avatar as MantineAvatar } from "@mantine/core";

interface AvatarProps {
  image?: string | null;
  name?: string;
  href?: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
}
export default function Avatar({
  image,
  name,
  href,
  target = "_blank",
}: AvatarProps) {
  return (
    <MantineAvatar
      src={image}
      alt={name || "User"}
      radius="xl"
      component={"a"}
      href={href || ""}
      target={target}
    >
      {name ? name.charAt(0).toUpperCase() : "U"}
    </MantineAvatar>
  );
}
