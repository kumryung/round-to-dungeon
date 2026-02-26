// ─── Item Card Utilities ───
// Shared helper functions for rendering item cards with unified badge-style UI.
// Reference design: colored stat badges + requirement badges + grade coloring.

import { t } from '../i18n.js';

export const GRADE_COLOR = {
    common: '#9ca3af',
    uncommon: '#5b8c5a',
    magic: '#4a7fb5',
    rare: '#8b5cf6',
    epic: '#e06c00',
    legendary: '#f59e0b',
};

/**
 * Build stat badge HTML for an item.
 * Returns safe, unescaped HTML string (NOT for use inside data attributes).
 * @param {object} item
 * @returns {string} HTML string
 */
export function buildItemStatBadges(item) {
    if (!item) return '';
    let html = '';

    // ── Equipment Primary Stats ──
    if (item.type === 'weapon' || item.dmgMin !== undefined) {
        html += `<span class="item-badge item-badge-atk">⚔️ DMG ${item.dmgMin ?? 0}~${item.dmgMax ?? 0}</span>`;
        if (item.durability !== undefined && item.durability !== null) {
            const dur = item.durability === Infinity ? '∞' : item.durability;
            const maxDur = item.maxDurability === Infinity ? '∞' : (item.maxDurability ?? '?');
            html += `<span class="item-badge item-badge-dur">🔧 ${dur}/${maxDur}</span>`;
        }
    } else if (item.type === 'armor') {
        if (item.def) html += `<span class="item-badge item-badge-def">🛡 DEF +${item.def}</span>`;
        if (item.maxHp) html += `<span class="item-badge item-badge-hp">❤️ HP +${item.maxHp}</span>`;
    } else if (item.type === 'accessory') {
        const STAT_BADGE_MAP = {
            str: { icon: '⚔️', className: 'item-badge-atk' },
            agi: { icon: '💨', className: 'item-badge-spd' },
            spd: { icon: '💨', className: 'item-badge-spd' },
            vit: { icon: '❤️', className: 'item-badge-hp' },
            dex: { icon: '🎯', className: 'item-badge-dex' },
            luk: { icon: '🍀', className: 'item-badge-luk' },
        };
        ['str', 'agi', 'spd', 'vit', 'dex', 'luk'].forEach(s => {
            if (item[s]) {
                const map = STAT_BADGE_MAP[s];
                html += `<span class="item-badge ${map?.className || ''}">${map?.icon || ''} ${s.toUpperCase()} +${item[s]}</span>`;
            }
        });
    }

    // ── Consumable / Tool Effects ──
    if (item.effect) {
        const val = item.value;
        const dur = item.duration;
        switch (item.effect) {
            case 'heal':
                html += `<span class="item-badge item-badge-hp">❤️ HP +${val}</span>`; break;
            case 'full_restore':
                html += `<span class="item-badge item-badge-hp">❤️ HP 완전 회복</span>`;
                html += `<span class="item-badge item-badge-san">🧠 SAN 완전 회복</span>`; break;
            case 'sanity_restore':
                html += `<span class="item-badge item-badge-san">🧠 SAN +${val}</span>`; break;
            case 'str_boost':
                html += `<span class="item-badge item-badge-atk">⚔️ STR +${val}${dur ? ` (${dur}${t('combat.turns', '턴')})` : ''}</span>`; break;
            case 'def_boost':
                html += `<span class="item-badge item-badge-def">🛡 DEF +${val}${dur ? ` (${dur}${t('combat.turns', '턴')})` : ''}</span>`; break;
            case 'spd_boost':
                html += `<span class="item-badge item-badge-spd">💨 SPD +${val}${dur ? ` (${dur}${t('combat.turns', '턴')})` : ''}</span>`; break;
            case 'cure_poison':
                html += `<span class="item-badge item-badge-cure">✨ 중독 해제</span>`; break;
            case 'cure_fracture':
                html += `<span class="item-badge item-badge-cure">🦴 골절 치료</span>`; break;
        }
    }

    return html;
}

