// src/utils/clientThemes.ts
export const CLIENT_THEME_MAP: Record<number, string> = {
  101: 'modern-blue',   // Client A
  102: 'forest-dark',   // Client B
  103: 'sunset-rose',   // Client C
  104: 'midnight-gold', // Client D
  105: 'cyberpunk',     // Client E
};

export const getThemeByClientId = (id: number | null): string => {
  if (!id) return 'modern-blue'; // Default theme
  return CLIENT_THEME_MAP[id] || 'modern-blue';
};