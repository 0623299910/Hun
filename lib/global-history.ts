export const GLOBAL_HISTORY_STORAGE_KEY = "hun.globalHistoryData";
export const GLOBAL_HISTORY_UPDATED_EVENT = "hun-global-history-updated";
export const GLOBAL_HISTORY_MAX_LINES = 250;

export function limitHistoryLines(text: string, maxLines = GLOBAL_HISTORY_MAX_LINES): string {
  return text.split(/\r?\n/).slice(0, maxLines).join("\n");
}

export function countNonEmptyLines(text: string): number {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean).length;
}
