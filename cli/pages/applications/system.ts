// pages/system.ts
import { style } from "#colors";

import type { Terminal } from "#terminal";
import type { Page } from "#page";

export class SystemPage implements Page {
  title = "System Overview";

  async render(term: Terminal): Promise<void> {
    const headers = ["Metric", "Value"];
    const rows = [
      ["CPU Usage", "45%"],
      ["Memory Usage", "6.2GB / 16GB"],
      ["Swap", "0.5GB / 8GB"],
      ["Uptime", "5h 23m"],
    ];

    await term.write(
      style("\nSystem Overview\n", ["bold", "blue"]),
    );
    await term.renderTable(headers, rows);
  }
}
