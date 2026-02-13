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
};
