import { imageToAscii } from "./src/utils/ascii-converter.ts";

// Terminal control sequences
const ESC = "\x1b";
const CSI = `${ESC}[`;

// Colors
const BLUE = `${CSI}34m`;
const GREEN = `${CSI}32m`;
const YELLOW = `${CSI}33m`;
const DIM = `${CSI}2m`;
const BOLD = `${CSI}1m`;
const RESET = `${CSI}0m`;

// Terminal commands
const CLEAR = `${CSI}2J`;
const CURSOR_HOME = `${CSI}H`;
const HIDE_CURSOR = `${CSI}?25l`;
const SHOW_CURSOR = `${CSI}?25h`;
const ALT_SCREEN = `${ESC}[?1049h`;
const EXIT_ALT_SCREEN = `${ESC}[?1049l`;

class Terminal {
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();
  private stdin = Deno.stdin;
  private stdout = Deno.stdout;
  private wasRaw: boolean;

  constructor() {
    this.wasRaw = Deno.isatty(this.stdin.rid);
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

  async getSize(): Promise<{ columns: number; rows: number }> {
    const size = await Deno.consoleSize(this.stdout.rid);
    return { columns: size.columns, rows: size.rows };
  }
}

interface Page {
  title: string;
  render: (term: Terminal) => Promise<void>;
}

class Dashboard {
  private term: Terminal;
  private pages: Page[] = [];
  private currentPageIndex = 0;
  private running = true;
  private isOnSplashScreen = true;

  constructor() {
    this.term = new Terminal();
    this.initializePages();
  }

  private initializePages(): void {
    this.pages = [
      {
        title: "System Overview",
        render: (_term) => this.renderSystemOverview(),
      },
      {
        title: "Process List",
        render: (_term) => this.renderProcessList(),
      },
      {
        title: "Network Stats",
        render: (_term) => this.renderNetworkStats(),
      },
    ];
  }

  private async centerText(text: string): Promise<string> {
    const { columns } = await this.term.getSize();
    const padding = Math.max(0, Math.floor((columns - text.length) / 2));
    return " ".repeat(padding) + text;
  }

  private async renderBox(content: string[]): Promise<void> {
    const { columns } = await this.term.getSize();
    const maxWidth = Math.max(...content.map((line) => line.length));
    const boxWidth = Math.min(maxWidth + 4, columns);

    const horizontalLine = "─".repeat(boxWidth - 2);
    const top = `┌${horizontalLine}┐`;
    const bottom = `└${horizontalLine}┘`;

    await this.term.write(await this.centerText(top) + "\n");
    for (const line of content) {
      const paddedLine = line.padEnd(maxWidth);
      await this.term.write(await this.centerText(`│ ${paddedLine} │`) + "\n");
    }
    await this.term.write(await this.centerText(bottom) + "\n");
  }

  private async renderSplashScreen(): Promise<void> {
    const { rows } = await this.term.getSize();
    const logo = [
      "    ____      __                                        ",
      "   / __ \\____/ /_  ____  ____  ___  ____  ____  ________",
      "  / /_/ / __  / / / __ \\/ __ \`__ \\/ __ \\/ __ \\/ ___/ _ \\",
      " / _, _/ /_/ / /_/ /_/ / / / / / / /_/ / /_/ (__  )  __/",
      "/_/ |_|\\__,_/\\__/\\____/_/ /_/ /_/\\____/\\____/____/\\___/ ",
    ];

    const asciiArt = await imageToAscii(
      "static/robomoose-logo.png",
      50,
    );

    const content = [
      ...logo,
      "",
      ...asciiArt.split("\n"),
      "",
      "Terminal System Monitor",
      "",
      "Press ENTER to continue or q to quit",
    ];

    const startRow = Math.max(0, Math.floor((rows - content.length) / 2));
    await this.term.write("\n".repeat(startRow));
    await this.renderBox(content);
  }

  private async renderTable(
    headers: string[],
    rows: string[][],
  ): Promise<void> {
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

    await this.term.write(topLine + "\n");
    await this.term.write(renderRow(headers) + "\n");
    await this.term.write(horizontalLine + "\n");

    for (const row of rows) {
      await this.term.write(renderRow(row) + "\n");
    }

    await this.term.write(bottomLine + "\n");
  }

  private async renderSystemOverview(): Promise<void> {
    const headers = ["Metric", "Value"];
    const rows = [
      ["CPU Usage", "45%"],
      ["Memory Usage", "6.2GB / 16GB"],
      ["Swap", "0.5GB / 8GB"],
      ["Uptime", "5h 23m"],
    ];

    await this.term.write(BLUE + BOLD + "\nSystem Overview\n" + RESET);
    await this.renderTable(headers, rows);
  }

  private async renderProcessList(): Promise<void> {
    const headers = ["PID", "Process", "CPU%", "MEM%"];
    const rows = [
      ["1234", "chrome", "12.5", "8.2"],
      ["5678", "node", "5.2", "3.1"],
      ["9012", "deno", "2.1", "1.5"],
    ];

    await this.term.write(GREEN + BOLD + "\nProcess List\n" + RESET);
    await this.renderTable(headers, rows);
  }

  private async renderNetworkStats(): Promise<void> {
    const headers = ["Interface", "RX", "TX", "Status"];
    const rows = [
      ["eth0", "1.2 GB", "0.8 GB", "UP"],
      ["wlan0", "0.5 GB", "0.3 GB", "UP"],
    ];

    await this.term.write(YELLOW + BOLD + "\nNetwork Statistics\n" + RESET);
    await this.renderTable(headers, rows);
  }

  private async renderNavigation(): Promise<void> {
    const nav = this.pages
      .map((page, index) =>
        index === this.currentPageIndex
          ? BLUE + BOLD + `[${page.title}]` + RESET
          : DIM + page.title + RESET
      )
      .join(" | ");

    await this.term.write(
      "\n" + DIM + "Navigation: ←/→ arrows to switch pages, q to quit" + RESET +
        "\n",
    );
    await this.term.write(nav + "\n");
  }

  private async handleInput(): Promise<void> {
    while (this.running) {
      const input = await this.term.read();

      // q to quit
      if (input[0] === 113) {
        this.running = false;
        break;
      }

      if (this.isOnSplashScreen) {
        // Enter key
        if (input[0] === 13) {
          this.isOnSplashScreen = false;
          await this.render();
        }
      } else {
        // Left arrow
        if (input[0] === 27 && input[1] === 91 && input[2] === 68) {
          if (this.currentPageIndex > 0) {
            this.currentPageIndex--;
            await this.render();
          }
        } // Right arrow
        else if (input[0] === 27 && input[1] === 91 && input[2] === 67) {
          if (this.currentPageIndex < this.pages.length - 1) {
            this.currentPageIndex++;
            await this.render();
          }
        }
      }
    }
  }

  private async render(): Promise<void> {
    await this.term.write(CLEAR + CURSOR_HOME);

    if (this.isOnSplashScreen) {
      await this.renderSplashScreen();
    } else {
      await this.pages[this.currentPageIndex].render(this.term);
      await this.renderNavigation();
    }
  }

  public async start(): Promise<void> {
    try {
      await this.term.write(ALT_SCREEN + HIDE_CURSOR);
      await this.render();
      await this.handleInput();
    } finally {
      await this.term.write(SHOW_CURSOR + EXIT_ALT_SCREEN);
      if (this.term.wasRaw) {
        this.term.stdin.setRaw(false);
      }
    }
  }
}

if (import.meta.main) {
  const dashboard = new Dashboard();
  await dashboard.start();
}
