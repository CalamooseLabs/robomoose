import { BOX } from "#ansi";

/**
 * Terminal class provides utilities for handling terminal I/O operations
 * and rendering formatted text output with boxes and tables.
 *
 * Example usage:
 * ```ts
 * const terminal = new Terminal();
 *
 * // Render a simple box
 * await terminal.renderBox(["Hello", "World"]);
 *
 * // Render a table
 * await terminal.renderTable(
 *   ["Name", "Age"],
 *   [
 *     ["Alice", "25"],
 *     ["Bob", "30"]
 *   ]
 * );
 * ```
 */
export class Terminal {
  private textEncoder = new TextEncoder();
  private textDecoder = new TextDecoder();
  readonly stdin = Deno.stdin;
  readonly stdout = Deno.stdout;
  readonly previousRawMode: boolean;

  /**
   * Initializes a new Terminal instance and sets raw mode for input handling.
   * Raw mode allows reading individual keystrokes without waiting for Enter.
   */
  constructor() {
    this.previousRawMode = Deno.stdin.isTerminal();
    this.stdin.setRaw(true);
  }

  /**
   * Writes text data to the terminal output.
   * @param textContent - The string content to write to the terminal
   */
  async write(textContent: string): Promise<void> {
    await this.stdout.write(this.textEncoder.encode(textContent));
  }

  /**
   * Reads raw input from the terminal.
   * @returns A Uint8Array containing the read bytes
   */
  async read(): Promise<Uint8Array> {
    const buffer = new Uint8Array(8);
    const bytesRead = await this.stdin.read(buffer);
    if (bytesRead === null) return new Uint8Array(0);
    return buffer.subarray(0, bytesRead);
  }

  /**
   * Gets the current terminal dimensions.
   * @returns Object containing columns and rows counts
   */
  getSize(): { columns: number; rows: number } {
    return Deno.consoleSize();
  }

  /**
   * Centers text content in the terminal window.
   * @param text - The text to center
   * @returns Centered text string with appropriate padding
   */
  centerText(text: string): string {
    const { columns } = this.getSize();
    const leftPadding = Math.max(0, Math.floor((columns - text.length) / 2));
    return " ".repeat(leftPadding) + text;
  }

  /**
   * Renders content inside a centered box with borders.
   *
   * Example:
   * ```ts
   * await terminal.renderBox([
   *   "Welcome to the application",
   *   "Press 'q' to quit"
   * ]);
   * ```
   * @param content - Array of strings to display inside the box
   */
  async renderBox(content: string[]): Promise<void> {
    const { columns } = this.getSize();
    const contentWidth = Math.max(...content.map((line) => line.length));
    const boxWidth = Math.min(contentWidth + 4, columns); // Add padding

    // Create top and bottom borders
    const horizontalBorder = BOX.horizontal.repeat(boxWidth - 2);
    const topBorder = `${BOX.topLeft}${horizontalBorder}${BOX.topRight}`;
    const bottomBorder =
      `${BOX.bottomLeft}${horizontalBorder}${BOX.bottomRight}`;

    // Render the box
    await this.write(this.centerText(topBorder) + "\n");
    for (const line of content) {
      const paddedContent = line.padEnd(contentWidth);
      await this.write(
        this.centerText(`${BOX.vertical} ${paddedContent} ${BOX.vertical}`) +
          "\n",
      );
    }
    await this.write(this.centerText(bottomBorder) + "\n");
  }

  /**
   * Renders a formatted table with headers and rows.
   *
   * Example:
   * ```ts
   * await terminal.renderTable(
   *   ["Name", "Score", "Rank"],
   *   [
   *     ["Player 1", "100", "1st"],
   *     ["Player 2", "85", "2nd"]
   *   ]
   * );
   * ```
   * @param headers - Array of column headers
   * @param rows - 2D array containing table data
   */
  async renderTable(headers: string[], rows: string[][]): Promise<void> {
    // Calculate the width needed for each column
    const columnWidths = headers.map((header, columnIndex) => {
      const columnValues = [header, ...rows.map((row) => row[columnIndex])];
      return Math.max(...columnValues.map((item) => item.length));
    });

    // Helper function to format a row with proper spacing and borders
    const formatTableRow = (items: string[]) => {
      return `${BOX.vertical} ` +
        items.map((item, i) => item.padEnd(columnWidths[i])).join(
          ` ${BOX.vertical} `,
        ) +
        ` ${BOX.vertical}`;
    };

    // Create table borders
    const innerBorder = `${BOX.verticalRight}` +
      columnWidths.map((width) => BOX.horizontal.repeat(width + 2)).join(
        BOX.cross,
      ) +
      `${BOX.verticalLeft}`;

    const topBorder = `${BOX.topLeft}` +
      columnWidths.map((width) => BOX.horizontal.repeat(width + 2)).join(
        BOX.horizontalDown,
      ) +
      `${BOX.topRight}`;

    const bottomBorder = `${BOX.bottomLeft}` +
      columnWidths.map((width) => BOX.horizontal.repeat(width + 2)).join(
        BOX.horizontalUp,
      ) +
      `${BOX.bottomRight}`;

    // Render the complete table
    await this.write(topBorder + "\n");
    await this.write(formatTableRow(headers) + "\n");
    await this.write(innerBorder + "\n");

    for (const row of rows) {
      await this.write(formatTableRow(row) + "\n");
    }

    await this.write(bottomBorder + "\n");
  }
}
