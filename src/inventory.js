// ─── Inventory System ───
// 12 general slots + 2 safe bag slots, equipped weapon, weight

import { getWeapon, WEAPONS } from './data/weapons.js';
import { SETTINGS } from './data/settings.js';

/** @type {object} */
let inv = null;

/**
 * Initialize inventory for a dungeon run.
 * @param {object} wanderer - Character data
 */
export function initInventory(wanderer, prepInv = null, prepSafeBag = null) {
    const maxWeight = 100;

    inv = {
        slots: prepInv || new Array(SETTINGS.inventorySlots).fill(null),      // General slots
        safeBag: prepSafeBag || new Array(SETTINGS.safeBagSlots).fill(null),  // Safe bag slots
        equipped: null,                               // Weapon slot starts empty
        maxWeight: SETTINGS.maxWeight,
    };

    return inv;
}

export function getInventory() {
    return inv;
}

// ─── Slot operations ───

/**
 * Add an item to inventory. Returns true if successful.
 * Stackable items merge into existing stacks.
 */
export function addItem(item) {
    if (!inv || !item) return false;

    // Stackable: try to merge first
    if (item.stackable) {
        for (let i = 0; i < inv.slots.length; i++) {
            if (inv.slots[i] && inv.slots[i].id === item.id) {
                inv.slots[i].qty = (inv.slots[i].qty || 1) + 1;
                return true;
            }
        }
    }

    // Find empty slot
    const emptyIdx = inv.slots.findIndex((s) => s === null);
    if (emptyIdx === -1) return false; // Inventory full

    inv.slots[emptyIdx] = { ...item, qty: 1 };
    return true;
}

/**
 * Remove (or decrement) an item at a given slot index.
 */
export function removeItem(slotIndex, isSafeBag = false) {
    const arr = isSafeBag ? inv.safeBag : inv.slots;
    if (!arr[slotIndex]) return null;

    const item = arr[slotIndex];
    if (item.qty && item.qty > 1) {
        item.qty--;
        return { ...item, qty: 1 };
    }

    arr[slotIndex] = null;
    return item;
}

/**
 * Use a consumable/tool item from a slot.
 * Returns { used: boolean, effect, value } or null.
 */
export function useItem(slotIndex, isSafeBag = false) {
    const arr = isSafeBag ? inv.safeBag : inv.slots;
    const item = arr[slotIndex];
    if (!item) return null;

    if (item.type !== 'consumable' && item.type !== 'tool') return null;

    const result = { used: true, effect: item.effect, value: item.value || 0, item };

    // One-time use consumables get removed
    if (item.type === 'consumable') {
        removeItem(slotIndex, isSafeBag);
    }
    // Tools: holywater is one-time
    if (item.id === 't_holywater') {
        removeItem(slotIndex, isSafeBag);
    }

    return result;
}

/**
 * Equip a weapon from inventory slot. Swaps with current equipped.
 */
export function equipFromSlot(slotIndex) {
    if (!inv) return;
    const item = inv.slots[slotIndex];
    if (!item || !item.dmgMin) return; // Not a weapon

    const prev = inv.equipped;
    inv.equipped = { ...item, qty: undefined };
    inv.slots[slotIndex] = null;

    // Put previous weapon back (if not fist)
    if (prev && prev.id !== 'w_fist') {
        const empty = inv.slots.findIndex((s) => s === null);
        if (empty !== -1) {
            inv.slots[empty] = prev;
        }
    }
}

/**
 * Move an item to safe bag.
 */
export function moveToSafeBag(slotIndex) {
    if (!inv) return false;
    const empty = inv.safeBag.findIndex((s) => s === null);
    if (empty === -1) return false;
    inv.safeBag[empty] = inv.slots[slotIndex];
    inv.slots[slotIndex] = null;
    return true;
}

/**
 * Move an item from safe bag to main inventory.
 */
export function retrieveFromSafeBag(slotIndex) {
    if (!inv) return false;
    const item = inv.safeBag[slotIndex];
    if (!item) return false;

    // Try to add to main inventory
    const added = addItem(item);
    if (added) {
        inv.safeBag[slotIndex] = null;
        return true;
    }
    return false;
}

