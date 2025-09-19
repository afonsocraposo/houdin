import { CodeHighlight } from "@mantine/code-highlight";
import { createTheme } from "@mantine/core";

export const mantineTheme = createTheme({
  components: {
    CodeHighlight: CodeHighlight.extend({
      defaultProps: {
        radius: "sm",
      },
    }),
  },
});
