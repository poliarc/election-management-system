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

/**
 * Safely resolves the currently logged-in user ID across all available storage:
 * 1. Fallback user object (from props/Redux)
 * 2. localStorage 'auth_user'
 * 3. localStorage 'auth_state'
 * 4. JWT access token payload ('sub')
 */
export function getActiveUserId(fallbackUser?: any): number | null {
  if (fallbackUser) {
    const raw = fallbackUser?.id || fallbackUser?.user_id || fallbackUser?.userId;
    if (raw && !isNaN(Number(raw)) && Number(raw) > 0) return Number(raw);
  }

  if (typeof window === "undefined") return null;

  // 1. From localStorage auth_user
  try {
    const rawUser = localStorage.getItem("auth_user");
    if (rawUser) {
      const u = JSON.parse(rawUser);
      const uid = u?.id || u?.user_id || u?.userId;
      if (uid && !isNaN(Number(uid)) && Number(uid) > 0) return Number(uid);
    }
  } catch (e) {
    // Ignore JSON parse errors
  }

  // 2. From localStorage auth_state
  try {
    const rawState = localStorage.getItem("auth_state");
    if (rawState) {
      const s = JSON.parse(rawState);
      const uid = s?.user?.id || s?.user?.user_id || s?.user?.userId;
      if (uid && !isNaN(Number(uid)) && Number(uid) > 0) return Number(uid);
    }
  } catch (e) {
    // Ignore JSON parse errors
  }

  // 3. From JWT access token (sub claim)
  try {
    const token = localStorage.getItem("auth_access_token");
    if (token) {
      const cleanToken = token.replace("Bearer ", "");
      const payload = JSON.parse(atob(cleanToken.split(".")[1]));
      const sub = payload?.sub || payload?.user_id || payload?.id;
      if (sub && !isNaN(Number(sub)) && Number(sub) > 0) return Number(sub);
    }
  } catch (e) {
    // Ignore token parse errors
  }

  return null;
}

export interface PublicDirectoryUrlOptions {
  district_id?: number | null;
  assembly_id?: number | null;
  level?: string | null;
}

/**
 * Returns the public directory URL for the given user ID (or active logged-in user).
 * On localhost: returns /whatsapp-groups?u=...
 * On production / election.peopleconnect.in / any domain: returns https://whatsapp.peopleconnect.in/u/...
 * Supports optional filters like district_id, assembly_id, level.
 */
export function getPublicDirectoryUrl(
  userOrId?: any,
  options?: PublicDirectoryUrlOptions
): string {
  const uid = typeof userOrId === "number" ? userOrId : getActiveUserId(userOrId);
  const code = uid ? encodeCreatorCode(uid) : "";

  const isLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  const queryParams = new URLSearchParams();
  if (isLocal && code) {
    queryParams.set("u", code);
  }
  if (options?.district_id) {
    queryParams.set("district_id", String(options.district_id));
  }
  if (options?.assembly_id) {
    queryParams.set("assembly_id", String(options.assembly_id));
  }
  if (options?.level && options.level !== "All") {
    queryParams.set("level", options.level);
  }

  const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : "";

  if (isLocal) {
    return `/whatsapp-groups${queryStr}`;
  }

  const basePath = code
    ? `https://whatsapp.peopleconnect.in/u/${code}`
    : "https://whatsapp.peopleconnect.in/";

  return `${basePath}${queryStr}`;
}
