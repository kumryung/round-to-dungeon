// ─── Global Game State ───
import { CHARACTERS, generateWandererInstance } from './data/characters.js';
import { CONSUMABLE_SHOP_DATA, EQUIPMENT_SHOP_DATA, GACHA_POOL } from './data/shops.js';
import { ITEMS } from './data/items.js';
import { WEAPONS } from './data/weapons.js';
import { ARMORS } from './data/armors.js';
import { ACCESSORIES } from './data/accessories.js';
import { RECIPES } from './data/recipes.js';
import { SETTINGS } from './data/settings.js';
import { MAPS } from './data/maps.js';
import { t } from './i18n.js';
import { GRADE_ORDER } from './data/weapons.js';

/**
 * Look up an item's full definition from master data by ID.
 * Returns null if not found in any collection.
 */
function lookupMasterItem(id) {
    return ITEMS[id] || WEAPONS[id] || ARMORS[id] || ACCESSORIES[id] || null;
}

function hydrateStorageItem(item) {
    if (!item) return null;
    const master = lookupMasterItem(item.id);
    if (!master) return item; // Unknown item: keep as-is, can't fix
    // Merge: master data first, then any overrides from the saved item (like varying durability, qty)
    // To ensure things like reqStats are always updated to the latest master values, we overwrite carefully.
    // For arrays or objects like reqStats, we want the master's version unless the instance mutated it.
    // In this game, reqStats are static, so overriding them with master is unconditionally safe.
    return { ...item, ...master, qty: item.qty, durability: item.durability };
}

function createInitialStorage() {
    const arr = new Array(SETTINGS.initialStorageSlots || 30).fill(null);
    if (SETTINGS.initialItems && SETTINGS.initialItems.length > 0) {
        SETTINGS.initialItems.forEach((item, idx) => {
            if (idx < arr.length) {
                const master = lookupMasterItem(item.id);
                if (master) {
                    arr[idx] = { ...master, qty: item.qty ?? 1 };
                } else {
                    arr[idx] = { ...item };
                }
            }
        });
    }
    return arr;
}

const state = {
    /** @type {number} 보유 골드 */
    gold: SETTINGS.initialGold !== undefined ? SETTINGS.initialGold : 1000,

    /** @type {number} 보유 다이아몬드 */
    diamonds: SETTINGS.initialDiamonds !== undefined ? SETTINGS.initialDiamonds : 0,

    /** @type {boolean} 음소거 여부 */
    isMuted: false,

    /** @type {number} 전역 볼륨 (0.0 ~ 1.0) */
    globalVolume: 0.5,

    /** @type {string} 현재 언어 (ko/en/ja) */
    language: 'ko',

    /** @type {Object.<string, 'cleared'|'failed'>} 각 던전(mapId)의 클리어/실패 상태 상태 */
    dungeonStatuses: {},

    /** @type {number} 성 레벨 */
    castleLevel: 1,

    /** @type {Array<object>} 길드에서 영입 가능한 방랑자 목록 */
    availableWanderers: [],

    /** @type {Array<object>} 영입한 방랑자 목록 */
    recruitedWanderers: [],

    /** @type {Array<object|null>} 창고 아이템 목록 */
    storage: createInitialStorage(),

    /** @type {number} 창고 최대 슬롯 (최대 100) */
    storageMaxSlots: SETTINGS.initialStorageSlots || 30,

    /** @type {Array<object>} 우편함 목록 */
    mailbox: [],

    /** @type {Array<object|null>} 소모품 상점 판매 목록 (10슬롯) */
    shopInvConsumable: new Array(10).fill(null),

    /** @type {Array<object|null>} 장비 상점 판매 목록 (10슬롯) */
    shopInvEquipment: new Array(10).fill(null),

    /** @type {object|null} 던전에 출전할 캐릭터 */
    selectedWanderer: null,

    /** @type {object|null} 선택한 던전 맵 */
    selectedMap: null,

    /** @type {object|null} 현재 제작 중인 아이템 */
    craftItem: null,

    /** @type {number|null} 마지막 리프레쉬 시간 (Hour 기준) */
    lastRefreshTimestamp: null,

    /** @type {number|null} 마지막 상점 리프레쉬 시간 */
    lastShopRefreshTimestamp: null,
    // Sorting
    // Sorting
    storageSortOrder: ['weapon', 'armor', 'accessory', 'tool', 'consumable', 'material'],

    // Recipes & UI State
    unlockedRecipes: [],
    blacksmithFilters: { showCraftable: false, hideLocked: false },

    // Roster Info
    maxWandererLimit: 4, // Will be overridden by SETTINGS later or save

    // Premium Features
    todayGuildRefreshes: 0,
    todayShopRefreshesConsumable: 0,
    todayShopRefreshesEquipment: 0,
    lastResetDateUTC: '',

    // Dungeon persistence
    activeDungeon: null,

    // Picked Dungeons
    availableDungeons: [],
};

