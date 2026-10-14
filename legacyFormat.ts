// Helpers kept for data written by the older import format.

export function parseLegacy(text: string): unknown {
  return JSON.parse(text);
}

export function legacyLabel(raw: unknown): string {
  return String(raw);
}
