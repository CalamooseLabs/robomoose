// pages/network.ts
import { style } from "#colors";

import type { Terminal } from "#terminal";
import type { Page } from "#page";

export class NetworkPage implements Page {
  title = "Network Stats";

  async render(term: Terminal): Promise<void> {
    const headers = ["Interface", "RX", "TX", "Status"];
    const rows = [
      ["eth0", "1.2 GB", "0.8 GB", "UP"],
      ["wlan0", "0.5 GB", "0.3 GB", "UP"],
    ];

    await term.write(
      style("\nNetwork Statistics\n", ["bold", "yellow"]),
    );
    await term.renderTable(headers, rows);
  }
}