// ─── Persistence ───

export function saveState() {
    localStorage.setItem('gameState', JSON.stringify(state));
}

export function loadState() {
    const saved = localStorage.getItem('gameState');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Merge saved state into current state to handle new fields
            Object.keys(parsed).forEach(key => {
                if (state.hasOwnProperty(key)) {
                    state[key] = parsed[key];
                }
            });
            // Restore special objects if needed (e.g. Dates? nulls are fine)
            // Ensure unlockedRecipes is an array if missing in saved
            if (!state.unlockedRecipes) state.unlockedRecipes = [];
            if (!state.blacksmithFilters) state.blacksmithFilters = { showCraftable: false, hideLocked: false };

            // Restore roster caps from save or default
            if (parsed.maxWandererLimit) state.maxWandererLimit = parsed.maxWandererLimit;
            else state.maxWandererLimit = 4; // Or SETTINGS.baseWandererLimit if imported

            // Restore active dungeon if any
            if (parsed.activeDungeon !== undefined) state.activeDungeon = parsed.activeDungeon;

            // Restore available dungeons
            if (parsed.availableDungeons !== undefined) state.availableDungeons = parsed.availableDungeons;

            // Restore Premium Feature tracking
            if (parsed.todayGuildRefreshes !== undefined) state.todayGuildRefreshes = parsed.todayGuildRefreshes;
            if (parsed.todayShopRefreshesConsumable !== undefined) state.todayShopRefreshesConsumable = parsed.todayShopRefreshesConsumable;
            if (parsed.todayShopRefreshesEquipment !== undefined) state.todayShopRefreshesEquipment = parsed.todayShopRefreshesEquipment;
            if (parsed.lastResetDateUTC !== undefined) state.lastResetDateUTC = parsed.lastResetDateUTC;

            // Migration from todayShopRefreshes to new split variables
            if (parsed.todayShopRefreshes !== undefined && parsed.todayShopRefreshesConsumable === undefined) {
                state.todayShopRefreshesConsumable = parsed.todayShopRefreshes;
                state.todayShopRefreshesEquipment = parsed.todayShopRefreshes;
            }

            // ─── Save Migration: shopInv → shopInvConsumable + shopInvEquipment ───
            if (parsed.shopInv && !parsed.shopInvConsumable) {
                state.shopInvConsumable = parsed.shopInv;
                state.shopInvEquipment = new Array(10).fill(null);
            }

            // ─── Data Migration: Hydrate sparse storage items missing metadata ───
            // Fixes items saved as {id, qty} without emoji/nameKey (e.g. from old initialItems config)
            if (state.storage) {
                state.storage = state.storage.map(slot => hydrateStorageItem(slot));
            }

            // Hydrate player's equipments as well
            if (state.recruitedWanderers) {
                state.recruitedWanderers.forEach(w => {
                    if (w.equipments) {
                        if (w.equipments.weapon) w.equipments.weapon = hydrateStorageItem(w.equipments.weapon);
                        if (w.equipments.armor) w.equipments.armor = hydrateStorageItem(w.equipments.armor);
                        if (w.equipments.accessory) w.equipments.accessory = hydrateStorageItem(w.equipments.accessory);
                    }
                });
            }

            // ─── Data Migration: Backfill nameKey/descKey for existing wanderers ───
            if (state.recruitedWanderers) {
                state.recruitedWanderers.forEach(w => {
                    if (!w.status) w.status = 'idle'; // idle | exploring | dead

                    const base = CHARACTERS.find(c => c.id === w.id);
                    if (base) {
                        if (!w.nameKey) w.nameKey = base.nameKey;
                        if (!w.descKey) w.descKey = base.descKey;
                        if (!w.classKey) w.classKey = base.classKey;
                        // Determine default class name if possible, or leave as is
                        if (!w.className && base.className) w.className = base.className;
                    }
                });
            }
            if (state.selectedWanderer) {
                const base = CHARACTERS.find(c => c.id === state.selectedWanderer.id);
                if (base) {
                    const w = state.selectedWanderer;
                    if (!w.nameKey) w.nameKey = base.nameKey;
                    if (!w.descKey) w.descKey = base.descKey;
                    if (!w.classKey) w.classKey = base.classKey;
                }
            }

        } catch (e) {
            console.error("Failed to load save state:", e);
        }
    }
}

