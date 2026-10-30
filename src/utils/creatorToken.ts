const SALT = 0x5a17; // 23063

/**
 * Encodes a numeric userId into a URL-safe, non-sequential alphanumeric string.
 * Example: 12 -> "u_3thrie", 42 -> "u_3tp21g"
 */
export function encodeCreatorCode(userId: number): string {
  if (!userId || isNaN(userId) || userId <= 0) return "";
  const mixed = ((userId ^ SALT) * 10007 + 104729).toString(36);
  return `u_${mixed}`;
}

/**
 * Decodes an encoded creator code back into a numeric userId.
 * Supports both encoded "u_..." codes and plain numeric IDs.
 */
export function decodeCreatorCode(code: string | null | undefined): number | null {
  if (!code) return null;
  const trimmed = code.trim();
  if (!trimmed) return null;

  // Support plain numeric ID for backward compatibility
  if (/^\d+$/.test(trimmed)) {
    const rawNum = Number(trimmed);
    return rawNum > 0 ? rawNum : null;
  }

  if (trimmed.startsWith("u_")) {
    const raw = trimmed.slice(2);
    const num = parseInt(raw, 36);
    if (isNaN(num)) return null;
    const unmixed = Math.round((num - 104729) / 10007) ^ SALT;
    return unmixed > 0 ? unmixed : null;
  }

  return null;
}
