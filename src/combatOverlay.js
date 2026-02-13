// ─── Combat Overlay ───
// Full-screen overlay UI for turn-based combat

import {
    getCombatState, getHitChance, playerAttack, monsterAttack,
    attemptFlee, determineInitiative,
} from './combatEngine.js';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Show combat overlay and run combat loop.
 * @param {object} monster - Monster instance (from getMonster)
 * @param {object} callbacks - { onVictory, onDefeat, onFlee }
 */
export async function showCombat(monster, callbacks = {}) {
    const combat = getCombatState();
    if (!combat) return;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'combat-overlay';
    overlay.id = 'combatOverlay';
    overlay.innerHTML = buildCombatHTML(combat);
    document.body.appendChild(overlay);

    // Expose refresh for inventory usage
    window.__refreshCombatUI = () => {
        updatePlayerHP();
        updateMonsterHP();
        refreshHitChances();
    };

    // Fade in
    requestAnimationFrame(() => overlay.classList.add('combat-visible'));

    // Determine initiative
    await delay(400);
    const first = determineInitiative();
    refreshCombatLog();

    if (first === 'monster') {
        await delay(600);
        await doMonsterTurn();
        if (combat.result === 'defeat') {
            await handleResult(callbacks);
            return;
        }
    }

    // Enable player actions
    enablePlayerActions(callbacks);
}

function buildCombatHTML(combat) {
    const m = combat.monster;
    const p = combat.player;
    const hpPercent = Math.round((m.hp / m.maxHp) * 100);
    const playerHpPercent = Math.round((p.hp / p.maxHp) * 100);

    // Build part buttons
    const parts = ['head', 'body', 'legs'];
    const partIcons = { head: '🎯', body: '🫁', legs: '🦵' };
    const partNames = { head: '머리', body: '몸통', legs: '다리' };

    const partButtons = parts.map((part) => {
        const enabled = m.parts[part];
        const hitChance = enabled ? getHitChance(part) : 0;
        return `
            <button class="part-btn ${enabled ? '' : 'part-disabled'}"
                    data-part="${part}"
                    ${enabled ? '' : 'disabled'}>
                <span class="part-icon">${partIcons[part]}</span>
                <span class="part-name">${partNames[part]}</span>
                <span class="part-hit">${enabled ? hitChance + '%' : '불가'}</span>
            </button>
        `;
    }).join('');

    return `
        <div class="combat-container">
            <!-- Monster section -->
            <div class="combat-monster-section">
                <div class="combat-monster-header">
                    <span class="combat-monster-emoji">${m.emoji}</span>
                    <div class="combat-monster-info">
                        <h2 class="combat-monster-name">${m.name}</h2>
                        <p class="combat-monster-sub">${m.nameEn} · Lv.${m.currentLevel}</p>
                        <p class="combat-monster-ability">${m.abilityDesc}</p>
                    </div>
                </div>
                <div class="combat-hp-section">
                    <label class="combat-hp-label">Monster HP</label>
                    <div class="combat-hp-bar monster-hp-bar">
                        <div class="combat-hp-fill" id="monsterHpFill" style="width:${hpPercent}%"></div>
                        <span class="combat-hp-text" id="monsterHpText">${m.hp}/${m.maxHp}</span>
                    </div>
                </div>
                <div class="combat-damage-area" id="monsterDamageArea"></div>
            </div>

            <!-- Body part selection -->
            <div class="combat-action-section">
                <p class="combat-action-label">부위를 선택하여 공격하세요</p>
                <div class="combat-parts" id="combatParts">
                    ${partButtons}
                </div>
            </div>

            <!-- Player HP -->
            <div class="combat-player-section">
                <div class="combat-player-header">
                    <span class="combat-player-portrait">${p.portrait}</span>
                    <span class="combat-player-name">${p.name}</span>
                </div>
                <div class="combat-hp-section">
                    <label class="combat-hp-label">Player HP</label>
                    <div class="combat-hp-bar player-hp-bar">
                        <div class="combat-hp-fill" id="playerHpFill" style="width:${playerHpPercent}%"></div>
                        <span class="combat-hp-text" id="playerHpText">${p.hp}/${p.maxHp}</span>
                    </div>
                </div>
                <div class="combat-damage-area" id="playerDamageArea"></div>
            </div>

            <!-- Combat log + flee -->
            <div class="combat-log-section">
                <div class="combat-log" id="combatLog"></div>
                <button class="btn-flee" id="btnFlee">🏃 도망가기</button>
            </div>
        </div>
    `;
}

// ─── Player Actions ───

