import type { NodeDefinition } from '../node-definitions/types';
import { selectProperty, textProperty, textareaProperty } from '@/types/config-properties';

const definition = {
  kind: "action",
  metadata: {
    type: "save-file",
    label: "Save to File",
    icon: "💾",
    description: "Download text content as a file",
  },
  configSchema: {
    properties: {
      filename: textProperty({
        label: "Filename",
        description: "Name of the file to download",
        placeholder: "report.txt",
        required: true,
      }),
      content: textareaProperty({
        label: "Content",
        description: "Text content to save in the file",
        placeholder: "Hello world",
        rows: 8,
        required: true,
      }),
      mimeType: selectProperty({
        label: "Mime Type",
        description: "Content type for the downloaded file",
        defaultValue: "text/plain",
        options: [
          { label: "Plain text", value: "text/plain" },
          { label: "JSON", value: "application/json" },
          { label: "CSV", value: "text/csv" },
          { label: "HTML", value: "text/html" },
          { label: "Markdown", value: "text/markdown" },
        ],
      }),
    },
  },
  outputExample: {
    filename: "report.txt",
    mimeType: "text/plain",
    size: 11,
  },
} satisfies NodeDefinition;

export default definition;
