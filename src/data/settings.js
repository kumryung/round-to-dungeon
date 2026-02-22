export const SETTINGS = {
    // Initial Account State
    initialGold: 1000,
    initialDiamonds: 0,
    initialStorageSlots: 30,
    initialItems: [
        { id: "c_herb", qty: 5 },
        { id: "w_rusty_dagger", qty: 1 }
    ],

    // Movement
    hpRegenPerTile: 1,      // HP recovered per tile moved
    sanityCostPerMove: 2,   // Sanity lost per move roll (not per tile)

    // Combat
    baseHitChance: {
        head: 50,
        body: 100,
        legs: 75
    },
    partBonus: { head: -20, body: 10, legs: 0 },
    partMult: { head: 2.0, body: 1.0, legs: 1.2 },

    // Inventory
    inventorySlots: 12,
    safeBagSlots: 2,
    maxWeight: 100,

    // Stats
    maxSanity: 100,
    statNames: {
        str: "STR", agi: "AGI", spd: "SPD", dex: "DEX", vit: "VIT", luk: "LUK"
    },
    initialSanity: 100,
    wandererRecruitCost: 500,

    // Daily Reset time in UTC hour (e.g., 0 = midnight UTC)
    dailyResetTimeUTC: 0,

    // Base limits
    baseWandererLimit: 4,

    // Roster
    maxWandererCap: 10,
    rosterExpandCost: 50, // diamonds

    // Premium features
    maxDailyRefreshes: 10,          // Used by guild
    maxShopRefreshesConsumable: 10, // Used by consumable shop
    maxShopRefreshesEquipment: 10,  // Used by equipment shop
    guildRefreshCostDiamond: 10,
    shopRefreshCostDiamond: 10,
    storageExpandCostDiamond: 50,

    // Gacha
    gachaCostSingleG: 100,        // Gold cost for 1 Draw (fallback if no Silver Ticket)
    gachaCostMultiG: 1000,        // Gold cost for 10+1 Draw (fallback if no tickets)
    ticketSilverId: 'i_ticket_silver',
    ticketGoldId: 'i_ticket_gold',
    gachaMultiGuaranteedGrade: 'rare', // Minimum grade guaranteed in 10+1

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

    // ─── Weight System ───
    baseMaxWeight: 50,                          // Base carrying capacity (regardless of STR)
    strWeightBonus: 5,                          // Extra carry weight per 1 STR
    // Weight ratio thresholds [optimal end, loaded end, overloaded end, critical end]
    weightThresholds: [0.5, 0.75, 0.90, 1.0],
    // Move dice max values per tier [optimal, loaded, overloaded, critical, exceeded]
    weightDiceMax: [6, 5, 4, 3, 2],
    weightTierIcons: ['', '⚖️', '🎒', '🐢', '❌'],
};