function enablePlayerActions(callbacks) {
    const combat = getCombatState();
    if (!combat || combat.result) return;

    const partsEl = document.getElementById('combatParts');
    if (partsEl) {
        partsEl.querySelectorAll('.part-btn:not(.part-disabled)').forEach((btn) => {
            btn.disabled = false;
            btn.onclick = async () => {
                disableAllActions();
                const part = btn.dataset.part;
                await doPlayerTurn(part, callbacks);
            };
        });
    }

    const fleeBtn = document.getElementById('btnFlee');
    if (fleeBtn) {
        fleeBtn.disabled = false;
        fleeBtn.onclick = async () => {
            disableAllActions();
            await doFleeTurn(callbacks);
        };
    }
}

function disableAllActions() {
    document.querySelectorAll('.part-btn').forEach((b) => b.disabled = true);
    const fleeBtn = document.getElementById('btnFlee');
    if (fleeBtn) fleeBtn.disabled = true;
}

// ─── Turns ───

async function doPlayerTurn(part, callbacks) {
    const combat = getCombatState();
    const result = playerAttack(part);
    refreshCombatLog();

    if (result.hit) {
        showDamageFloat('monsterDamageArea', result.damage, result.critical ? 'crit' : 'normal');
        updateMonsterHP();
    } else {
        showDamageFloat('monsterDamageArea', 'MISS', 'miss');
    }

    await delay(800);

    if (combat.result === 'victory') {
        await handleResult(callbacks);
        return;
    }

    // Monster's turn
    await doMonsterTurn();

    if (combat.result === 'defeat') {
        await handleResult(callbacks);
        return;
    }

    // Refresh hit chances (sanity may have changed)
    refreshHitChances();
    enablePlayerActions(callbacks);
}

async function doMonsterTurn() {
    const combat = getCombatState();
    const result = monsterAttack();
    refreshCombatLog();

    if (result.evaded) {
        showDamageFloat('playerDamageArea', 'DODGE', 'dodge');
    } else if (result.damage > 0) {
        showDamageFloat('playerDamageArea', result.damage, 'enemy');
        updatePlayerHP();
    }

    await delay(600);
}

async function doFleeTurn(callbacks) {
    const success = attemptFlee();
    refreshCombatLog();

    if (success) {
        await delay(400);
        await handleResult(callbacks);
    } else {
        // Monster gets a free hit
        await delay(400);
        const combat = getCombatState();
        await doMonsterTurn();

        if (combat.result === 'defeat') {
            await handleResult(callbacks);
            return;
        }

        refreshHitChances();
        enablePlayerActions(callbacks);
    }
}

// ─── Result ───

async function handleResult(callbacks) {
    const combat = getCombatState();
    if (!combat) return;

    await delay(500);

    const overlay = document.getElementById('combatOverlay');
    if (overlay) {
        overlay.classList.remove('combat-visible');
        await delay(400);
        overlay.remove();
        delete window.__refreshCombatUI;
    }

    if (combat.result === 'victory' && callbacks.onVictory) callbacks.onVictory();
    else if (combat.result === 'defeat' && callbacks.onDefeat) callbacks.onDefeat();
    else if (combat.result === 'fled' && callbacks.onFlee) callbacks.onFlee();
}

// ─── UI Updates ───

function updateMonsterHP() {
    const combat = getCombatState();
    if (!combat) return;
    const pct = Math.max(0, Math.round((combat.monster.hp / combat.monster.maxHp) * 100));
    const fill = document.getElementById('monsterHpFill');
    const text = document.getElementById('monsterHpText');
    if (fill) fill.style.width = pct + '%';
    if (text) text.textContent = `${combat.monster.hp}/${combat.monster.maxHp}`;
}

function updatePlayerHP() {
    const combat = getCombatState();
    if (!combat) return;
    const pct = Math.max(0, Math.round((combat.player.hp / combat.player.maxHp) * 100));
    const fill = document.getElementById('playerHpFill');
    const text = document.getElementById('playerHpText');
    if (fill) fill.style.width = pct + '%';
    if (text) text.textContent = `${combat.player.hp}/${combat.player.maxHp}`;
}

function refreshHitChances() {
    const combat = getCombatState();
    if (!combat) return;
    document.querySelectorAll('.part-btn:not(.part-disabled)').forEach((btn) => {
        const part = btn.dataset.part;
        const hitEl = btn.querySelector('.part-hit');
        if (hitEl) hitEl.textContent = getHitChance(part) + '%';
    });
}

function refreshCombatLog() {
    const combat = getCombatState();
    const logEl = document.getElementById('combatLog');
    if (!combat || !logEl) return;

    logEl.innerHTML = combat.log.map((msg) =>
        `<p class="combat-log-entry">${msg}</p>`
    ).join('');
    logEl.scrollTop = logEl.scrollHeight;
}

function showDamageFloat(containerId, value, type) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const el = document.createElement('span');
    el.className = `damage-float damage-${type}`;
    el.textContent = typeof value === 'number' ? `-${value}` : value;
    container.appendChild(el);
    setTimeout(() => el.remove(), 1200);
}