// Initialize
loadState();
checkAndRefreshAll();

export function getState() {
    checkDailyReset();
    return state;
}

export function checkDailyReset() {
    const now = new Date();
    // Offset standard time by subtracting SETTINGS.dailyResetTimeUTC so standard UTC day roll matched our reset
    const offsetTime = now.getTime() - (SETTINGS.dailyResetTimeUTC * 60 * 60 * 1000);
    const offsetDate = new Date(offsetTime);

    // YYYY-MM-DD
    const dateStr = `${offsetDate.getUTCFullYear()}-${offsetDate.getUTCMonth() + 1}-${offsetDate.getUTCDate()}`;

    if (state.lastResetDateUTC !== dateStr) {
        state.todayGuildRefreshes = 0;
        state.todayShopRefreshesConsumable = 0;
        state.todayShopRefreshesEquipment = 0;
        state.lastResetDateUTC = dateStr;
        saveState();
    }
}

/**
 * 전역 정각 체크 및 갱신 (길드 & 상점) + 만료 우편 삭제
 */
export function checkAndRefreshAll() {
    checkDailyReset();
    const now = Date.now();
    // 만료 우편 삭제 (expiryDays가 -1이 아니면서 expiryTimestamp가 지난 경우)
    const initialMailCount = state.mailbox.length;
    state.mailbox = state.mailbox.filter(mail => {
        if (mail.expiryDays === -1 || !mail.expiryTimestamp) return true;
        return mail.expiryTimestamp > now;
    });

    const r1 = checkAndRefreshGuild();
    const r2 = checkAndRefreshShop();
    return r1 || r2 || (state.mailbox.length !== initialMailCount);
}

/**
 * Check if a new hour has started and refresh the guild if necessary.
 */
export function checkAndRefreshGuild() {
    const currentHourTimestamp = Math.floor(Date.now() / (1000 * 60 * 60));

    if (state.lastRefreshTimestamp === null || currentHourTimestamp > state.lastRefreshTimestamp) {
        refreshGuildPool();
        state.lastRefreshTimestamp = currentHourTimestamp;
        return true;
    }
    return false;
}

/**
 * Refresh the list of available wanderers in the guild.
 * Picks 3 random characters and generates instances.
 */
export function refreshGuildPool() {
    const shuffled = [...CHARACTERS].sort(() => Math.random() - 0.5);
    state.availableWanderers = shuffled.slice(0, 3).map(base => generateWandererInstance(base));
}

export function premiumRefreshGuild() {
    checkDailyReset();
    if (state.todayGuildRefreshes >= SETTINGS.maxDailyRefreshes) return false;
    if (!useDiamond(SETTINGS.guildRefreshCostDiamond)) return false;

    refreshGuildPool();
    state.lastRefreshTimestamp = Math.floor(Date.now() / (1000 * 60 * 60));
    state.todayGuildRefreshes++;
    saveState();
    return true;
}

export function checkAndRefreshShop() {
    const currentHourTimestamp = Math.floor(Date.now() / (1000 * 60 * 60));
    if (state.lastShopRefreshTimestamp === null || currentHourTimestamp > state.lastShopRefreshTimestamp) {
        refreshShopPool();
        state.lastShopRefreshTimestamp = currentHourTimestamp;
        return true;
    }
    return false;
}

/**
 * 갱신 풀 갱신. 인자가 전달되면 해당 풀만 초기화합니다.
 * @param {string|null} shopType 'consumable' 또는 'equipment', null이면 둘 다 갱신
 */
export function refreshShopPool(shopType = null) {
    // ── Consumable shop ──
    if (shopType === null || shopType === 'consumable') {
        state.shopInvConsumable = CONSUMABLE_SHOP_DATA.slots.map(slot => {
            if (state.castleLevel < slot.unlockLevel) return null;
            const totalWeight = slot.pool.reduce((sum, e) => sum + e.weight, 0);
            let roll = Math.random() * totalWeight;
            for (const entry of slot.pool) {
                roll -= entry.weight;
                if (roll <= 0) {
                    const baseItem = ITEMS[entry.id];
                    return baseItem ? { ...baseItem, qty: 1, bought: false } : null;
                }
            }
            return null;
        });
    }

    // ── Equipment shop ──
    if (shopType === null || shopType === 'equipment') {
        state.shopInvEquipment = EQUIPMENT_SHOP_DATA.slots.map(slot => {
            if (state.castleLevel < slot.unlockLevel) return null;
            const totalWeight = slot.pool.reduce((sum, e) => sum + e.weight, 0);
            let roll = Math.random() * totalWeight;
            for (const entry of slot.pool) {
                roll -= entry.weight;
                if (roll <= 0) {
                    let baseItem = null;
                    if (entry.source === 'weapon') baseItem = WEAPONS[entry.id];
                    else if (entry.source === 'armor') baseItem = ARMORS[entry.id];
                    else if (entry.source === 'accessory') baseItem = ACCESSORIES[entry.id];
                    else baseItem = ITEMS[entry.id];
                    return baseItem ? { ...baseItem, bought: false } : null;
                }
            }
            return null;
        });
    }
}

