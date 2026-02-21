// ─── Event Overlay UI ───
// Handles both immediate and interactive dungeon events.

import { t } from './i18n.js';
import { getInventory, removeItem } from './inventory.js';
import { getDungeonState, applyStatusEffect, reduceSanity, grantExp } from './dungeonState.js';
import { weightedPick } from './data/events.js';
import { rollChestLoot, ITEMS } from './data/items.js';
import { addItem } from './inventory.js';
import { showItemToast } from './inventoryOverlay.js';

/**
 * Apply a resolved event outcome object to the dungeon state.
 * @param {object} outcome   - The rolled outcome
 * @param {function} addLog  - Dungeon log function
 * @param {function} refreshHUD
 * @param {function} refreshInv
 * @returns {boolean} true if player died
 */
export function applyOutcome(outcome, addLog, refreshHUD, refreshInv) {
    const ds = getDungeonState();

    if (outcome.logKey) addLog(t(outcome.logKey, outcome.logKey));

    // HP changes (flat)
    if (outcome.hpDmg) {
        ds.currentHp = Math.max(0, ds.currentHp - outcome.hpDmg);
        addLog(`❤️ HP -${outcome.hpDmg}`);
    }
    if (outcome.hpHeal) {
        ds.currentHp = Math.min(ds.maxHp, ds.currentHp + outcome.hpHeal);
    }
    // HP changes (percent)
    if (outcome.hpDmgPct) {
        const dmg = Math.floor(ds.maxHp * outcome.hpDmgPct);
        ds.currentHp = Math.max(0, ds.currentHp - dmg);
        addLog(`❤️ HP -${dmg}`);
    }
    if (outcome.hpHealPct) {
        const heal = Math.floor(ds.maxHp * Math.min(outcome.hpHealPct, 1.0));
        ds.currentHp = Math.min(ds.maxHp, ds.currentHp + heal);
    }

    // Sanity changes
    if (outcome.sanityDmg) reduceSanity(outcome.sanityDmg);
    if (outcome.sanityHeal) ds.sanity = Math.min(ds.maxSanity, ds.sanity + outcome.sanityHeal);
    if (outcome.sanityDmgPct) reduceSanity(Math.floor(ds.maxSanity * outcome.sanityDmgPct));
    if (outcome.sanityHealPct) ds.sanity = Math.min(ds.maxSanity, ds.sanity + Math.floor(ds.maxSanity * outcome.sanityHealPct));

    // Status effects
    if (outcome.status) applyStatusEffect(outcome.status);
    if (outcome.status2) applyStatusEffect(outcome.status2);

    // XP
    if (outcome.xpGain) grantExp(outcome.xpGain);

    // Gold
    if (outcome.lootGold) {
        // handled by gameState via addLog for now - future: import addGold
        addLog(`💰 골드 ${outcome.lootGold > 0 ? '+' : ''}${outcome.lootGold}`);
    }

    // Loot
    if (outcome.lootChest) {
        const loot = rollChestLoot();
        const added = addItem(loot);
        if (added) {
            addLog(`📦 ${t(loot.nameKey || '', loot.name || '')} 획득!`);
            showItemToast(loot);
        } else {
            addLog(t('logs.chest_full', '인벤토리가 가득 찼습니다.'));
        }
    }
    if (outcome.lootMaterial) {
        // Roll a random material from common pool
        const mats = ['mat_wood', 'mat_iron_ore', 'mat_leather_strap', 'mat_sticky_sap', 'mat_sharp_blade'];
        const matId = mats[Math.floor(Math.random() * mats.length)];
        const mat = ITEMS[matId];
        if (mat && addItem(mat)) {
            addLog(`🪵 ${t(mat.nameKey || '', mat.name || '')} 획득!`);
        }
    }
    if (outcome.lootItem) {
        const it = ITEMS[outcome.lootItem];
        if (it && addItem(it)) addLog(`🎁 ${t(it.nameKey || '', it.name || '')} 획득!`);
    }
    if (outcome.lootMultiple) {
        for (let i = 0; i < outcome.lootMultiple; i++) {
            const loot = rollChestLoot();
            if (addItem(loot)) addLog(`📦 ${t(loot.nameKey || '', loot.name || '')} 획득!`);
        }
    }
    if (outcome.lootEpic) {
        // For now treat as chest loot (future: weighted high-quality roll)
        const loot = rollChestLoot();
        if (addItem(loot)) {
            addLog(`✨ (희귀) ${t(loot.nameKey || '', loot.name || '')} 획득!`);
            showItemToast(loot);
        }
    }

    refreshHUD(ds);
    refreshInv();
    return ds.currentHp <= 0;
}

