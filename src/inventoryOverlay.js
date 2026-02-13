// ─── Inline Inventory Panel ───
// Always-visible inventory panel rendered below the game board.
// Refreshes in real-time on any item change.

import { getInventory, useItem, equipFromSlot, removeItem, moveToSafeBag, retrieveFromSafeBag } from './inventory.js';
import { getDungeonState, removeStatusEffect, applyStatusEffect, clearAllStatusEffects } from './dungeonState.js';
import { getCombatState } from './combatEngine.js';
import { gradeColor } from './data/weapons.js';
import { SETTINGS } from './data/settings.js';

// ─── Public API ───

/**
 * Build initial inventory panel HTML (call once during scene mount).
 * Returns an HTML string for the panel container.
 */
export function buildInlineInventoryHTML() {
    return `<div class="inv-panel" id="invPanel"></div>`;
}

/**
 * Refresh the inline inventory panel contents.
 * Call this after any item add/remove/use/equip event.
 */
export function refreshInlineInventory() {
    const panel = document.getElementById('invPanel');
    if (!panel) return;

    const inv = getInventory();
    if (!inv) { panel.innerHTML = ''; return; }

    panel.innerHTML = buildPanelContent(inv);
    bindPanelSlotActions(panel);
}

// ─── Toast notification ───

export function showItemToast(item) {
    const toast = document.createElement('div');
    toast.className = 'item-toast';
    toast.innerHTML = `<span>${item.emoji}</span> <span>${item.name}</span> 획득!`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast-visible'));
    setTimeout(() => {
        toast.classList.remove('toast-visible');
        setTimeout(() => toast.remove(), 400);
    }, 2000);
}

// ─── Internal rendering ───

function buildPanelContent(inv) {
    const w = inv.equipped;
    const durPct = w.durability === Infinity ? 100 : Math.round((w.durability / w.maxDurability) * 100);
    const durText = w.durability === Infinity ? '∞' : `${w.durability}/${w.maxDurability}`;
    const durColor = durPct > 30 ? 'var(--gold)' : 'var(--red)';
    const broken = w.durability <= 0 && w.durability !== Infinity;

    const slotHTML = inv.slots.map((item, i) => renderSlot(item, i, false)).join('');
    const safeHTML = inv.safeBag.map((item, i) => renderSlot(item, i, true)).join('');

    return `
    <div class="inv-panel-inner">
      <!-- Left: Equipment -->
      <div class="inv-col-equip">
        <div class="inv-section-label">⚔️ 장비</div>
        <div class="inv-equip-card ${broken ? 'equip-broken' : ''}">
          <span class="equip-emoji">${w.emoji}</span>
          <div class="equip-info">
            <span class="equip-name" style="color:${gradeColor(w.grade)}">${w.name}</span>
            <span class="equip-dmg">DMG ${w.dmgMin}~${w.dmgMax}</span>
            <div class="equip-dur-bar"><div class="equip-dur-fill" style="width:${durPct}%;background:${durColor}"></div></div>
            <span class="equip-dur-text">${broken ? '💔 파손' : durText}</span>
          </div>
        </div>
      </div>

      <!-- Center: Main Inventory -->
      <div class="inv-col-main">
        <div class="inv-section-label">🎒 인벤토리 (${inv.slots.filter(s => s).length}/12)</div>
        <div class="inv-grid-inline">${slotHTML}</div>
      </div>

      <!-- Right: Safe Bag -->
      <div class="inv-col-safe">
        <div class="inv-section-label">🔒 안전 가방 (${inv.safeBag.filter(s => s).length}/2)</div>
        <div class="inv-safe-grid">${safeHTML}</div>
      </div>
    </div>

    <!-- Item popup anchor -->
    <div class="inv-popup-anchor" id="invPopupAnchor"></div>
  `;
}

function renderSlot(item, index, isSafe) {
    if (!item) {
        return `<div class="inv-slot-in inv-empty-in" data-idx="${index}" data-safe="${isSafe}"></div>`;
    }
    const qtyBadge = (item.qty && item.qty > 1) ? `<span class="slot-qty">${item.qty}</span>` : '';
    const color = item.grade ? gradeColor(item.grade) : 'var(--text-dim)';
    return `
    <div class="inv-slot-in inv-has-item-in" data-idx="${index}" data-safe="${isSafe}"
         data-id="${item.id}" title="${item.desc}">
      <span class="slot-emoji-in">${item.emoji}</span>
      <span class="slot-name-in" style="color:${color}">${item.name}</span>
      ${qtyBadge}
    </div>
  `;
}

// ─── Slot interactions ───

function bindPanelSlotActions(panel) {
    panel.querySelectorAll('.inv-has-item-in').forEach((el) => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(el.dataset.idx);
            const isSafe = el.dataset.safe === 'true';
            showInlinePopup(panel, el, idx, isSafe);
        });
    });
}

