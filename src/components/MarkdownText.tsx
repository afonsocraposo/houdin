import ReactMarkdown from "react-markdown";
import { Title, Text, List, ThemeIcon, Code, Typography } from "@mantine/core";
import { IconCircle } from "@tabler/icons-react";
import rehypeSanitize from "rehype-sanitize";
import { CodeHighlight } from "@mantine/code-highlight";

export default function MarkdownText({ children }: { children: string }) {
  return (
    <Typography>
      <ReactMarkdown
        disallowedElements={["pre"]}
        unwrapDisallowed
        rehypePlugins={[rehypeSanitize]}
        components={{
          h1: ({ node, ...props }) => <Title order={2} mb="sm" {...props} />,
          h2: ({ node, ...props }) => (
            <Title order={3} mt="md" mb="sm" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <Title order={4} mt="md" mb="sm" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <Title order={5} mt="md" mb="sm" {...props} />
          ),
          h5: ({ node, ...props }) => (
            <Title order={6} mt="md" mb="sm" {...props} />
          ),
          h6: ({ node, ...props }) => (
            <Title order={6} mt="md" mb="sm" {...props} />
          ),
          // @ts-ignore
          p: ({ node, ...props }) => <Text mb="sm" size="sm" {...props} />,
          ul: ({ node, ...props }) => (
            <List
              spacing="xs"
              size="sm"
              icon={
                <ThemeIcon radius="xl" size={10}>
                  <IconCircle size={6} />
                </ThemeIcon>
              }
              mb="sm"
              {...props}
            />
          ),
          li: ({ node, ...props }) => <List.Item {...props} />,
          code: ({ node, children, className }) => {
            if (!node?.position || !children) {
              return <>{children}</>;
            }
            if (node.position.start.line === node.position.end.line) {
              return <Code>{children}</Code>;
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