/**
 * Build requirement badge HTML for an item.
 * @param {object} item
 * @returns {string} HTML string
 */
export function buildItemReqBadges(item) {
    if (!item) return '';
    const reqs = item.reqStats || item.reqStat;
    if (!reqs || Object.keys(reqs).length === 0) return '';
    return Object.entries(reqs)
        .map(([s, val]) => `<span class="item-badge item-badge-req">${s.toUpperCase()} ${val}</span>`)
        .join('');
}

/**
 * Build a unified item card HTML matching the reference design.
 * Suitable for shop cards, storage tooltips, inventory popups, etc.
 * @param {object} item
 * @param {object} [opts]
 * @param {string} [opts.actionHtml] - Optional action button HTML (e.g. Buy / Equip button)
 * @returns {string} HTML string
 */
export function buildItemCardHTML(item, opts = {}) {
    if (!item) return '';
    const color = GRADE_COLOR[item.grade] || '#ccc';
    const statBadges = buildItemStatBadges(item);
    const reqBadges = buildItemReqBadges(item);
    const nameText = item.nameKey ? `<span data-i18n="${item.nameKey}">${item.nameKey}</span>` : (item.name || '?');

    return `
        <div class="item-card" style="border-color: ${color};">
            <div class="item-card-header">
                <span class="item-card-emoji" style="border-color:${color};">${item.emoji || '?'}</span>
                <div class="item-card-meta">
                    <div class="item-card-name" style="color:${color};">${item.nameKey ? t(item.nameKey) : (item.name || '?')}</div>
                    <div class="item-card-desc">${item.descKey ? t(item.descKey) : (item.desc || '')}</div>
                </div>
                ${opts.actionHtml ? `<div class="item-card-action">${opts.actionHtml}</div>` : ''}
            </div>
            ${statBadges || reqBadges ? `
            <div class="item-card-badges">
                ${statBadges ? `<div class="item-badge-row">${statBadges}</div>` : ''}
                ${reqBadges ? `<div class="item-badge-row item-badge-row-reqs">${reqBadges}</div>` : ''}
            </div>` : ''}
        </div>
    `;
}

/**
 * Encode stat+req badges as an HTML string safe for use in data-* attributes.
 * @param {object} item
 * @returns {string}
 */
export function buildItemStatsAttr(item) {
    const badges = buildItemStatBadges(item) + buildItemReqBadges(item);
    if (!badges) return '';
    return `<div class="item-badge-row">${badges}</div><div class="item-badge-row item-badge-row-reqs">${buildItemReqBadges(item)}</div>`
        .replace(/"/g, '&quot;');
}

/**
 * Build a unified hover tooltip HTML for an item slot.
 * Suitable for use inside `.slot-tooltip` elements in storage grid, dungeon prep, etc.
 * @param {object} item
 * @param {object} [opts]
 * @param {boolean} [opts.showReqs=true] - Whether to show requirement badges
 * @returns {string} HTML string
 */
export function buildItemTooltipHTML(item, opts = {}) {
    if (!item) return '';
    const { showReqs = true } = opts;
    const color = GRADE_COLOR[item.grade] || '#ccc';
    const displayName = item.nameKey ? t(item.nameKey) : (item.name || '?');
    const displayDesc = item.descKey ? t(item.descKey) : (item.desc || '');
    const statBadges = buildItemStatBadges(item);
    const reqBadges = showReqs ? buildItemReqBadges(item) : '';

    return `
        <div class="tooltip-title" style="color:${color};">${displayName}</div>
        ${displayDesc ? `<div class="tooltip-desc">${displayDesc}</div>` : ''}
        ${statBadges ? `<div class="item-badge-row" style="margin-top:6px;">${statBadges}</div>` : ''}
        ${reqBadges ? `<div class="item-badge-row item-badge-row-reqs" style="margin-top:4px;">${reqBadges}</div>` : ''}
    `.trim();
}
