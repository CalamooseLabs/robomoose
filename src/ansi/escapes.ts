// ansi.ts
export const ESC = "\x1b";
export const CSI = `${ESC}[`;

export const CLEAR = `${CSI}2J`;
export const CURSOR_HOME = `${CSI}H`;
export const HIDE_CURSOR = `${CSI}?25l`;
export const SHOW_CURSOR = `${CSI}?25h`;
export const ALT_SCREEN = `${ESC}[?1049h`;
export const EXIT_ALT_SCREEN = `${ESC}[?1049l`;

export const BOX = {
  topLeft: "┌",
  topRight: "┐",
  bottomLeft: "└",
  bottomRight: "┘",
  horizontal: "─",
  vertical: "│",
  verticalRight: "├",
  verticalLeft: "┤",
  horizontalDown: "┬",
  horizontalUp: "┴",
  cross: "┼",
};
