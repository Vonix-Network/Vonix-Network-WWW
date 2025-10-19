# Minecraft XP Formula Reference

## Overview

The Vonix Network XP system uses **Minecraft's exact leveling formula** for seamless integration with FTB Quests, in-game achievements, and player progression.

---

## Formula Breakdown

### Levels 1-15
```
XP per level = 2n + 7
```
- Level 1 → 2: 9 XP
- Level 5 → 6: 17 XP
- Level 10 → 11: 27 XP
- Level 15 → 16: 37 XP

### Levels 16-30
```
XP per level = 5n - 38
```
- Level 16 → 17: 42 XP
- Level 20 → 21: 62 XP
- Level 25 → 26: 87 XP
- Level 30 → 31: 112 XP

### Levels 31+
```
XP per level = 9n - 158
```
- Level 31 → 32: 121 XP
- Level 40 → 41: 202 XP
- Level 50 → 51: 292 XP
- Level 75 → 76: 517 XP
- Level 100 → 101: 742 XP

---

## Total XP Requirements

### Early Levels (1-30)
| Level | Total XP | XP to Next |
|-------|----------|------------|
| 1     | 0        | 9          |
| 5     | 64       | 17         |
| 10    | 224      | 27         |
| 15    | 464      | 37         |
| 20    | 864      | 62         |
| 25    | 1,374    | 87         |
| 30    | 2,014    | 112        |

### High Levels (30-100)
| Level | Total XP | XP to Next |
|-------|----------|------------|
| 30    | 2,014    | 112        |
| 40    | 5,174    | 202        |
| 50    | 9,634    | 292        |
| 60    | 15,394   | 382        |
| 75    | 27,109   | 517        |
| 100   | 54,609   | 742        |

---

## Integration Guide

### FTB Quests Integration

FTB Quest rewards can directly award XP that matches the website system:

```json
{
  "type": "xp",
  "xp": 50,
  "description": "Complete Mining Quest"
}
```

This XP will translate 1:1 with the website's XP system.

### Minecraft Achievement Sync

When a player completes a Minecraft achievement:
1. Server plugin detects achievement
2. Sends XP amount to website API
3. Website awards XP using same formula
4. Player levels up on both platforms simultaneously

### Example API Integration

```typescript
// Award XP from Minecraft server
POST /api/xp/award
{
  "minecraftUuid": "069a79f4-44e9-4726-a5be-fca90e38aaf5",
  "xp": 50,
  "source": "ftb_quest",
  "sourceId": "mining_basics",
  "description": "Completed Mining Basics quest"
}
```

---

## Why Minecraft's Formula?

### Benefits

1. **Perfect Synchronization**
   - Website XP = Minecraft XP
   - No conversion needed
   - Real-time sync possible

2. **Familiar Progression**
   - Players understand the system
   - Matches their in-game experience
   - Proven balanced formula

3. **Mod Compatibility**
   - FTB Quests natively supports it
   - Most progression mods use it
   - Easy integration with existing tools

4. **Balanced Scaling**
   - Early levels are quick (encourage engagement)
   - Mid levels provide steady progression
   - High levels are challenging but achievable

### Progression Comparison

**Old Custom Formula:**
- Level 10: 316 XP
- Level 50: 3,536 XP
- Level 100: 10,000 XP

**New Minecraft Formula:**
- Level 10: 224 XP
- Level 50: 9,634 XP
- Level 100: 54,609 XP

The Minecraft formula provides **more granular early-game progression** and **more challenging endgame content**.

---

## Implementation Files

- **`src/lib/xp-utils.ts`** - Core XP calculation functions
- **`src/lib/xp-system.ts`** - XP awarding and management
- **`src/components/xp/`** - UI components
- **`src/app/api/xp/`** - API endpoints

---

## Testing the Formula

```typescript
import { getLevelFromXP, getTotalXPForLevel, getXPForLevel } from '@/lib/xp-utils';

// Test cases
console.log(getXPForLevel(1));   // 9 XP
console.log(getXPForLevel(16));  // 42 XP
console.log(getXPForLevel(31));  // 121 XP

console.log(getTotalXPForLevel(10));  // 224 XP
console.log(getTotalXPForLevel(30));  // 2,014 XP

console.log(getLevelFromXP(224));     // Level 10
console.log(getLevelFromXP(2014));    // Level 30
```

---

## Future Enhancements

### Planned Integrations

- [ ] Direct FTB Quests webhook
- [ ] Real-time achievement sync via server plugin
- [ ] Player level display in-game (scoreboard/TAB)
- [ ] XP boost events (2x XP weekends)
- [ ] Cross-server XP tracking
- [ ] XP leaderboards per quest pack

### Server Plugin Integration

A Minecraft server plugin can be developed to:
1. Track player XP gain in-game
2. POST updates to website API
3. Sync levels bidirectionally
4. Display website achievements in-game
5. Award in-game rewards for website activities

---

**Last Updated:** 2025-01-19  
**Formula Source:** Minecraft Wiki - Experience  
**Implementation:** Vonix Network XP System v2.0
