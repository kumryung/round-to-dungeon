// ─── Inline Inventory Panel ───
// Always-visible inventory panel rendered below the game board.
// Refreshes in real-time on any item change.

import { getInventory, useItem, equipFromSlot, removeItem, moveToSafeBag, retrieveFromSafeBag, getWeightStatus } from './inventory.js';
import { getDungeonState, removeStatusEffect, applyStatusEffect, clearAllStatusEffects } from './dungeonState.js';
import { getCombatState } from './combatEngine.js';
import { gradeColor } from './data/weapons.js';
import { SETTINGS } from './data/settings.js';
import { playSFX } from './soundEngine.js';
import { t } from './i18n.js';
import { buildItemStatBadges, buildItemReqBadges } from './utils/itemCardUtils.js';

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
    const localizedName = item.nameKey ? t(item.nameKey) : item.name;
    toast.innerHTML = `<span>${item.emoji}</span> <span>${localizedName}</span> ${t('logs.toast_gain', { name: '' }).replace('{emoji}', '')}`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast-visible'));
    setTimeout(() => {
        toast.classList.remove('toast-visible');
        setTimeout(() => toast.remove(), 400);
    }, 2000);
}

// ─── Internal rendering ───

function buildItemStatsHTML(item) {
    if (!item) return '';
    const statBadges = buildItemStatBadges(item);
    const reqBadges = buildItemReqBadges(item);
    let html = '';
    if (statBadges) html += `<div class="item-badge-row">${statBadges}</div>`;
    if (reqBadges) html += `<div class="item-badge-row item-badge-row-reqs">${reqBadges}</div>`;
    return html.replace(/"/g, '&quot;');
}

function buildPanelContent(inv) {
    const w = inv.equipped;
    let equipHTML = '';

    if (w) {
        const isBroken = w.durability <= 0 && w.durability !== Infinity;
        const durPct = w.durability === Infinity ? 100 : Math.round((w.durability / w.maxDurability) * 100);
        const durColor = durPct > 30 ? 'var(--gold)' : 'var(--red)';

        equipHTML = `
            <div class="inv-slot-in inv-equip-slot ${isBroken ? 'equip-broken' : ''} grade-${w.grade}" 
                 data-idx="0" data-type="equip" draggable="true" data-safe="false"
                 data-id="${w.id}"
                 data-tooltip-title="${w.emoji} ${w.nameKey ? t(w.nameKey) : w.name}"
                 data-tooltip-desc="${w.descKey ? t(w.descKey) : w.desc}"
                 data-tooltip-stats="${buildItemStatsHTML(w)}">
                <span class="slot-emoji-in">${w.emoji}</span>
                <div class="slot-dur-bar" style="border-top-color: ${durColor}; width: ${durPct}%;"></div>
                ${isBroken ? `<div class="slot-broken-mark">❌</div>` : ''}
            </div>
        `;
    } else {
        equipHTML = `
            <div class="inv-slot-in inv-equip-slot" data-idx="0" data-type="equip" data-safe="false">
                <span class="slot-emoji-in" style="opacity: 0.3;">👊</span>
            </div>
        `;
    }

    const slotHTML = inv.slots.map((item, i) => renderSlot(item, i, false)).join('');
    const safeHTML = inv.safeBag.map((item, i) => renderSlot(item, i, true)).join('');

    // Weight bar
    const ds = getDungeonState ? getDungeonState() : null;
    const wStatus = getWeightStatus(ds?.wanderer?.str || 0);
    const wPct = Math.min(100, Math.round(wStatus.ratio * 100));
    const tierColors = ['#4caf50', '#ffca28', '#ff7043', '#f44336', '#b71c1c'];
    const wColor = tierColors[wStatus.tier] || '#4caf50';
    const weightBarHTML = `
      <div class="weight-bar-container">
        <div class="weight-bar-label">
          ${wStatus.icon || '⚖️'} <span>${wStatus.current}/${wStatus.max}</span>
        </div>
        <div class="weight-bar">
          <div class="weight-bar-fill" style="width: ${wPct}%; background: ${wColor};"></div>
        </div>
      </div>
    `;

    return `
    <div class="inv-panel-inner">
      <!-- Left: Equipment -->
      <div class="inv-col-equip">
        <div class="inv-section-label">${t('ui.inventory.equipment')}</div>
        ${equipHTML}
      </div>

      <!-- Center: Main Inventory -->
      <div class="inv-col-main">
        <div class="inv-section-label">${t('ui.inventory.inventory')} (${inv.slots.filter(s => s).length}/12)</div>
        <div class="inv-grid-inline">${slotHTML}</div>
        ${weightBarHTML}
      </div>

      <!-- Right: Safe Bag -->
      <div class="inv-col-safe">
        <div class="inv-section-label">${t('ui.inventory.safe_bag')} (${inv.safeBag.filter(s => s).length}/2)</div>
        <div class="inv-safe-grid">${safeHTML}</div>
      </div>
    </div>

    <!-- Item popup anchor -->
    <div class="inv-popup-anchor" id="invPopupAnchor"></div>
    <div class="item-tooltip" id="itemTooltip"></div>
  `;
}

function renderSlot(item, index, isSafe) {
    if (!item) {
        return `<div class="inv-slot-in inv-empty-in" data-idx="${index}" data-type="${isSafe ? 'safeBag' : 'slots'}" data-safe="${isSafe}"></div>`;
    }
    const qtyBadge = (item.qty && item.qty > 1) ? `<span class="slot-qty">${item.qty}</span>` : '';
    const color = item.grade ? gradeColor(item.grade) : 'var(--text-dim)';

    // Weapon stats?
    let stats = buildItemStatsHTML(item);

    return `
    <div class="inv-slot-in inv-has-item-in grade-${item.grade}" data-idx="${index}" data-type="${isSafe ? 'safeBag' : 'slots'}" data-safe="${isSafe}" draggable="true"
         data-id="${item.id}"
         data-tooltip-title="${item.emoji} ${item.nameKey ? t(item.nameKey) : item.name}"
         data-tooltip-desc="${item.descKey ? t(item.descKey) : item.desc}"
         data-tooltip-stats="${stats}">
      <span class="slot-emoji-in">${item.emoji}</span>
      <span class="slot-name-in" style="color:${color}">${item.nameKey ? t(item.nameKey) : item.name}</span>
      ${qtyBadge}
    </div>
  `;
}

// ─── Slot interactions ───

function bindPanelSlotActions(panel) {
    // Click handling (existing)
    panel.querySelectorAll('.inv-has-item-in, .inv-equip-slot').forEach((el) => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            if (el.classList.contains('inv-equip-slot')) {
                // Equip slot popup for future use
            } else {
                const idx = parseInt(el.dataset.idx);
                const isSafe = el.dataset.safe === 'true';
                showInlinePopup(panel, el, idx, isSafe);
            }
        });

        // Tooltip handling
        el.addEventListener('mouseenter', (e) => showTooltip(e, el));
        el.addEventListener('mouseleave', () => hideTooltip());
        el.addEventListener('mousemove', (e) => moveTooltip(e));
    });

    // Drag and Drop implementation
    panel.querySelectorAll('.inv-slot-in').forEach(el => {
        el.addEventListener('dragstart', (e) => {
            if (!el.hasAttribute('draggable')) {
                e.preventDefault();
                return;
            }
            e.dataTransfer.setData('text/srcType', el.dataset.type);
            e.dataTransfer.setData('text/srcIdx', el.dataset.idx);
            el.classList.add('dragging');
        });
        el.addEventListener('dragend', () => {
            el.classList.remove('dragging');
            panel.querySelectorAll('.drag-over').forEach(dst => dst.classList.remove('drag-over'));
        });
        el.addEventListener('dragover', (e) => {
            e.preventDefault();
            el.classList.add('drag-over');
        });
        el.addEventListener('dragleave', () => {
            el.classList.remove('drag-over');
        });
        el.addEventListener('drop', (e) => {
            e.preventDefault();
            el.classList.remove('drag-over');
            handleItemDrop(e, el.dataset.type, parseInt(el.dataset.idx));
        });
    });
}