export function premiumRefreshShop(shopType) {
    checkDailyReset();

    let maxRefreshes = SETTINGS.maxShopRefreshesConsumable;
    let currentRefreshes = state.todayShopRefreshesConsumable;

    if (shopType === 'equipment') {
        maxRefreshes = SETTINGS.maxShopRefreshesEquipment;
        currentRefreshes = state.todayShopRefreshesEquipment;
    }

    if (currentRefreshes >= maxRefreshes) return false;
    if (!useDiamond(SETTINGS.shopRefreshCostDiamond)) return false;

    refreshShopPool(shopType);
    state.lastShopRefreshTimestamp = Math.floor(Date.now() / (1000 * 60 * 60));

    if (shopType === 'consumable') state.todayShopRefreshesConsumable++;
    else if (shopType === 'equipment') state.todayShopRefreshesEquipment++;

    saveState();
    return true;
}

// ─── Gacha ───

function rollGachaItem(gradeFilter) {
    // gradeFilter: if set, only pick items with grade >= gradeFilter tier
    let pool = gradeFilter
        ? GACHA_POOL.filter(e => GRADE_ORDER.indexOf(e.grade) >= GRADE_ORDER.indexOf(gradeFilter))
        : GACHA_POOL;

    if (pool.length === 0) pool = GACHA_POOL;
    const totalWeight = pool.reduce((sum, e) => sum + e.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const entry of pool) {
        roll -= entry.weight;
        if (roll <= 0) {
            let base = null;
            if (entry.source === 'weapon') base = WEAPONS[entry.id];
            else if (entry.source === 'armor') base = ARMORS[entry.id];
            else if (entry.source === 'accessory') base = ACCESSORIES[entry.id];
            else base = ITEMS[entry.id];
            return base ? { ...base, qty: 1 } : null;
        }
    }
    return null;
}

/**
 * Perform a Gacha Draw.
 * @param {boolean} isMulti - false = 1 Draw, true = 10+1 Draw
 * @returns {{ success: boolean, reason?: string, items?: object[] }}
 */
export function performGachaDraw(isMulti) {
    const silverTicketId = SETTINGS.ticketSilverId;
    const goldTicketId = SETTINGS.ticketGoldId;
    const guaranteeGrade = SETTINGS.gachaMultiGuaranteedGrade || 'rare';

    // ─── Deduct Cost ───
    if (isMulti) {
        // Priority: 1 Golden Ticket → 10 Silver Tickets → 1000 Gold
        const goldTicketIdx = state.storage.findIndex(s => s && s.id === goldTicketId);
        const silverTickets = state.storage.filter(s => s && s.id === silverTicketId);
        const totalSilver = silverTickets.reduce((sum, s) => sum + (s.qty || 1), 0);

        if (goldTicketIdx !== -1) {
            const slot = state.storage[goldTicketIdx];
            slot.qty = (slot.qty || 1) - 1;
            if (slot.qty <= 0) state.storage[goldTicketIdx] = null;
        } else if (totalSilver >= 10) {
            let needed = 10;
            for (let i = 0; i < state.storage.length && needed > 0; i++) {
                const slot = state.storage[i];
                if (slot && slot.id === silverTicketId) {
                    const consume = Math.min(needed, slot.qty || 1);
                    slot.qty = (slot.qty || 1) - consume;
                    needed -= consume;
                    if (slot.qty <= 0) state.storage[i] = null;
                }
            }
        } else if (state.gold >= SETTINGS.gachaCostMultiG) {
            state.gold -= SETTINGS.gachaCostMultiG;
        } else {
            return { success: false, reason: 'insufficient_funds' };
        }
    } else {
        // Priority: 1 Silver Ticket → 100 Gold
        const silverIdx = state.storage.findIndex(s => s && s.id === silverTicketId && (s.qty || 1) > 0);
        if (silverIdx !== -1) {
            const slot = state.storage[silverIdx];
            slot.qty = (slot.qty || 1) - 1;
            if (slot.qty <= 0) state.storage[silverIdx] = null;
        } else if (state.gold >= SETTINGS.gachaCostSingleG) {
            state.gold -= SETTINGS.gachaCostSingleG;
        } else {
            return { success: false, reason: 'insufficient_funds' };
        }
    }

    // ─── Roll Items ───
    const count = isMulti ? 11 : 1;
    const results = [];

    for (let i = 0; i < count; i++) {
        // Last item in 10+1 draw is guaranteed rare+
        const item = (isMulti && i === count - 1)
            ? rollGachaItem(guaranteeGrade)
            : rollGachaItem(null);
        if (item) results.push(item);
    }

    // ─── Send to storage (overflow → mailbox) ───
    const overflow = [];
    for (const item of results) {
        const added = addItemToStorage(item);
        if (!added) overflow.push(item);
    }
    if (overflow.length > 0) {
        sendToMailbox(overflow, t('ui.shop.gacha_overflow_mail'), 30);
    }

    saveState();
    return { success: true, items: results };
}