/**
 * Show an interactive event modal.
 * @param {object} evt         - The event definition
 * @param {function} addLog
 * @param {function} refreshHUD
 * @param {function} refreshInv
 * @param {function} onDone    - Called after choice resolved (isDead: boolean, forceEncounter: boolean)
 */
export function showEventModal(evt, addLog, refreshHUD, refreshInv, onDone) {
    const inv = getInventory();
    const overlay = document.createElement('div');
    overlay.className = 'event-overlay';
    overlay.innerHTML = `
    <div class="event-modal fade-in">
      <div class="event-modal-header">
        <span class="event-emoji">${evt.emoji || '❓'}</span>
        <h3 class="event-title">${t(evt.nameKey || '', evt.name || '이벤트')}</h3>
      </div>
      <p class="event-desc">${t(evt.descKey || '', evt.desc || '')}</p>
      <div class="event-choices" id="eventChoices"></div>
    </div>
  `;

    const choicesEl = overlay.querySelector('#eventChoices');

    for (const choice of (evt.choices || [])) {
        // Validate item requirement
        let disabled = false;
        let reqLabel = '';
        if (choice.reqItem) {
            const hasItem = inv.slots.some(s => s && s.id === choice.reqItem) || inv.safeBag.some(s => s && s.id === choice.reqItem);
            if (!hasItem) {
                disabled = true;
                const reqIt = ITEMS[choice.reqItem];
                reqLabel = `${t(reqIt?.nameKey || '', reqIt?.name || choice.reqItem)} 필요`;
            }
        }
        if (choice.reqItemType) {
            // Type-based check (material, consumable_food, etc.)
            const typeMap = {
                'material_wood': s => s && s.id === 'mat_wood',
                'material_ore': s => s && (s.id === 'mat_iron_ore' || s.id === 'mat_steel_part'),
                'material_mana': s => s && s.id === 'mat_mana_stone',
                'material_rope': s => s && s.type === 'material' && s.id.includes('strap'),
                'consumable_food': s => s && s.type === 'consumable' && (s.id === 'c_herb' || s.id === 'c_bandage'),
                'material': s => s && s.type === 'material',
            };
            const checker = typeMap[choice.reqItemType] || (() => false);
            const has = inv.slots.some(checker) || inv.safeBag.some(checker);
            if (!has) { disabled = true; reqLabel = `재료 필요`; }
        }

        const btn = document.createElement('button');
        btn.className = 'btn-event-choice';
        if (disabled) btn.classList.add('disabled');
        if (disabled) btn.disabled = true;

        btn.innerHTML = `<span class="event-choice-label">${t(choice.labelKey || '', choice.label || '선택')}</span>`;
        if (reqLabel) {
            btn.innerHTML += `<span class="event-choice-req">${reqLabel}</span>`;
        }

        btn.addEventListener('click', () => {
            overlay.remove();
            // Consume item if needed
            if (!disabled && choice.consumeItem) {
                const targetId = choice.reqItem;
                const typeMap2 = {
                    'material_wood': 'mat_wood', 'material_ore': 'mat_iron_ore', 'material_mana': 'mat_mana_stone',
                };
                const consumeId = targetId || typeMap2[choice.reqItemType];
                if (consumeId) {
                    const slotIdx = inv.slots.findIndex(s => s && s.id === consumeId);
                    if (slotIdx >= 0) removeItem('slots', slotIdx);
                    else {
                        const sbIdx = inv.safeBag.findIndex(s => s && s.id === consumeId);
                        if (sbIdx >= 0) removeItem('safeBag', sbIdx);
                    }
                }
            }

            const outcome = weightedPick(choice.outcomes || [{ weight: 100 }]);
            const died = applyOutcome(outcome, addLog, refreshHUD, refreshInv);
            onDone({ died, forceEncounter: !!outcome.forceEncounter, weakenNextBattle: !!outcome.weakenNextBattle });
        });

        choicesEl.appendChild(btn);
    }

    document.body.appendChild(overlay);
}
