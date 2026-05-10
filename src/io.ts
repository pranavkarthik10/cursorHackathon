import { readFileSync } from "node:fs";

export async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) {
    return "";
  }

  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

export async function readInput(file?: string): Promise<string> {
  if (file) {
    return readFileSync(file, "utf8");
  }

  return readStdin();
}