// ─── Gold & Diamonds ───

export function addGold(amount) {
    state.gold += amount;
    saveState();
}

export function useGold(amount) {
    if (state.gold >= amount) {
        state.gold -= amount;
        saveState();
        return true;
    }
    return false;
}

export function addDiamond(amount) {
    state.diamonds += amount;
    saveState();
}

export function useDiamond(amount) {
    if (state.diamonds >= amount) {
        state.diamonds -= amount;
        saveState();
        return true;
    }
    return false;
}

export function hasDiamond(amount) {
    return state.diamonds >= amount;
}

/**
 * 창고에 아이템 추가 (자동 스택 지원)
 */
export function addItemToStorage(item) {
    if (!item) return false;

    const baseData = (ITEMS[item.id] || WEAPONS[item.id]);
    const maxStack = baseData ? (baseData.maxStack || 1) : 1;
    let qtyToAdd = item.qty || 1;

    // 1. Stackable 아이템인 경우 기존 슬롯 채우기
    if (item.stackable && maxStack > 1) {
        for (let i = 0; i < state.storage.length; i++) {
            const slot = state.storage[i];
            if (slot && slot.id === item.id && slot.qty < maxStack) {
                const canFill = maxStack - slot.qty;
                const toAdd = Math.min(canFill, qtyToAdd);
                slot.qty += toAdd;
                qtyToAdd -= toAdd;
                if (qtyToAdd <= 0) return true;
            }
        }
    }

    // 2. 남은 수량이 있거나 비스택성인 경우 빈 슬롯에 추가
    while (qtyToAdd > 0) {
        const emptyIdx = state.storage.findIndex(s => s === null);
        if (emptyIdx === -1) return false; // 창고 가득 참

        const toAdd = Math.min(qtyToAdd, maxStack);
        state.storage[emptyIdx] = { ...item, qty: toAdd };
        qtyToAdd -= toAdd;

        // 비스택성(maxStack=1)이면서 수량이 남았다면 계속 반복하여 다른 빈 슬롯 찾음
    }

    return true;
}

export function removeFromStorage(index) {
    const item = state.storage[index];
    state.storage[index] = null;
    saveState();
    return item;
}

export function upgradeStorage() {
    if (state.storageMaxSlots >= 100) return false;

    if (useDiamond(SETTINGS.storageExpandCostDiamond)) {
        state.storageMaxSlots = Math.min(100, state.storageMaxSlots + 10);
        const newStorage = new Array(state.storageMaxSlots).fill(null);
        state.storage.forEach((item, i) => { if (i < newStorage.length) newStorage[i] = item; });
        state.storage = newStorage;
        saveState();
        return true;
    }
    return false;
}

// ─── Mailbox Logic ───

export function sendToMailbox(items, subject = null, expiryDays = 3) {
    if (!subject) subject = t('ui.mailbox.sender_knight');
    if (!items || items.length === 0) return;

    let expiryTimestamp = null;
    if (expiryDays !== null && expiryDays >= 0) {
        expiryTimestamp = Date.now() + (expiryDays * 24 * 60 * 60 * 1000);
    }

    state.mailbox.push({
        id: 'mail_' + Date.now(),
        subject,
        items: items.filter(i => i !== null).map(i => ({ ...i })),
        timestamp: Date.now(),
        expiryDays,
        expiryTimestamp,
        received: false
    });
}

