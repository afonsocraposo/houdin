import ReactMarkdown from "react-markdown";
import { Title, Text, List, ThemeIcon, Code, Typography } from "@mantine/core";
import { IconCircle } from "@tabler/icons-react";
import rehypeSanitize from "rehype-sanitize";
import { CodeHighlight } from "@mantine/code-highlight";
import { CSSProperties } from "react";

interface MarkdownTextProps {
  children: string;
  style?: CSSProperties;
  c?: string;
}

export default function MarkdownText({
  children,
  style,
  c,
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
            <Text mb="sm" size="sm" c={c}>
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
              mb="sm"
            >
              {children}
            </List>
          ),
          li: ({ children }) => <List.Item c={c}>{children}</List.Item>,
          code: ({ children, className }) => {
            if (!children) {
              return <>{children}</>;
            }
            if (typeof children === "string" && !children.includes("\n")) {
              return <Code c={c}>{children}</Code>;
            }
            // NOTE Languages are passed down through the class name with `react-markdown`
            const [, language] = className?.split("-") || [];
            return (
              <CodeHighlight
                my="xs"
                code={String(children).replace(/\n$/, "")}
                language={language || "text"}
                withCopyButton={true}
              />
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </Typography>
  );
}