function handleItemDrop(e, dstType, dstIdx) {
    const srcType = e.dataTransfer.getData('text/srcType');
    const srcIdxString = e.dataTransfer.getData('text/srcIdx');
    if (!srcType || srcIdxString === '') return;

    const srcIdx = parseInt(srcIdxString);
    if (srcType === dstType && srcIdx === dstIdx) return;

    const inv = getInventory();
    if (!inv) return;

    const getRef = (type, idx) => {
        if (type === 'equip') return { parent: inv, key: 'equipped' };
        if (type === 'slots') return { parent: inv.slots, key: idx };
        if (type === 'safeBag') return { parent: inv.safeBag, key: idx };
        return null;
    };

    const src = getRef(srcType, srcIdx);
    const dst = getRef(dstType, dstIdx);
    if (!src || !dst) return;

    const srcItem = src.parent[src.key];
    const dstItem = dst.parent[dst.key];

    // Cannot swap a non-weapon into the equip slot
    if (dstType === 'equip' && srcItem && !srcItem.dmgMin) return;
    if (srcType === 'equip' && dstItem && !dstItem.dmgMin) return;

    // Swap items
    src.parent[src.key] = dstItem;
    dst.parent[dst.key] = srcItem;

    playSFX('itemPickup');
    refreshInlineInventory();
}

