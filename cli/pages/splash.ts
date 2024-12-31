import { LOGO } from "#ascii";

import type { Terminal } from "#terminal";
import type { Page } from "#page";

export class SplashPage implements Page {
  title = "Splash";

  async render(term: Terminal): Promise<void> {
    const { rows } = await term.getSize();

    const content = [
      ...LOGO,
      "",
      "Terminal System Monitor",
      "",
      "Press ENTER to continue or q to quit",
    ];

    const startRow = Math.max(0, Math.floor((rows - content.length) / 2));
    await term.write("\n".repeat(startRow));
    await term.renderBox(content);
  }
}