export function receiveMail(mailId) {
    const mailIdx = state.mailbox.findIndex(m => m.id === mailId);
    if (mailIdx === -1) return { success: false, reason: 'notFound' };
    const mail = state.mailbox[mailIdx];

    let itemsAdded = 0;
    let itemsFailed = 0;

    for (let i = 0; i < mail.items.length; i++) {
        const added = addItemToStorage(mail.items[i]);
        if (added) {
            mail.items[i] = null;
            itemsAdded++;
        } else {
            itemsFailed++;
        }
    }

    mail.items = mail.items.filter(i => i !== null);
    const removed = mail.items.length === 0;
    if (removed) {
        state.mailbox.splice(mailIdx, 1);
    }

    // Note: addItemToStorage calls saveState, but we modify mailbox here too.
    saveState();
    return {
        success: itemsAdded > 0,
        allAdded: itemsFailed === 0,
        removed,
        itemsAdded,
        itemsFailed
    };
}

export function receiveAllMail() {
    let totalMails = state.mailbox.length;
    let removedCount = 0;
    let storageFull = false;

    for (let i = state.mailbox.length - 1; i >= 0; i--) {
        const res = receiveMail(state.mailbox[i].id);
        if (res.removed) removedCount++;
        if (!res.allAdded) storageFull = true;
    }

    return {
        totalMails,
        removedCount,
        storageFull
    };
}

export function buyShopItem(slotIndex, shopType = 'consumable') {
    const inv = shopType === 'equipment' ? state.shopInvEquipment : state.shopInvConsumable;
    const item = inv[slotIndex];
    if (!item || item.bought) return false;

    if (state.gold >= item.price) {
        const added = addItemToStorage(item);
        if (added) {
            state.gold -= item.price;
            item.bought = true;
            saveState();
            return true;
        }
    }
    return false;
}

// ─── Blacksmith & Brewing Logic ───

export function craftItem(recipeId) {
    const recipe = RECIPES.find(r => r.result === recipeId);
    if (!recipe) return { success: false, reason: 'recipeNotFound' };

    // 1. 재료 체크
    for (const ingredient of recipe.ingredients) {
        let foundQty = 0;
        // 창고 전체에서 해당 아이템 수량 합산
        state.storage.forEach(s => {
            if (s && s.id === ingredient.id) {
                foundQty += (s.qty || 1);
            }
        });

        if (foundQty < ingredient.qty) {
            return { success: false, reason: 'missingMaterials', missing: ingredient.id };
        }
    }

    // 2. 재료 소모
    for (const ingredient of recipe.ingredients) {
        let remainingToConsume = ingredient.qty;
        for (let i = 0; i < state.storage.length; i++) {
            const s = state.storage[i];
            if (s && s.id === ingredient.id) {
                const consume = Math.min(s.qty || 1, remainingToConsume);
                s.qty -= consume;
                remainingToConsume -= consume;
                if (s.qty <= 0) state.storage[i] = null;
                if (remainingToConsume <= 0) break;
            }
        }
    }

    // 3. 결과물 생성
    const resultItem = { ...(ITEMS[recipe.result] || WEAPONS[recipe.result]) };
    resultItem.qty = 1;

    const added = addItemToStorage(resultItem); // This calls saveState
    if (!added) {
        // 창고가 꽉 차서 실패한 경우 (사실 위에서 재료를 소모했으므로 최소 한 칸은 비어있을 확률이 높지만 안전장치)
        // 실제로는 우편함으로 보내거나 하는 처리가 좋음
        return { success: false, reason: 'storageFull' };
    }

    saveState();
    return { success: true, item: resultItem };
}

// ─── Sorting Logic ───

export function updateSortOrder(newOrder) {
    state.storageSortOrder = newOrder;
    saveState();
}

export function sortStorage() {
    // 1. 기존 아이템들만 추출 (null 제외)
    const items = state.storage.filter(s => s !== null);

    // 2. 정렬 (sortOrder 기반)
    items.sort((a, b) => {
        const orderA = state.storageSortOrder.indexOf(a.type);
        const orderB = state.storageSortOrder.indexOf(b.type);

        if (orderA !== orderB) {
            return orderA - orderB;
        }

        // 타입이 같으면 ID순
        return a.id.localeCompare(b.id);
    });

    // 3. 창고 재배정 (남은 공간은 null)
    const newStorage = new Array(state.storageMaxSlots).fill(null);
    for (let i = 0; i < items.length; i++) {
        newStorage[i] = items[i];
    }

    state.storage = newStorage;
    saveState();
}

// ─── Wanderers ───

