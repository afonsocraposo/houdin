import type { NodeDefinition } from "../node-definitions/types";

const definition = {
  kind: "action",
  metadata: {
    type: "select-element",
    label: "Select Element",
    icon: "IconPointer",
    description: "Ask the user to select an element on the page",
    disableTimeout: true,
  },
  configSchema: {
    properties: {},
  },
  outputExample: {
    selector: "#submit-btn",
    tagName: "BUTTON",
    id: "submit-btn",
    className: "btn btn-primary",
    textContent: "Submit",
  },
} satisfies NodeDefinition;

export default definition;
