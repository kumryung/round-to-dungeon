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
    // Weight ratio thresholds — values mark the START of each tier:
    // tier 0 = Light (0~19%), tier 1 = Normal(20~49%), tier 2 = Heavy(50~79%), tier 3 = Very Heavy(80~89%), tier 4 = Extreme(90%+)
    weightThresholds: [0.20, 0.50, 0.80, 0.90],
    // ATB tick multipliers per tier (Light, Normal, Heavy, VeryHeavy, Extreme)
    // Applied with ceil for Light (lower is faster), floor for Heavy tiers (higher is slower)
    weightAtbMult: [0.9, 1.0, 1.1, 1.2, 1.3],
    // Move/Spawn dice final value penalty per tier (subtracted from result, min 1)
    weightDicePenalty: [0, 0, 0, -1, -3],
    weightTierIcons: ['🪶', '', '⚖️', '🎒', '🐢'],
    weightTierNames: ['weight.light', 'weight.normal', 'weight.heavy', 'weight.very_heavy', 'weight.extreme'],

    // ─── Building System ───
    buildings: {
        ids: ['castle', 'lodge', 'guild', 'storage', 'shop', 'blacksmith', 'inn'],
        maxLevel: 10,
        // Upgrade costs per level (index 0 = Lv.1->2, index 1 = Lv.2->3, etc.)
        upgradeCosts: [
            { gold: 500, materials: { mat_wood: 5 }, timeSec: 60 },          // Lv.1 -> 2
            { gold: 1000, materials: { mat_wood: 10, mat_iron_ore: 2 }, timeSec: 180 }, // Lv.2 -> 3
            { gold: 2000, materials: { mat_wood: 15, mat_iron_ore: 5 }, timeSec: 300 }, // Lv.3 -> 4
            { gold: 3500, materials: { mat_wood: 25, mat_iron_ore: 10 }, timeSec: 600 }, // Lv.4 -> 5
            { gold: 5000, materials: { mat_wood: 40, mat_iron_ore: 20 }, timeSec: 1200 }, // Lv.5 -> 6
            { gold: 7500, materials: { mat_wood: 60, mat_iron_ore: 35 }, timeSec: 1800 }, // Lv.6 -> 7
            { gold: 10000, materials: { mat_wood: 80, mat_iron_ore: 50 }, timeSec: 2400 }, // Lv.7 -> 8
            { gold: 15000, materials: { mat_wood: 120, mat_iron_ore: 80 }, timeSec: 3600 }, // Lv.8 -> 9
            { gold: 25000, materials: { mat_wood: 200, mat_iron_ore: 120 }, timeSec: 7200 }, // Lv.9 -> 10
        ]
    },

    // ─── Inn (여관) ───
    inn: {
        baseSlots: 2,             // Default resting slots available
        goldPerHp: 2,             // Gold cost per 1 HP to recover
        goldPerSanity: 3,         // Gold cost per 1 Sanity to recover
        secPerHp: 1,              // Seconds required per 1 HP to recover
        secPerSanity: 2,          // Seconds required per 1 Sanity to recover
    },

    // ─── Building Level Bonuses ───
    // index 0 = Lv.1, index 9 = Lv.10
    buildingBonuses: {
        lodge: {
            maxWanderers: [4, 5, 5, 6, 6, 7, 7, 8, 9, 10],
        },
        inn: {
            maxRestSlots: [2, 2, 3, 3, 4, 4, 5, 5, 6, 6],
        },
        storage: {
            maxSlots: [30, 35, 40, 45, 50, 55, 60, 65, 70, 80],
        },
        guild: {
            openSlots: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5],
        },
    },
};
