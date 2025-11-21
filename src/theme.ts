import { CodeHighlight } from "@mantine/code-highlight";
import { createTheme } from "@mantine/core";

export const mantineTheme = createTheme({
  defaultGradient: {
    from: "#f97316",
    to: "#f59e0b",
    deg: 45,
  },
  defaultRadius: "sm",
  colors: {
    // Define a custom primary color scale (you can adjust shades as needed)
    primary: [
      "#fde8dc", // 0 - very light
      "#fcd3b7", // 1
      "#fbbd93", // 2
      "#faaa70", // 3
      "#f8964d", // 4
      "#f6822a", // 5 - base
      "#e16d21", // 6
      "#c9581b", // 7
      "#b14515", // 8
      "#92400f", // 9 - darkest
    ],
  },
  /** You can set the primary color and default radius, font, etc. */
  primaryColor: "primary",
  primaryShade: 6, // default shade
  components: {
    CodeHighlight: CodeHighlight.extend({
      defaultProps: {
        radius: "sm",
      },
    }),
  },
});
