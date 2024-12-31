// pages/types.ts
import type { Terminal } from "#terminal";

export interface Page {
  title: string;
  render: (term: Terminal) => Promise<void>;
}
