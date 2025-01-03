// markdown.ts
import { style, type StyleOption } from "#colors";
import { BOX, LINES } from "#ansi";

type ParserState = {
  inCodeBlock: boolean;
  inBlockQuote: boolean;
  listLevel: number;
  orderedListCounters: number[];
  lastLineType:
    | "list"
    | "blockquote"
    | "paragraph"
    | "heading"
    | "code"
    | "hr"
    | null;
};

export class MarkdownParser {
  private state: ParserState = {
    inCodeBlock: false,
    inBlockQuote: false,
    listLevel: 0,
    orderedListCounters: [],
    lastLineType: null,
  };

  private readonly styleCombinations = {
    heading1: ["bold", "underline"] as StyleOption[],
    heading2: ["bold", "underline"] as StyleOption[],
    heading3: ["underline"] as StyleOption[],
    bold: ["bold"] as StyleOption[],
    italic: ["italic"] as StyleOption[],
    strikethrough: ["strikethrough"] as StyleOption[],
    code: ["inverse"] as StyleOption[],
    codeBlock: ["inverse"] as StyleOption[],
    blockQuote: ["dim", "italic"] as StyleOption[],
    link: ["underline", "cyan"] as StyleOption[],
    listMarker: ["bold"] as StyleOption[],
    hr: ["dim"] as StyleOption[],
  };

  /**
   * Converts markdown text to terminal-formatted text
   */
  parse(markdown: string): string {
    const lines = markdown.split("\n");
    const formattedLines: string[] = [];
    this.resetState();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      if (trimmedLine === "") {
        formattedLines.push("");
        this.state.lastLineType = null;
        continue;
      }

      // Handle code blocks
      if (trimmedLine.startsWith("```")) {
        this.state.inCodeBlock = !this.state.inCodeBlock;
        this.state.lastLineType = "code";
        if (this.state.inCodeBlock) {
          formattedLines.push(this.formatCodeBlockHeader(trimmedLine.slice(3)));
        }
        continue;
      }

      if (this.state.inCodeBlock) {
        formattedLines.push(this.formatCodeBlock(line));
        continue;
      }

      // Handle block quotes
      if (trimmedLine.startsWith(">")) {
        formattedLines.push(this.formatBlockQuote(trimmedLine.slice(1).trim()));
        this.state.lastLineType = "blockquote";
        continue;
      }

      // Handle horizontal rules
      if (trimmedLine.match(/^(-{3,}|\*{3,}|_{3,})$/)) {
        formattedLines.push(this.formatHorizontalRule());
        this.state.lastLineType = "hr";
        continue;
      }

      // Handle headings
      if (trimmedLine.startsWith("#")) {
        formattedLines.push(this.formatHeading(trimmedLine));
        this.state.lastLineType = "heading";
        continue;
      }

      // Handle lists - this is the key change
      const listMatch = this.parseListItem(line);
      if (listMatch) {
        const { indent, marker, content } = listMatch;
        const formattedLine = this.formatListItem(indent, marker, content);
        formattedLines.push(formattedLine);
        this.state.lastLineType = "list";
        continue;
      }

      // Handle regular paragraphs
      if (trimmedLine.length > 0) {
        formattedLines.push(this.formatParagraph(trimmedLine));
        this.state.lastLineType = "paragraph";
      }
    }

