/**
 * XP System Utility Functions
 * 
 * Pure utility functions with no database dependencies
 * Safe to use at build time and in server components
 */

// ============================================================================
// LEVEL CALCULATION - MINECRAFT FORMULA
// ============================================================================

/**
 * Calculate XP required for a specific level using Minecraft's formula
 * This integrates perfectly with FTB Quests and other Minecraft progression
 * 
 * Minecraft Formula:
 * - Levels 1-15: 2n + 7 XP per level
 * - Levels 16-30: 5n - 38 XP per level  
 * - Levels 31+: 9n - 158 XP per level
 * 
 * Where n is the level being reached
 */
export function getXPForLevel(level: number): number {
  if (level <= 0) return 0;
  
  if (level <= 15) {
    return 2 * level + 7;
  } else if (level <= 30) {
    return 5 * level - 38;
  } else {
    return 9 * level - 158;
  }
}

/**
 * Calculate total XP required to reach a level
 * Uses Minecraft's cumulative XP formula for efficiency
 */
export function getTotalXPForLevel(level: number): number {
  if (level <= 0) return 0;
  
  if (level <= 16) {
    // Sum formula: level^2 + 6*level
    return Math.floor(level * level + 6 * level);
  } else if (level <= 31) {
    // Sum formula: 2.5*level^2 - 40.5*level + 360
    return Math.floor(2.5 * level * level - 40.5 * level + 360);
  } else {
    // Sum formula: 4.5*level^2 - 162.5*level + 2220
    return Math.floor(4.5 * level * level - 162.5 * level + 2220);
  }
}

/**
 * Calculate level from total XP using Minecraft formula
 * Optimized with direct calculation instead of iteration
 */
export function getLevelFromXP(xp: number): number {
  if (xp < 0) return 1;
  if (xp === 0) return 1;
  
  // Level 16 threshold
  const level16XP = 352; // getTotalXPForLevel(16)
  
  // Level 31 threshold  
  const level31XP = 1507; // getTotalXPForLevel(31)
  
  if (xp < level16XP) {
    // Levels 1-16: Solve level^2 + 6*level - xp = 0
    // Using quadratic formula: (-6 + sqrt(36 + 4*xp)) / 2
    const level = Math.floor((-6 + Math.sqrt(36 + 4 * xp)) / 2);
    return Math.max(1, level);
  } else if (xp < level31XP) {
    // Levels 17-31: Solve 2.5*level^2 - 40.5*level + (360 - xp) = 0
    // Using quadratic formula: (40.5 - sqrt(1640.25 - 10*(360-xp))) / 5
    const level = Math.floor((40.5 + Math.sqrt(1640.25 - 10 * (360 - xp))) / 5);
    return Math.max(1, level);
  } else {
    // Levels 32+: Solve 4.5*level^2 - 162.5*level + (2220 - xp) = 0
    // Using quadratic formula: (162.5 + sqrt(26406.25 - 18*(2220-xp))) / 9
    const level = Math.floor((162.5 + Math.sqrt(26406.25 - 18 * (2220 - xp))) / 9);
    return Math.max(1, level);
  }
}

/**
 * Calculate XP progress in current level (0-1)
 * Shows how close the player is to the next level
 */
export function getLevelProgress(xp: number): number {
  const currentLevel = getLevelFromXP(xp);
  const xpForCurrentLevel = getTotalXPForLevel(currentLevel);
  const xpForNextLevel = getTotalXPForLevel(currentLevel + 1);
  const xpIntoLevel = xp - xpForCurrentLevel;
  const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;

  if (xpNeededForLevel === 0) return 0;
  return Math.max(0, Math.min(1, xpIntoLevel / xpNeededForLevel));
}

// ============================================================================
// DISPLAY UTILITIES
// ============================================================================

/**
 * Get title/rank name for a level
 */
export function getTitleForLevel(level: number): string {
  if (level >= 100) return '🌟 Legendary';
  if (level >= 75) return '👑 Master';
  if (level >= 50) return '⭐ Expert';
  if (level >= 35) return '💎 Elite';
  if (level >= 25) return '🔥 Veteran';
  if (level >= 15) return '⚡ Rising Star';
  if (level >= 10) return '🎯 Skilled';
  if (level >= 5) return '🌱 Apprentice';
  return '✨ Novice';
}

/**
 * Get color for level tier
 */
export function getColorForLevel(level: number): string {
  if (level >= 100) return '#FFD700'; // Gold
  if (level >= 75) return '#C77DFF'; // Purple
  if (level >= 50) return '#00D9FF'; // Cyan
  if (level >= 35) return '#FF6B9D'; // Pink
  if (level >= 25) return '#FF8C42'; // Orange
  if (level >= 15) return '#4ECDC4'; // Teal
  if (level >= 10) return '#95E1D3'; // Light teal
  if (level >= 5) return '#A8E6CF'; // Light green
  return '#10b981'; // Green
}