// ─── Weapon durability ───

/**
 * Decrease durability of equipped weapon by 1. Returns the weapon state.
 */
export function degradeWeapon() {
    if (!inv || !inv.equipped) return null;
    if (inv.equipped.durability === Infinity) return inv.equipped;

    inv.equipped.durability = Math.max(0, inv.equipped.durability - 1);

    if (inv.equipped.durability <= 0) {
        // Weapon broken → fallback to fist
        const broken = { ...inv.equipped, broken: true };
        inv.equipped = getWeapon('w_fist');
        return broken;
    }

    return inv.equipped;
}

/**
 * Get the ATK from the currently equipped weapon (random within range).
 */
export function getWeaponDamage() {
    if (!inv || !inv.equipped) return 1;
    const w = inv.equipped;
    return Math.floor(Math.random() * (w.dmgMax - w.dmgMin + 1)) + w.dmgMin;
}

// ─── Crafting helpers ───

/**
 * Count how many of an item (by id) exist in inventory slots.
 */
export function countItem(itemId) {
    if (!inv) return 0;
    let count = 0;
    for (const slot of inv.slots) {
        if (slot && slot.id === itemId) count += (slot.qty || 1);
    }
    return count;
}

/**
 * Check if all ingredients in a recipe are available.
 * @param {{ id: string, qty: number }[]} ingredients
 * @returns {boolean}
 */
export function hasMaterials(ingredients) {
    if (!inv) return false;
    for (const ing of ingredients) {
        if (countItem(ing.id) < ing.qty) return false;
    }
    return true;
}

/**
 * Consume materials from inventory for crafting.
 * @param {{ id: string, qty: number }[]} ingredients
 * @returns {boolean} success
 */
export function consumeMaterials(ingredients) {
    if (!hasMaterials(ingredients)) return false;

    for (const ing of ingredients) {
        let remaining = ing.qty;
        for (let i = 0; i < inv.slots.length && remaining > 0; i++) {
            const slot = inv.slots[i];
            if (slot && slot.id === ing.id) {
                const take = Math.min(slot.qty || 1, remaining);
                slot.qty = (slot.qty || 1) - take;
                remaining -= take;
                if (slot.qty <= 0) inv.slots[i] = null;
            }
        }
    }
    return true;
}

// ─── Weight System ───

/**
 * Calculate max carrying capacity based on wanderer's STR stat.
 * @param {number} str - The wanderer's STR stat
 * @returns {number} Maximum weight
 */
export function getMaxWeight(str = 0) {
    return SETTINGS.baseMaxWeight + str * SETTINGS.strWeightBonus;
}

/**
 * Calculate current total weight of all items in inventory.
 * @returns {number}
 */
export function getCurrentWeight() {
    if (!inv) return 0;
    let total = 0;
    const allSlots = [...inv.slots, ...inv.safeBag];
    if (inv.equipped) allSlots.push(inv.equipped);
    for (const slot of allSlots) {
        if (slot) total += (slot.weight || 0) * (slot.qty || 1);
    }
    return total;
}

/**
 * Get the current weight status tier.
 * @param {number} str - The wanderer's STR stat
 * @returns {{ tier: number, ratio: number, diceMax: number, icon: string }}
 *   tier: 0=optimal, 1=loaded, 2=overloaded, 3=critical, 4=exceeded
 */
export function getWeightStatus(str = 0) {
    const maxW = getMaxWeight(str);
    const curW = getCurrentWeight();
    const ratio = maxW > 0 ? curW / maxW : 0;

    const thresholds = SETTINGS.weightThresholds;
    let tier = 0;
    for (let i = 0; i < thresholds.length; i++) {
        if (ratio >= thresholds[i]) tier = i + 1;
    }

    return {
        tier,
        ratio,
        current: curW,
        max: maxW,
        diceMax: SETTINGS.weightDiceMax[tier],
        icon: SETTINGS.weightTierIcons[tier],
    };
}

