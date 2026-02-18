// ─── Global Game State ───
import { CHARACTERS, generateWandererInstance } from './data/characters.js';
import { SHOP_DATA } from './data/shops.js';
import { ITEMS } from './data/items.js';

const state = {
    /** @type {number} 보유 골드 */
    gold: 1000,

    /** @type {number} 성 레벨 */
    castleLevel: 1,

    /** @type {Array<object>} 길드에서 영입 가능한 방랑자 목록 */
    availableWanderers: [],

    /** @type {Array<object>} 영입한 방랑자 목록 */
    recruitedWanderers: [],

    /** @type {Array<object|null>} 창고 아이템 목록 */
    storage: new Array(30).fill(null),

    /** @type {number} 창고 최대 슬롯 (최대 100) */
    storageMaxSlots: 30,

    /** @type {Array<object>} 우편함 목록 */
    mailbox: [],

    /** @type {Array<object|null>} 상점 판매 목록 (10슬롯) */
    shopInv: new Array(10).fill(null),

    /** @type {object|null} 던전에 출전할 캐릭터 */
    selectedWanderer: null,

    /** @type {object|null} 선택한 던전 맵 */
    selectedMap: null,

    /** @type {number|null} 마지막 리프레쉬 시간 (Hour 기준) */
    lastRefreshTimestamp: null,

    /** @type {number|null} 마지막 상점 리프레쉬 시간 */
    lastShopRefreshTimestamp: null,
};

// Initialize
checkAndRefreshAll();

export function getState() {
    return state;
}

/**
 * 전역 정각 체크 및 갱신 (길드 & 상점) + 만료 우편 삭제
 */
export function checkAndRefreshAll() {
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

export function checkAndRefreshShop() {
    const currentHourTimestamp = Math.floor(Date.now() / (1000 * 60 * 60));
    if (state.lastShopRefreshTimestamp === null || currentHourTimestamp > state.lastShopRefreshTimestamp) {
        refreshShopPool();
        state.lastShopRefreshTimestamp = currentHourTimestamp;
        return true;
    }
    return false;
}

export function refreshShopPool() {
    state.shopInv = SHOP_DATA.slots.map(slot => {
        if (state.castleLevel < slot.unlockLevel) return null; // Locked

        const totalWeight = slot.pool.reduce((sum, e) => sum + e.weight, 0);
        let roll = Math.random() * totalWeight;
        for (const entry of slot.pool) {
            roll -= entry.weight;
            if (roll <= 0) {
                const baseItem = ITEMS[entry.id];
                return { ...baseItem, price: entry.price, qty: 1, bought: false };
            }
        }
        return null;
    });
}

// ─── Storage & Gold Logic ───

export function addGold(amount) {
    state.gold += amount;
}

export function useGold(amount) {
    if (state.gold >= amount) {
        state.gold -= amount;
        return true;
    }
    return false;
}

/**
 * 창고에 아이템 추가 (자동 스택 지원)
 */
export function addItemToStorage(item) {
    if (!item) return false;

    // Stackable 체크
    if (item.stackable) {
        const existing = state.storage.find(s => s && s.id === item.id);
        if (existing) {
            existing.qty = (existing.qty || 1) + (item.qty || 1);
            return true;
        }
    }

    // 빈 슬롯 찾기
    const emptyIdx = state.storage.findIndex(s => s === null);
    if (emptyIdx === -1) return false;

    state.storage[emptyIdx] = { ...item };
    return true;
}

export function removeFromStorage(index) {
    const item = state.storage[index];
    state.storage[index] = null;
    return item;
}

export function upgradeStorage() {
    if (state.storageMaxSlots >= 100) return false;

    const cost = state.storageMaxSlots * 50;
    if (useGold(cost)) {
        state.storageMaxSlots = Math.min(100, state.storageMaxSlots + 10);
        const newStorage = new Array(state.storageMaxSlots).fill(null);
        state.storage.forEach((item, i) => { if (i < newStorage.length) newStorage[i] = item; });
        state.storage = newStorage;
        return true;
    }
    return false;
}

// ─── Mailbox Logic ───

export function sendToMailbox(items, subject = "기사단 메시지", expiryDays = 3) {
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

export function buyShopItem(slotIndex) {
    const item = state.shopInv[slotIndex];
    if (!item || item.bought) return false;

    if (state.gold >= item.price) {
        const added = addItemToStorage(item);
        if (added) {
            state.gold -= item.price;
            item.bought = true;
            return true;
        }
    }
    return false;
}

// ─── Character & Map Logic ───

export function recruitWanderer(characterInstance) {
    if (!state.recruitedWanderers.find((w) => w.id === characterInstance.id)) {
        state.recruitedWanderers.push(characterInstance);
        const available = state.availableWanderers.find(w => w.id === characterInstance.id);
        if (available) available.isRecruited = true;
    }
}

export function dismissWanderer(characterId) {
    state.recruitedWanderers = state.recruitedWanderers.filter(
        (w) => w.id !== characterId
    );
    if (state.selectedWanderer?.id === characterId) {
        state.selectedWanderer = null;
    }
}

export function selectWanderer(character) {
    state.selectedWanderer = character;
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
    const baseItem = ITEMS[itemId];
    if (baseItem) {
        sendToMailbox([{ ...baseItem, qty }], "관리자 지급 물품", expiryDays);
        return true;
    }
    return false;
}

// Global hooks for console testing
window.__admin = {
    refreshGuild: adminRefreshGuild,
    refreshShop: adminRefreshShop,
    sendItem: adminSendItem,
    addGold: (amt) => { state.gold += amt; },
    setCastleLevel: (lv) => { state.castleLevel = lv; refreshShopPool(); }
};