export function recruitWanderer(wandererInst) {
    // Check max limit
    if (state.recruitedWanderers.length >= state.maxWandererLimit) return false;

    // Check if already recruited
    if (state.recruitedWanderers.find((w) => w.id === wandererInst.id)) return false;

    // Deduct gold
    if (!useGold(SETTINGS.wandererRecruitCost)) return false;

    wandererInst.isRecruited = true;
    state.recruitedWanderers.push(wandererInst);

    // Mark as recruited in available wanderers pool
    const available = state.availableWanderers.find(w => w.id === wandererInst.id);
    if (available) available.isRecruited = true;

    saveState();
    return true;
}

export function dismissWanderer(characterId) {
    state.recruitedWanderers = state.recruitedWanderers.filter(
        (w) => w.id !== characterId
    );
    if (state.selectedWanderer?.id === characterId) {
        state.selectedWanderer = null;
    }
    saveState();
}

export function selectWanderer(character) {
    state.selectedWanderer = character;
    saveState();
}

export function expandRoster() {
    if (state.maxWandererLimit >= SETTINGS.maxWandererCap) return false;

    if (useDiamond(SETTINGS.rosterExpandCost)) {
        state.maxWandererLimit++;
        saveState();
        return true;
    }
    return false;
}

export function buryWanderer(characterId) {
    state.recruitedWanderers = state.recruitedWanderers.filter(
        (w) => w.id !== characterId
    );
    if (state.selectedWanderer?.id === characterId) {
        state.selectedWanderer = null;
    }
    saveState();
}

export function setActiveDungeon(ds) {
    state.activeDungeon = ds;
    if (ds && ds.wanderer) {
        const globalW = state.recruitedWanderers.find(w => w.id === ds.wanderer.id);
        if (globalW && globalW.status !== 'dead') {
            globalW.curHp = ds.currentHp;
            globalW.curSanity = ds.sanity;
        }
    }
    saveState();
}

export function clearActiveDungeon() {
    state.activeDungeon = null;
    saveState();
    generateAvailableDungeons();
}

export function generateAvailableDungeons() {
    const validMaps = MAPS.filter(m => m.unlockTownLv <= state.castleLevel);

    let pool = [...validMaps];
    let selected = [];

    // Always include the currently active dungeon in the list, if there is one
    if (state.activeDungeon && state.activeDungeon.mapData) {
        selected.push(state.activeDungeon.mapData);
        pool = pool.filter(m => m.id !== state.activeDungeon.mapData.id);
    }

    // Randomly pick remaining slots up to 2
    while (selected.length < 2 && pool.length > 0) {
        const idx = Math.floor(Math.random() * pool.length);
        selected.push(pool[idx]);
        pool.splice(idx, 1);
    }

    state.availableDungeons = selected;
    saveState();
}

/**
 * 특정 던전의 클리어 또는 실패 상태를 기록
 * @param {string} mapId 
 * @param {'cleared'|'failed'} status 
 */
export function updateDungeonStatus(mapId, status) {
    if (!state.dungeonStatuses) {
        state.dungeonStatuses = {};
    }
    state.dungeonStatuses[mapId] = status;
    saveState();
}

/**
 * 클리어/실패 상태를 초기화하고 사용 가능한 던전 목록을 갱신
 */
export function refreshDungeonList() {
    state.dungeonStatuses = {};
    generateAvailableDungeons();
}

export function adminResetAccount() {
    localStorage.removeItem('gameState');
    location.reload();
}

// ─── Phase 13 Wanderer Management Logic ───

/**
 * 장착 가능한 아이템인지 확인 (무기: weapon, 방어구: armor, 장신구: accessory)
 */
function isEligibleForSlot(item, slot) {
    if (!item) return false;
    if (slot === 'weapon') return item.type === 'weapon' || !!WEAPONS[item.id];
    // 현재 데이터상 방어구/장신구 타입이 명시되어 있지 않다면 추후 확장을 고려해 기본 체크만 수행
    return true;
}

/**
 * 아이템 장착 (창고 -> 캐릭터)
 */
export function equipItem(wandererId, storageIdx, slot) {
    const wanderer = state.recruitedWanderers.find(w => w.id === wandererId);
    if (!wanderer) return { success: false, reason: 'wandererNotFound' };

    const item = state.storage[storageIdx];
    if (!item) return { success: false, reason: 'itemNotFound' };

    // ── Stat requirement check ──
    const reqStats = item.reqStats || {};
    const missingStats = {};
    for (const [stat, required] of Object.entries(reqStats)) {
        const current = wanderer[stat] ?? 0;
        if (current < required) {
            missingStats[stat] = { required, current };
        }
    }
    if (Object.keys(missingStats).length > 0) {
        return { success: false, reason: 'STATS_NOT_MET', missingStats };
    }

    // 기존 장착 해제 먼저 수행
    if (wanderer.equipments[slot]) {
        unequipItem(wandererId, slot);
    }

    // 장착 (창고에서 제거)
    wanderer.equipments[slot] = { ...item };
    state.storage[storageIdx] = null;
    saveState();

    return { success: true };
}

