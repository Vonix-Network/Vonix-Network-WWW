/**
 * Get user avatar URL
 * Priority: Custom avatar > Minecraft head > Fallback
 */
export function getUserAvatar(
  minecraftUsername: string | null,
  customAvatar: string | null,
  fallbackName?: string
): string {
  // Use custom avatar if set
  if (customAvatar) {
    return customAvatar;
  }

  // Use Minecraft head if username exists
  if (minecraftUsername) {
    return `https://mc-heads.net/head/${encodeURIComponent(minecraftUsername)}`;
  }

  // Fallback to UI Avatars
  const name = fallbackName || minecraftUsername || 'User';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=128`;
}

/**
 * Get user avatar with size parameter
 */
export function getUserAvatarWithSize(
  minecraftUsername: string | null,
  customAvatar: string | null,
  size: number = 128,
  fallbackName?: string
): string {
  // Use custom avatar if set
  if (customAvatar) {
    return customAvatar;
  }

  // Use Minecraft head with size
  if (minecraftUsername) {
    return `https://mc-heads.net/head/${encodeURIComponent(minecraftUsername)}/${size}`;
  }

  // Fallback to UI Avatars with size
  const name = fallbackName || minecraftUsername || 'User';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=${size}`;
}
