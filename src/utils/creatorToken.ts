const SALT = 0x5a17; // 23063

/**
 * Encodes a numeric userId into a URL-safe, non-sequential alphanumeric string.
 * Example: 4 -> "u_3tg1qm", 12 -> "u_3thrie", 42 -> "u_3tp21g"
 */
export function encodeCreatorCode(userId: number): string {
  if (!userId || isNaN(userId) || userId <= 0) return "";
  const mixed = ((userId ^ SALT) * 10007 + 104729).toString(36);
  return `u_${mixed}`;
}

/**
 * Decodes an encoded creator code back into a numeric userId.
 * Supports:
 * - Encoded codes: "u_3tg1qm", "u-3tg1qm"
 * - Direct path variants: "u/u_3tg1qm", "/u/u_3tg1qm"
 * - Direct prefixed numbers: "u_4", "usr_4", "u-4"
 * - Plain numeric IDs: "4", "12"
 */
export function decodeCreatorCode(code: string | null | undefined): number | null {
  if (!code) return null;
  let trimmed = String(code).trim();
  if (!trimmed) return null;

  // Clean leading path segments if present
  trimmed = trimmed.replace(/^\/?(?:u|creator)\//i, "");

  // Clean query string or hash if present
  trimmed = trimmed.split("?")[0].split("#")[0].trim();
  if (!trimmed) return null;

  // 1. Plain numeric ID (e.g. "4", "12")
  if (/^\d+$/.test(trimmed)) {
    const rawNum = Number(trimmed);
    return rawNum > 0 ? rawNum : null;
  }

  // 2. Direct prefixed numeric ID (e.g. "u_4", "usr_4", "u-4")
  const directNumMatch = trimmed.match(/^(?:u_|usr_|user_|u-)(\d+)$/i);
  if (directNumMatch) {
    const rawNum = Number(directNumMatch[1]);
    return rawNum > 0 ? rawNum : null;
  }

  // 3. Encoded alphanumeric token (e.g. "u_3tg1qm")
  if (trimmed.startsWith("u_") || trimmed.startsWith("u-")) {
    const raw = trimmed.slice(2).toLowerCase();
    const num = parseInt(raw, 36);
    if (!isNaN(num)) {
      const unmixed = Math.round((num - 104729) / 10007) ^ SALT;
      if (unmixed > 0 && encodeCreatorCode(unmixed) === `u_${raw}`) {
        return unmixed;
      }
    }
  }

  return null;
}
