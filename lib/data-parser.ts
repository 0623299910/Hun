export interface ParsedEntry {
  date: string;
  top: string;    // 3-digit top number
  bottom: string; // 2-digit bottom number
}

export function parseEntries(text: string): ParsedEntry[] {
  if (!text.trim()) return [];
  return text
    .split("\n")
    .map((line) => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 3) {
        const top = parts[1].replace(/'/g, "").replace(/\D/g, "");
        const bottom = parts[2].replace(/'/g, "").replace(/\D/g, "");
        if (top.length === 3 && bottom.length === 2) {
          return { date: parts[0], top, bottom };
        }
      }
      return null;
    })
    .filter((x): x is ParsedEntry => x !== null);
}

export function d(s: string, i: number): number {
  return parseInt(s.charAt(i));
}

export function mod10(n: number): number {
  return ((n % 10) + 10) % 10;
}

export function sumDigits(s: string): number {
  return s.split("").reduce((a, c) => a + parseInt(c), 0);
}

export function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => fallbackCopy(text));
  }
  return Promise.resolve(fallbackCopy(text));
}

function fallbackCopy(text: string): boolean {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
    return true;
  } catch {
    return false;
  } finally {
    ta.remove();
  }
}
