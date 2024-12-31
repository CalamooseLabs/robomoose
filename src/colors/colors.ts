// colors.ts

const ANSI_STYLES = {
  // Text styles
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  italic: "\x1b[3m",
  underline: "\x1b[4m",
  blink: "\x1b[5m",
  inverse: "\x1b[7m",
  hidden: "\x1b[8m",
  strikethrough: "\x1b[9m",

  // Foreground colors
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",

  // Bright foreground colors
  brightBlack: "\x1b[90m",
  brightRed: "\x1b[91m",
  brightGreen: "\x1b[92m",
  brightYellow: "\x1b[93m",
  brightBlue: "\x1b[94m",
  brightMagenta: "\x1b[95m",
  brightCyan: "\x1b[96m",
  brightWhite: "\x1b[97m",

  // Background colors
  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",

  // Bright background colors
  bgBrightBlack: "\x1b[100m",
  bgBrightRed: "\x1b[101m",
  bgBrightGreen: "\x1b[102m",
  bgBrightYellow: "\x1b[103m",
  bgBrightBlue: "\x1b[104m",
  bgBrightMagenta: "\x1b[105m",
  bgBrightCyan: "\x1b[106m",
  bgBrightWhite: "\x1b[107m",
} as const;

type StyleName = keyof typeof ANSI_STYLES;
type Styles = StyleName | StyleName[];

/**
 * Applies one or more styles to text and automatically resets afterward
 * @param text The text to style
 * @param styles Single style or array of styles to apply
 * @returns The styled text that will automatically reset after
 */
export function style(text: string, styles: Styles): string {
  const styleArray = Array.isArray(styles) ? styles : [styles];

  // Validate styles
  for (const style of styleArray) {
    if (!ANSI_STYLES[style]) {
      throw new Error(`Invalid style: ${style}`);
    }
  }

  const styleStr = styleArray.map((s) => ANSI_STYLES[s]).join("");
  return `${styleStr}${text}${ANSI_STYLES.reset}`;
}

/**
 * Creates a function that will always apply specific styles to text
 * @param styles Single style or array of styles to apply
 * @returns A function that takes text and returns it wrapped in the specified styles
 */
export function createStyler(styles: Styles): (text: string) => string {
  return (text: string) => style(text, styles);
}

// Convenience functions for common color operations
export const colors = {
  red: (text: string) => style(text, "red"),
  green: (text: string) => style(text, "green"),
  blue: (text: string) => style(text, "blue"),
  yellow: (text: string) => style(text, "yellow"),
  magenta: (text: string) => style(text, "magenta"),
  cyan: (text: string) => style(text, "cyan"),
  white: (text: string) => style(text, "white"),
  black: (text: string) => style(text, "black"),
} as const;

// Example usage:
// import { style, createStyler, colors } from "./colors.ts";
//
// // Basic usage
// console.log(style("Bold red text", ["bold", "red"]));
// console.log(style("Green background", "bgGreen"));
//
// // Create reusable stylers
// const error = createStyler(["bold", "red", "bgBrightWhite"]);
// const highlight = createStyler(["yellow", "underline"]);
// console.log(error("Error message"));
// console.log(highlight("Important info"));
//
// // Use convenience color functions
// console.log(colors.green("Success!"));
// console.log(colors.red("Failed!"));
