export const SETTINGS = {
    // Movement
    hpRegenPerTile: 1,      // HP recovered per tile moved
    sanityCostPerMove: 2,   // Sanity lost per move roll (not per tile)

    // Combat
    baseHitChance: {
        head: 50,
        body: 100,
        legs: 75
    },

    // Inventory
    inventorySlots: 12,
    safeBagSlots: 2,
    maxWeight: 100,

    // Stats
    maxSanity: 100,
    initialSanity: 100,

    // Map
    baseMapSize: 5,
    moveDiceSides: 6,

    // Status Effects
    poisonDamagePerTurn: 3,
    poisonDuration: 5,
    burnSanityPerTurn: 2,
    burnDuration: 3,
    torchDuration: 10,

    // EXP / Level
    expBase: 10,             // Base EXP for Lv.1 monster
    expPerLevel: 1.5,        // EXP multiplier per monster level
    freeStatPerLevel: 1,     // Free stat points granted per level-up
    hpPerStatPoint: 5,       // HP gained per stat point spent on HP
    // Level-up EXP table: index 0 = Lv.1→2, index 1 = Lv.2→3, ...
    expTable: [
        100,   // Lv.1 → 2
        130,   // Lv.2 → 3
        170,   // Lv.3 → 4
        220,   // Lv.4 → 5
        280,   // Lv.5 → 6
        350,   // Lv.6 → 7
        430,   // Lv.7 → 8
        520,   // Lv.8 → 9
        620,   // Lv.9 → 10
        999,   // Lv.10 → 11 (max cap)
    ],

    // Visibility (Fog of War)
    baseViewDistance: 2,     // Base tile view range
    torchViewBonus: 2,       // Additional view range with torch
};
