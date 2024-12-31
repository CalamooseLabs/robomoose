// terminal.ts
export class Terminal {
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();
  readonly stdin = Deno.stdin;
  readonly stdout = Deno.stdout;
  readonly wasRaw: boolean;

  constructor() {
    this.wasRaw = Deno.stdin.isTerminal();
    this.stdin.setRaw(true);
  }

  async write(data: string): Promise<void> {
    await this.stdout.write(this.encoder.encode(data));
  }

  async read(): Promise<Uint8Array> {
    const buf = new Uint8Array(8);
    const n = await this.stdin.read(buf);
    if (n === null) return new Uint8Array(0);
    return buf.subarray(0, n);
  }

  getSize(): { columns: number; rows: number } {
    return Deno.consoleSize();
  }

  centerText(text: string): string {
    const { columns } = this.getSize();
    const padding = Math.max(0, Math.floor((columns - text.length) / 2));
    return " ".repeat(padding) + text;
  }

  async renderBox(content: string[]): Promise<void> {
    const { columns } = this.getSize();
    const maxWidth = Math.max(...content.map((line) => line.length));
    const boxWidth = Math.min(maxWidth + 4, columns);

    const horizontalLine = "─".repeat(boxWidth - 2);
    const top = `┌${horizontalLine}┐`;
    const bottom = `└${horizontalLine}┘`;

    await this.write(this.centerText(top) + "\n");
    for (const line of content) {
      const paddedLine = line.padEnd(maxWidth);
      await this.write(this.centerText(`│ ${paddedLine} │`) + "\n");
    }
    await this.write(this.centerText(bottom) + "\n");
  }

  async renderTable(headers: string[], rows: string[][]): Promise<void> {
    const columnWidths = headers.map((header, index) => {
      const columnItems = [header, ...rows.map((row) => row[index])];
      return Math.max(...columnItems.map((item) => item.length));
    });

    const renderRow = (items: string[]) => {
      return "│ " +
        items.map((item, i) => item.padEnd(columnWidths[i])).join(" │ ") + " │";
    };

    const horizontalLine = "├" +
      columnWidths.map((w) => "─".repeat(w + 2)).join("┼") + "┤";
    const topLine = "┌" + columnWidths.map((w) => "─".repeat(w + 2)).join("┬") +
      "┐";
    const bottomLine = "└" +
      columnWidths.map((w) => "─".repeat(w + 2)).join("┴") + "┘";

    await this.write(topLine + "\n");
    await this.write(renderRow(headers) + "\n");
    await this.write(horizontalLine + "\n");

    for (const row of rows) {
      await this.write(renderRow(row) + "\n");
    }

    await this.write(bottomLine + "\n");
  }
}
