import { Button, CopyButton, Group } from "@mantine/core";

export default function StaticRenderer({
  children,
  filename = "export.txt",
}: {
  children: React.ReactNode;
  filename?: string;
}) {
  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([children as string], {
      type: "text/plain",
    });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };
  return (
    <>
      <Group>
        <Button onClick={handleDownload}>Download</Button>
        <CopyButton value={children as string}>
          {({ copied, copy }) => (
            <Button color={copied ? "teal" : "blue"} onClick={copy}>
              {copied ? "Copied" : "Copy to clipboard"}
            </Button>
          )}
        </CopyButton>
      </Group>

      <pre>{children}</pre>
    </>
  );
}
