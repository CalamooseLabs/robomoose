class AsciiFont {
  #fontMap: Map<string, string[][]> = new Map();
  #height: number = 5;
  #spaces: number = 4;

  constructor(fontData: string) {
    this.parseFontFile(fontData);
  }

  private parseFontFile(fontData: string) {
    const lines = fontData.split("\n");
    let currentChar = "";
    let currentGlyph: string[] = [];

    // Parse height definition and skip the following blank line

    if (lines[0].startsWith("#define")) {
      const definitions = lines[0].split(" ");
      for (const def of definitions) {
        if (def.startsWith("height=")) {
          this.#height = parseInt(def.split("=")[1]);
        } else if (def.startsWith("spaces=")) {
          this.#spaces = parseInt(def.split("=")[1]);
        }
      }
      lines.shift(); // Remove the define line
      lines.shift(); // Remove the blank line after define
    }

    for (const line of lines) {
      if (line.startsWith('@"') && line.endsWith('"')) {
        if (currentChar && currentGlyph.length > 0) {
          const char2D = currentGlyph.map((line) => line.split(""));
          this.#fontMap.set(currentChar, char2D);
        }
        currentChar = line.slice(2, -1);
        currentGlyph = [];
      } else if (line.trim() !== "") {
        currentGlyph.push(line);
      }
    }

    if (currentChar && currentGlyph.length > 0) {
      const char2D = currentGlyph.map((line) => line.split(""));
      this.#fontMap.set(currentChar, char2D);
    }
  }

  private getBottomRightPosition(
    currentChar2D: string[][],
    nextChar2D: string[][] | undefined,
  ): number {
    if (!currentChar2D || currentChar2D.length === 0) return 0;

    // Default to bottom right position
    const bottomRow = currentChar2D[this.#height - 1] || [];
    let maxRight = bottomRow.length;

    // If there's no next character, just return bottom right
    if (!nextChar2D) return maxRight;

    // For each row in current character
    for (let row = 0; row < this.#height; row++) {
      const currentRow = currentChar2D[row] || [];
      const nextRow = nextChar2D[row] || [];

      // Find rightmost position where current char matches next char
      for (let col = currentRow.length - 1; col >= 0; col--) {
        if (
          currentRow[col] === nextRow[0] && currentRow[col] !== " " &&
          nextRow[0] !== " "
        ) {
          maxRight = Math.max(maxRight, col + 1);
          break;
        }
      }
    }

    return maxRight;
  }

  render(text: string): string {
    if (!text) return "";

    const result: string[][] = Array(this.#height).fill("").map(() => []);
    let currentColumn = 0;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (char === " ") {
        currentColumn += this.#spaces;
        continue;
      }

      const char2D = this.#fontMap.get(char);
      if (!char2D) continue;
      const nextChar = i < text.length - 1 ? text[i + 1] : "";
      const nextChar2D = nextChar !== " "
        ? this.#fontMap.get(nextChar)
        : undefined;

      const bottomRightPos = this.getBottomRightPosition(char2D, nextChar2D);

      for (let row = 0; row < this.#height; row++) {
        const charRow = char2D[row] || [];
        for (let col = 0; col < charRow.length; col++) {
          const targetCol = currentColumn + col;

          if (
            result[row][targetCol] === undefined ||
            result[row][targetCol] === " "
          ) {
            result[row][targetCol] = charRow[col];
          }
        }
      }

      if (i < text.length - 1 && text[i + 1] !== " ") {
        currentColumn += bottomRightPos - 1;
      } else {
        currentColumn += bottomRightPos + 1;
      }
    }

    const fixedArray = result.map((subArray) => {
      // Fill any holes in the array with undefined first
      const filledArray = Array.from({
        length: Math.max(...result.map((arr) => arr.length)),
      }, (_, i) => subArray[i]);
      // Then replace undefined with space
      return filledArray.map((item) => item === undefined ? " " : item);
    });

    return fixedArray
      .map((row) => row.map((char) => char || " ").join(""))
      .join("\n");
  }
}

const slantFontData = await Deno.readTextFile(
  `${import.meta.dirname}/fonts/slant.robofont`,
);
const SlantFont = new AsciiFont(slantFontData);

export function renderText(text: string): string {
  return SlantFont.render(text.toUpperCase());
}

if (import.meta.main) {
  const text = Deno.args[0] || "HELLO WORLD";
  console.log(renderText(text));
}
