// router.ts
import * as ANSI from "#ansi";
import { style } from "#colors";

import type { Terminal } from "#terminal";
import type { Page } from "#page";

export class Router {
  private term: Terminal;
  private pages: Page[] = [];
  private currentPageIndex = 0;
  private running = true;
  private isOnSplashScreen = true;

  constructor(term: Terminal, pages: Page[]) {
    this.term = term;
    this.pages = pages;
  }

  private async renderNavigation(): Promise<void> {
    const navPages = [...this.pages];
    navPages.shift();
    const nav = navPages
      .map((page, index) =>
        index === this.currentPageIndex
          ? style(`[${page.title}]`, ["blue", "bold"])
          : style(page.title, ["dim"])
      )
      .join(" | ");

    await this.term.write(
      style(
        "\nNavigation: ←/→ arrows to switch pages, q to quit\n",
        ["dim"],
      ),
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
          if (this.currentPageIndex < this.pages.length - 2) {
            this.currentPageIndex++;
            await this.render();
          }
        }
      }
    }
  }

  private async render(): Promise<void> {
    await this.term.write(ANSI.CLEAR + ANSI.CURSOR_HOME);

    if (this.isOnSplashScreen) {
      await this.pages[0].render(this.term);
    } else {
      await this.pages[this.currentPageIndex + 1].render(this.term);
      await this.renderNavigation();
    }
  }

  public async start(): Promise<void> {
    try {
      await this.term.write(ANSI.ALT_SCREEN + ANSI.HIDE_CURSOR);
      await this.render();
      await this.handleInput();
    } finally {
      await this.term.write(ANSI.SHOW_CURSOR + ANSI.EXIT_ALT_SCREEN);
      this.term.stdin.setRaw(this.term.previousRawMode);
    }
  }
}
