import type { NodeDefinition } from '../node-definitions/types';
import { textProperty, textareaProperty } from '@/types/config-properties';

const definition = {
  kind: "action",
  metadata: {
    type: "show-modal",
    label: "Show Modal",
    icon: "💬",
    description: "Display modal with content"
},
  configSchema: {
    properties: {
        modalTitle: textProperty({
            label: "Modal Title",
            placeholder: "Information, {{node-id}} Data",
            description: "Title of the modal. Use {{node-id}} to reference action outputs",
            defaultValue: "Workflow Result"
        }),
        modalContent: textareaProperty({
            label: "Modal Content",
            placeholder: "The extracted content is: {{get-content-node}}",
            description: "Content to display. Use {{node-id}} to reference action outputs. Supports Markdown.",
            rows: 4
        })
    }
},
  outputExample: {
    title: "Workflow Result",
    content: "The extracted content is: Example content",
},
} satisfies NodeDefinition;

export default definition;
