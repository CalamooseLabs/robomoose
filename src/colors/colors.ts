// colors.ts

const supportsColor = Deno.env.get("FORCE_COLOR") !== "0" &&
  !Deno.env.get("NO_COLOR") &&
  Deno.env.get("TERM") !== "dumb" &&
  Deno.stdout.isTerminal;

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

export type StyleName = keyof typeof ANSI_STYLES;
export type RGBColor = {
  type: "rgb" | "bgRgb";
  r: number;
  g: number;
  b: number;
};
export type StyleOption = StyleName | RGBColor;
export type Styles = StyleOption | StyleOption[];

export const rgb = (r: number, g: number, b: number): RGBColor => ({
  type: "rgb",
  r,
  g,
  b,
});

export const bgRgb = (r: number, g: number, b: number): RGBColor => ({
  type: "bgRgb",
  r,
  g,
  b,
});

// Helper function to get ANSI code for a style
function getStyleCode(style: StyleOption): string {
  if (typeof style === "string") {
    if (!ANSI_STYLES[style]) {
      throw new Error(`Invalid style: ${style}`);
    }
    return ANSI_STYLES[style];
  } else {
    // Handle RGB colors
    if (style.type === "rgb") {
      return supportsColor
        ? `\x1b[38;2;${style.r};${style.g};${style.b}m`
        : ANSI_STYLES.white;
    } else if (style.type === "bgRgb") {
      return supportsColor
        ? `\x1b[48;2;${style.r};${style.g};${style.b}m`
        : ANSI_STYLES.bgWhite;
    }
    throw new Error("Invalid style object");
  }
}

/**
 * Applies one or more styles to text and automatically resets afterward
 * @param text The text to style
 * @param styles Single style or array of styles to apply
 * @returns The styled text that will automatically reset after
 */
export function style(text: string, styles: Styles): string {
  const styleArray = Array.isArray(styles) ? styles : [styles];
  const styleStr = styleArray.map(getStyleCode).join("");
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

/**
 * Creates a generator that produces a gradient of colors between two points
 * @param fromColor Starting RGB color
 * @param toColor Ending RGB color
 * @param steps Number of color steps to generate (inclusive of start and end colors)
 * @returns Generator that yields each color in the gradient
 */
export function* gradient(
  fromColor: RGBColor,
  toColor: RGBColor,
  steps: number,
): Generator<RGBColor> {
  if (steps < 2) {
    throw new Error("Steps must be at least 2");
  }

  const stepCount = steps - 1; // Number of intervals between colors

  for (let i = 0; i < steps; i++) {
    const ratio = i / stepCount;

    const r = Math.round(fromColor.r + (toColor.r - fromColor.r) * ratio);
    const g = Math.round(fromColor.g + (toColor.g - fromColor.g) * ratio);
    const b = Math.round(fromColor.b + (toColor.b - fromColor.b) * ratio);

    yield {
      type: fromColor.type, // Maintain the same color type (rgb or bgRgb)
      r: Math.min(255, Math.max(0, r)),
      g: Math.min(255, Math.max(0, g)),
      b: Math.min(255, Math.max(0, b)),
    };
  }
}

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