    return formattedLines.join("\n");
  }

  private parseListItem(
    line: string,
  ): { indent: number; marker: string; content: string } | null {
    const match = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
    if (!match) return null;

    const [, indentStr, marker, content] = match;
    const indent = indentStr.length;
    return { indent, marker, content };
  }

  private formatListItem(
    indent: number,
    marker: string,
    content: string,
  ): string {
    // Calculate the actual indentation level (2 spaces = 1 level)
    const level = Math.floor(indent / 2);

    // Choose bullet style based on level
    const bullets = ["•", "◦", "▪", "▫", "⁃"];
    const bullet = /^\d+\./.test(marker)
      ? marker
      : bullets[level % bullets.length];

    // Create the indentation string
    const indentStr = "  ".repeat(level);

    // Format the content with inline elements
    const formattedContent = this.formatInlineElements(content);

    // Combine everything with proper spacing
    return `${indentStr}${
      style(bullet, this.styleCombinations.listMarker)
    } ${formattedContent}`;
  }

  private resetState() {
    this.state = {
      inCodeBlock: false,
      inBlockQuote: false,
      listLevel: 0,
      orderedListCounters: [],
      lastLineType: null,
    };
  }

  private formatParagraph(text: string): string {
    return this.formatInlineElements(text);
  }

  private formatHeading(line: string): string {
    const match = line.match(/^(#{1,6})\s(.+)$/);
    if (!match) return line;

    const level = match[1].length;
    const text = match[2];
    const formattedText = this.formatInlineElements(text);

    switch (level) {
      case 1:
        return `\n${
          style(formattedText.toUpperCase(), this.styleCombinations.heading1)
        }\n${style(LINES.double.repeat(text.length), ["dim"])}`;
      case 2:
        return `\n${style(formattedText, this.styleCombinations.heading2)}\n${
          style(LINES.single.repeat(text.length), ["dim"])
        }`;
      default:
        return style(formattedText, this.styleCombinations.heading3);
    }
  }

  private formatCodeBlock(line: string): string {
    return style(line, this.styleCombinations.codeBlock);
  }

  private formatCodeBlockHeader(language: string): string {
    if (!language) return "";
    const header = `╭── ${language} `;
    return style(header + "─".repeat(40 - header.length), ["dim"]);
  }

  private formatBlockQuote(text: string): string {
    const formattedText = this.formatInlineElements(text);
    return `${style("│", this.styleCombinations.blockQuote)} ${
      style(formattedText, this.styleCombinations.blockQuote)
    }`;
  }

  private formatHorizontalRule(): string {
    return `\n${style(BOX.horizontal.repeat(40), this.styleCombinations.hr)}\n`;
  }

  private formatInlineElements(text: string): string {
    // Handle inline code
    text = text.replace(
      /`([^`]+)`/g,
      (_, code) => style(code, this.styleCombinations.code),
    );

    // Handle bold
    text = text.replace(
      /\*\*([^*]+)\*\*/g,
      (_, content) => style(content, this.styleCombinations.bold),
    );
    text = text.replace(
      /__([^_]+)__/g,
      (_, content) => style(content, this.styleCombinations.bold),
    );

    // Handle italic
    text = text.replace(
      /\*([^*]+)\*/g,
      (_, content) => style(content, this.styleCombinations.italic),
    );
    text = text.replace(
      /_([^_]+)_/g,
      (_, content) => style(content, this.styleCombinations.italic),
    );

    // Handle strikethrough
    text = text.replace(
      /~~([^~]+)~~/g,
      (_, content) => style(content, this.styleCombinations.strikethrough),
    );

    // Handle links using OSC 8 for clickable links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
      return `\x1b]8;;${url}\x1b\\${
        style(text, this.styleCombinations.link)
      }\x1b]8;;\x1b\\`;
    });

    return text;
  }
}

// Example usage:
if (import.meta.main) {
  const markdown = `
# Welcome to Terminal Markdown

This is a **bold** statement and this is *italic*.
Here's some ~~strikethrough~~ text.

## Code Examples
Here's some \`inline code\` and a code block:

\`\`\`typescript
function hello(name: string) {
    console.log(\`Hello, \${name}!\`);
}
\`\`\`

### Lists
* First item
* Second item
  * Nested item
  * Another nested item
    * Even more nested
* Back to first level

1. Ordered item 1
2. Ordered item 2
   * Mixed nesting
   * Works too

> This is a blockquote
> With multiple lines
> And some **bold** text

---

| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| **Bold** | *Italic* | \`Code\` |

[Visit our website](https://example.com)
`;

  const parser = new MarkdownParser();
  console.log(parser.parse(markdown));
}
