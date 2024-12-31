// pages/process.ts
import { style } from "#colors";

import type { Terminal } from "#terminal";
import type { Page } from "#page";

export class ProcessPage implements Page {
  title = "Process List";

  async render(term: Terminal): Promise<void> {
    const headers = ["PID", "Process", "CPU%", "MEM%"];
    const rows = [
      ["1234", "chrome", "12.5", "8.2"],
      ["5678", "node", "5.2", "3.1"],
      ["9012", "deno", "2.1", "1.5"],
    ];

    await term.write(
      style("\nProcess List\n", ["bold", "green"]),
    );
    await term.renderTable(headers, rows);
  }
}
