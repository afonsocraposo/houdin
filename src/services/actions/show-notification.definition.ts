import type { NodeDefinition } from '../node-definitions/types';
import { textProperty, textareaProperty } from '@/types/config-properties';

const definition = {
  kind: "action",
  metadata: {
    type: "show-notification",
    label: "Show Notification",
    icon: "🔔",
    description: "Display notification"
},
  configSchema: {
    properties: {
        notificationTitle: textProperty({
            label: "Notification Title",
            placeholder: "Information, {{node-id}} Data",
            description: "Title of the notification. Use {{node-id}} to reference action outputs",
            defaultValue: "Workflow Result"
        }),
        notificationContent: textareaProperty({
            label: "Notification Content",
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