function showInlinePopup(panel, slotEl, slotIndex, isSafe) {
    // Remove previous popups
    document.querySelectorAll('.inv-inline-popup').forEach(el => el.remove());

    const inv = getInventory();
    const arr = isSafe ? inv.safeBag : inv.slots;
    const item = arr[slotIndex];
    if (!item) return;

    const isWeapon = !!item.dmgMin;
    const isUsable = item.type === 'consumable' || item.id === 't_holywater';

    const popup = document.createElement('div');
    popup.className = 'inv-inline-popup';

    // Position popup near the slot (fixed positioning relative to viewport)
    const rect = slotEl.getBoundingClientRect();

    // Calculate position: center horizontally on slot, place above slot
    // Note: .inv-inline-popup is fixed position in CSS (need to update CSS too) or absolute in body
    popup.style.position = 'fixed';
    popup.style.left = `${rect.left + rect.width / 2}px`;
    popup.style.bottom = `${window.innerHeight - rect.top + 8}px`; // Above the slot

    popup.innerHTML = `
    <div class="popup-header">${item.emoji} ${item.name}</div>
    <p class="popup-desc">${item.desc}</p>
    <div class="popup-actions">
      ${isWeapon && !isSafe ? `<button class="popup-btn popup-equip" data-action="equip">장착</button>` : ''}
      ${isUsable ? `<button class="popup-btn popup-use" data-action="use">사용</button>` : ''}
      ${!isSafe ? `<button class="popup-btn popup-safe" data-action="safe">안전</button>`
            : `<button class="popup-btn popup-retrieve" data-action="retrieve">회수</button>`}
      <button class="popup-btn popup-drop" data-action="drop">버리기</button>
      <button class="popup-btn popup-cancel" data-action="cancel">닫기</button>
    </div>
  `;

    // Ensure layout is calculated before showing
    popup.style.visibility = 'hidden';
    document.body.appendChild(popup);

    requestAnimationFrame(() => {
        if (document.body.contains(popup)) {
            popup.style.visibility = 'visible';
        }
    });

    // Close on click outside
    const closeHandler = (e) => {
        if (!popup.contains(e.target) && e.target !== slotEl) {
            popup.remove();
            document.removeEventListener('click', closeHandler);
        }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 0);

    popup.querySelectorAll('.popup-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            if (action !== 'cancel') {
                handleItemAction(action, slotIndex, isSafe, item);
            }
            popup.remove();
            document.removeEventListener('click', closeHandler);
            refreshInlineInventory();
            // Also refresh HUD since HP/sanity might change
            const hudPanel = document.getElementById('hudPanel');
            if (hudPanel && typeof window.__refreshHUD === 'function') {
                window.__refreshHUD();
            }
        });
    });
}

function handleItemAction(action, slotIndex, isSafe, item) {
    const ds = getDungeonState();

    switch (action) {
        case 'equip': {
            equipFromSlot(slotIndex);

            // Sync with combat if active
            const combat = getCombatState();
            if (combat) {
                const inv = getInventory();
                const w = inv.equipped;
                const baseAtk = w ? Math.round((w.dmgMin + w.dmgMax) / 2) : combat.player.str + 5;
                combat.player.atk = baseAtk;
                // No visual update needed for ATK, but state is updated
            }
            break;
        }
        case 'use': {
            const result = useItem(slotIndex, isSafe);
            if (result) {
                applyItemEffect(result, ds);
            }
            break;
        }
        case 'safe':
            if (!moveToSafeBag(slotIndex)) {
                // Full
            }
            break;
        case 'retrieve':
            if (!retrieveFromSafeBag(slotIndex)) {
                // Full
            }
            break;
        case 'drop':
            removeItem(slotIndex, isSafe);
            break;
    }
}

function applyItemEffect(result, ds) {
    const combat = getCombatState();

    switch (result.effect) {
        case 'heal':
            ds.currentHp = Math.min(ds.maxHp, ds.currentHp + result.value);
            if (combat) {
                combat.player.hp = Math.min(combat.player.maxHp, combat.player.hp + result.value);
            }
            break;
        case 'sanity_restore':
            ds.sanity = Math.min(ds.maxSanity, ds.sanity + result.value);
            if (combat) {
                combat.player.sanity = Math.min(combat.player.traits?.includes('madness') ? 0 : 100, combat.player.sanity + result.value);
                // Simplified sanity check, ignoring complex trait logic for now or assumed sync
                combat.player.sanity = ds.sanity; // Better to just sync from ds since logic is matching
            }
            break;
        case 'full_restore':
            ds.currentHp = ds.maxHp;
            ds.sanity = ds.maxSanity;
            clearAllStatusEffects();
            if (combat) {
                combat.player.hp = ds.maxHp;
                combat.player.sanity = ds.sanity;
            }
            break;
        case 'cure_poison':
            removeStatusEffect('poison');
            break;
        case 'cure_fracture':
            removeStatusEffect('fracture');
            // Restore agi if it was lowered
            if (combat) {
                combat.player.agi = ds.wanderer.agi || combat.player.agi;
            }
            break;
        case 'torch':
            applyStatusEffect({
                type: 'torch_buff',
                duration: SETTINGS.torchDuration,
                icon: '🔦',
                label: '횃불',
            });
            break;
    }

    // Refresh combat UI if active
    if (combat && window.__refreshCombatUI) {
        window.__refreshCombatUI();
    }
}
