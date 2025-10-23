/**
 * XP System Utility Functions
 * 
 * Pure utility functions with no database dependencies
 * Safe to use at build time and in server components
 */

// ============================================================================
// LEVEL CALCULATION - EXPONENTIAL SCALING SYSTEM
// ============================================================================
//
// NEW REQUIREMENTS (Much Harder):
// Level 2: 232 XP        Level 20: 24,803 XP      Level 50: 795,495 XP
// Level 5: 1,324 XP      Level 25: 67,676 XP      Level 75: 3,419,478 XP
// Level 10: 5,315 XP     Level 30: 153,110 XP     Level 100: 10,316,227 XP
//
// ============================================================================

/**
 * Calculate XP required for a specific level using exponential scaling formula
 * Makes leveling progressively harder with MUCH higher requirements
 * 
 * New Formula (Exponential Scaling):
 * - Base: 100 * level
 * - Exponential: level^2.5
 * - Tier multipliers increase dramatically at milestones
 * 
 * This creates a challenging progression system where:
 * - Early levels (1-10): Accessible for new users
 * - Mid levels (11-30): Moderate grind
 * - High levels (31-50): Serious commitment
 * - Elite levels (51+): Extremely difficult
 */
export function getXPForLevel(level: number): number {
  if (level <= 0) return 0;
  if (level === 1) return 0; // Level 1 is starting level
  
  // Base calculation with exponential scaling
  let xpRequired = Math.floor(100 * level + Math.pow(level, 2.5));
  
  // Tier-based multipliers for increasing difficulty
  if (level <= 10) {
    // Early game: 1x (learn the system)
    xpRequired = Math.floor(xpRequired * 1.0);
  } else if (level <= 20) {
    // Early-mid game: 1.5x (starting to get challenging)
    xpRequired = Math.floor(xpRequired * 1.5);
  } else if (level <= 30) {
    // Mid game: 2.0x (significant grind)
    xpRequired = Math.floor(xpRequired * 2.0);
  } else if (level <= 40) {
    // Mid-high game: 2.5x (serious dedication)
    xpRequired = Math.floor(xpRequired * 2.5);
  } else if (level <= 50) {
    // High game: 3.0x (elite players)
    xpRequired = Math.floor(xpRequired * 3.0);
  } else if (level <= 75) {
    // Very high: 3.5x (hardcore grinders)
    xpRequired = Math.floor(xpRequired * 3.5);
  } else if (level <= 100) {
    // Legendary: 4.0x (absolute dedication)
    xpRequired = Math.floor(xpRequired * 4.0);
  } else {
    // Beyond legendary: 5.0x (insane)
    xpRequired = Math.floor(xpRequired * 5.0);
  }
  
  return xpRequired;
}

/**
 * Calculate total XP required to reach a level
 * Sums up all XP requirements from level 1 to target level
 */
export function getTotalXPForLevel(level: number): number {
  if (level <= 0) return 0;
  if (level === 1) return 0;
  
  let totalXP = 0;
  for (let i = 2; i <= level; i++) {
    totalXP += getXPForLevel(i);
  }
  
  return totalXP;
}

/**
 * Calculate level from total XP using iterative calculation
 * Handles exponential scaling accurately
 */
export function getLevelFromXP(xp: number): number {
  if (xp < 0) return 1;
  if (xp === 0) return 1;
  
  let level = 1;
  let totalXP = 0;
  
  // Iterate through levels until we exceed the user's XP
  while (totalXP <= xp) {
    level++;
    totalXP += getXPForLevel(level);
  }
  
  // We went one level too far, so subtract 1
  return Math.max(1, level - 1);
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