// ─── Tooltip Logic ───
function showTooltip(e, el) {
    const tooltip = document.getElementById('itemTooltip');
    if (!tooltip) return;

    const title = el.dataset.tooltipTitle;
    const desc = el.dataset.tooltipDesc;
    const stats = el.dataset.tooltipStats;

    if (!title) return;

    tooltip.innerHTML = `
        <div class="tooltip-title">${title}</div>
        <div class="tooltip-desc">${desc}</div>
        ${stats ? stats : ''}
    `;
    tooltip.classList.add('visible');
    moveTooltip(e);
}

function moveTooltip(e) {
    const tooltip = document.getElementById('itemTooltip');
    if (!tooltip || !tooltip.classList.contains('visible')) return;

    // Offset from mouse
    const x = e.clientX + 15;
    const y = e.clientY + 15;

    // Boundary check (simple)
    tooltip.style.left = `${Math.min(x, window.innerWidth - 220)}px`;
    tooltip.style.top = `${Math.min(y, window.innerHeight - 100)}px`;
}

function hideTooltip() {
    const tooltip = document.getElementById('itemTooltip');
    if (tooltip) tooltip.classList.remove('visible');
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
    <div class="popup-header">${item.emoji} ${item.nameKey ? t(item.nameKey) : item.name}</div>
    <p class="popup-desc">${item.descKey ? t(item.descKey) : item.desc}</p>
    <div class="popup-actions">
      ${isWeapon && !isSafe ? `<button class="popup-btn popup-equip" data-action="equip">${t('ui.inventory.action_equip')}</button>` : ''}
      ${isUsable ? `<button class="popup-btn popup-use" data-action="use">${t('ui.inventory.action_use')}</button>` : ''}
      ${!isSafe ? `<button class="popup-btn popup-safe" data-action="safe">${t('ui.inventory.action_safe')}</button>`
            : `<button class="popup-btn popup-retrieve" data-action="retrieve">${t('ui.inventory.action_retrieve')}</button>`}
      <button class="popup-btn popup-drop" data-action="drop">${t('ui.inventory.action_drop')}</button>
      <button class="popup-btn popup-cancel" data-action="cancel">${t('ui.inventory.action_close')}</button>
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
                label: t('items.t_torch.name'),
            });
            break;
    }

    // Refresh combat UI if active
    if (combat && window.__refreshCombatUI) {
        window.__refreshCombatUI();
    }
}
