// ─── Inventory System ───
// 12 general slots + 2 safe bag slots, equipped weapon, weight

import { getWeapon, WEAPONS } from './data/weapons.js';

/** @type {object} */
let inv = null;

/**
 * Initialize inventory for a dungeon run.
 * @param {object} wanderer - Character data
 */
export function initInventory(wanderer) {
    const maxWeight = 100;

    // Determine starting weapon
    let equipped = getWeapon('w_fist');
    if (wanderer.startWeapon && WEAPONS[wanderer.startWeapon]) {
        equipped = getWeapon(wanderer.startWeapon);
    }

    inv = {
        slots: new Array(12).fill(null),      // General: 12 slots
        safeBag: new Array(2).fill(null),      // Safe bag: 2 slots
        equipped,                               // Weapon slot
        maxWeight,
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