/**
 * 아이템 장착 해제 (캐릭터 -> 창고)
 */
export function unequipItem(wandererId, slot) {
    const wanderer = state.recruitedWanderers.find(w => w.id === wandererId);
    if (!wanderer) return { success: false, reason: 'wandererNotFound' };

    const item = wanderer.equipments[slot];
    if (!item) return { success: false, reason: 'noItemEquipped' };

    // 창고 빈자리 찾기
    const added = addItemToStorage(item);
    if (added) {
        wanderer.equipments[slot] = null;
        saveState();
        return { success: true };
    } else {
        return { success: false, reason: 'storageFull' };
    }
}

/**
 * 스탯 포인트 투자
 */
export function allocateStatPoint(wandererId, statKey) {
    const wanderer = state.recruitedWanderers.find(w => w.id === wandererId);
    if (!wanderer || wanderer.statPoints <= 0) return { success: false };

    const validStats = ['vit', 'str', 'agi', 'dex', 'luk', 'spd'];
    if (!validStats.includes(statKey)) return { success: false };

    wanderer[statKey]++;
    wanderer.statPoints--;

    if (statKey === 'vit') {
        const oldMax = wanderer.maxHp;
        wanderer.maxHp = 50 + (wanderer.vit * 5);
        wanderer.curHp += (wanderer.maxHp - oldMax);
    }

    saveState();
    return { success: true };
}

/**
 * 경험치 획득 및 레벨업 체크
 */
export function addExpToWanderer(wandererId, amount) {
    const wanderer = state.recruitedWanderers.find(w => w.id === wandererId);
    if (!wanderer) return;

    wanderer.exp += amount;
    const expNext = wanderer.level * 100; // 단순한 레벨업 공식: Lv * 100

    if (wanderer.exp >= expNext) {
        wanderer.level++;
        wanderer.exp -= expNext;
        wanderer.statPoints += 3; // 레벨업 시 스탯 포인트 3 지급
        // HP/정신력 회복 (선택 사항)
        wanderer.curSanity = Math.min(wanderer.maxSanity, wanderer.curSanity + 20);
    }
    saveState();
}

export function selectMap(map) {
    state.selectedMap = map;
}

// ─── Admin Tools ───

export function adminRefreshGuild() {
    refreshGuildPool();
    state.lastRefreshTimestamp = Math.floor(Date.now() / (1000 * 60 * 60));
}

export function adminRefreshShop() {
    refreshShopPool();
    state.lastShopRefreshTimestamp = Math.floor(Date.now() / (1000 * 60 * 60));
}

export function adminSendItem(itemId, qty = 1, expiryDays = 3) {
    const baseItem = ITEMS[itemId] || WEAPONS[itemId];
    if (baseItem) {
        const mailItems = [];
        if (!baseItem.stackable && qty > 1) {
            // 비스택성 아이템은 개별 항목으로 추가하여 하나의 우편으로 발송
            for (let i = 0; i < qty; i++) {
                mailItems.push({ ...baseItem, qty: 1 });
            }
        } else {
            mailItems.push({ ...baseItem, qty });
        }

        sendToMailbox(mailItems, t('ui.mailbox.sender_admin'), expiryDays);
        return true;
    }
    return false;
}

// ─── Recipe Unlock Logic ───

export function unlockRecipe(recipeId) {
    const state = getState();
    const recipe = RECIPES.find(r => r.result === recipeId);
    if (!recipe) return false;

    // Check if already unlocked
    if (state.unlockedRecipes.includes(recipeId)) return false;

    // Check castle level
    if (state.castleLevel < recipe.reqCastleLv) return false;

    // Check if player has the recipe item
    const scrollIdx = state.storage.findIndex(s => s && s.id === recipe.reqItem);
    if (scrollIdx === -1) return false;

    // Consume 1 scroll
    const scroll = state.storage[scrollIdx];
    if (scroll.qty > 1) {
        scroll.qty--;
    } else {
        state.storage[scrollIdx] = null;
    }

    // Unlock
    state.unlockedRecipes.push(recipeId);
    saveState();
    return true;
}

// Global hooks for console testing
window.__admin = {
    refreshGuild: adminRefreshGuild,
    refreshShop: adminRefreshShop,
    sendItem: adminSendItem,
    addGold: (amt) => { state.gold += amt; },
    setCastleLevel: (lv) => { state.castleLevel = lv; refreshShopPool(); }
};
