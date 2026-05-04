import ReactMarkdown from "react-markdown";
import {
  Title,
  Text,
  List,
  ThemeIcon,
  Code,
  Typography,
  Anchor,
} from "@mantine/core";
import { IconCircle } from "@tabler/icons-react";
import rehypeSanitize from "rehype-sanitize";
import { CSSProperties } from "react";

interface MarkdownTextProps {
  children?: string | null;
  style?: CSSProperties;
  c?: string;
  compact?: boolean;
}

export default function MarkdownText({
  children,
  style,
  c,
  compact = false,
}: MarkdownTextProps) {
  return (
    <Typography style={style}>
      <ReactMarkdown
        disallowedElements={["pre"]}
        unwrapDisallowed
        rehypePlugins={[rehypeSanitize]}
        components={{
          h1: ({ children }) => (
            <Title order={2} mb="sm" c={c}>
              {children}
            </Title>
          ),
          h2: ({ children }) => (
            <Title order={3} mt="md" mb="sm" c={c}>
              {children}
            </Title>
          ),
          h3: ({ children }) => (
            <Title order={4} mt="md" mb="sm" c={c}>
              {children}
            </Title>
          ),
          h4: ({ children }) => (
            <Title order={5} mt="md" mb="sm" c={c}>
              {children}
            </Title>
          ),
          h5: ({ children }) => (
            <Title order={6} mt="md" mb="sm" c={c}>
              {children}
            </Title>
          ),
          h6: ({ children }) => (
            <Title order={6} mt="md" mb="sm" c={c}>
              {children}
            </Title>
          ),
          p: ({ children }) => (
            <Text size="sm" c={c} m={0}>
              {children}
            </Text>
          ),
          ul: ({ children }) => (
            <List
              spacing="xs"
              size="sm"
              icon={
                <ThemeIcon radius="xl" size={10}>
                  <IconCircle size={6} />
                </ThemeIcon>
              }
              mb={compact ? 0 : "sm"}
            >
              {children}
            </List>
          ),
          ol: ({ children }) => (
            <List type="ordered" spacing="xs" size="sm" mb={compact ? 0 : "sm"}>
              {children}
            </List>
          ),
          li: ({ children }) => <List.Item c={c}>{children}</List.Item>,
          a: ({ children, href }) => (
            <Anchor href={href || ""} target="_blank">
              {children}
            </Anchor>
          ),
          code: ({ children, className }) => {
            if (!children) {
              return <>{children}</>;
            }
            if (typeof children === "string" && !children.includes("\n")) {
              return <Code c={c}>{children}</Code>;
            }
            return <Code block>{children}</Code>;
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </Typography>
  );
}
