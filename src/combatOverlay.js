// ─── Combat Overlay ───
// Full-screen overlay UI for turn-based combat

import {
    getCombatState, getHitChance, playerAttack, monsterAttack,
    attemptFlee, determineInitiative, getPredictedDamage,
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

    // [Admin] Watcher for forced results
    const adminCheck = setInterval(() => {
        if (combat.result) {
            clearInterval(adminCheck);
            handleResult(callbacks);
        }
    }, 200);
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
        const dmg = enabled ? getPredictedDamage(part) : { min: 0, max: 0 };
        return `
            <button class="part-btn ${enabled ? '' : 'part-disabled'}"
                    data-part="${part}"
                    ${enabled ? '' : 'disabled'}>
                <span class="part-icon">${partIcons[part]}</span>
                <div class="part-info">
                    <span class="part-name">${partNames[part]}</span>
                    <span class="part-hit">${enabled ? hitChance + '%' : '불가'}</span>
                    <span class="part-dmg">${enabled ? `Dmg ${dmg.min}~${dmg.max}` : '-'}</span>
                </div>
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
                <div class="combat-actions-row">
                  <button class="btn-flee" id="btnFlee">🏃 도망가기</button>
                  <div class="combat-admin-controls">
                    <button class="btn-admin-small" id="btnAdminWin">⚔️Win</button>
                    <button class="btn-admin-small" id="btnAdminLose">🏳️Lose</button>
                    <button class="btn-admin-small" id="btnAdminKill">💀Kill</button>
                  </div>
                </div>
            </div>
        </div>
    `;
}

function updatePlayerHP() {
    const combat = getCombatState();
    if (!combat) return;
    const p = combat.player;
    const pct = Math.max(0, Math.min(100, Math.round((p.hp / p.maxHp) * 100)));
    const fill = document.getElementById('playerHpFill');
    const text = document.getElementById('playerHpText');
    if (fill) fill.style.width = `${pct}%`;
    if (text) text.textContent = `${p.hp}/${p.maxHp}`;
}

function updateMonsterHP() {
    const combat = getCombatState();
    if (!combat) return;
    const m = combat.monster;
    const pct = Math.max(0, Math.min(100, Math.round((m.hp / m.maxHp) * 100)));
    const fill = document.getElementById('monsterHpFill');
    const text = document.getElementById('monsterHpText');
    if (fill) fill.style.width = `${pct}%`;
    if (text) text.textContent = `${m.hp}/${m.maxHp}`;
}

async function doMonsterTurn() {
    const combat = getCombatState();
    if (!combat) return;

    // Visual cue
    document.querySelector('.combat-monster-section').classList.add('monster-acting');
    await delay(500);

    const { damage, evaded } = monsterAttack();
    document.querySelector('.combat-monster-section').classList.remove('monster-acting');

    refreshCombatLog();

    if (damage > 0) {
        showDamageFloat('playerDamageArea', damage, 'player');
        // Shake screen?
        document.body.classList.add('shake');
        setTimeout(() => document.body.classList.remove('shake'), 400);
    } else if (evaded) {
        showDamageFloat('playerDamageArea', '회피!', 'player');
    } else {
        showDamageFloat('playerDamageArea', 'Miss', 'player');
    }

    updatePlayerHP();
    await delay(600);
}

function enablePlayerActions(callbacks) {
    const combat = getCombatState();
    if (!combat || combat.result) return;

    // Parts
    const partBtns = document.querySelectorAll('.part-btn:not(.part-disabled)');
    partBtns.forEach((btn) => {
        btn.disabled = false;
        btn.onclick = async () => {
            // Disable interactions
            disableAllActions();

            const part = btn.dataset.part;
            const { hit, damage, critical, weaponBroke } = playerAttack(part);
            refreshCombatLog();

            if (hit) {
                showDamageFloat('monsterDamageArea', damage, critical ? 'critical' : 'monster');
                updateMonsterHP();
                if (weaponBroke) {
                    // Maybe toast?
                }
            } else {
                showDamageFloat('monsterDamageArea', 'Miss', 'monster');
            }

            if (combat.result === 'victory') {
                await delay(800);
                await handleResult(callbacks);
            } else {
                // Monster turn
                await delay(600);
                await doMonsterTurn();
                if (combat.result === 'defeat') {
                    await handleResult(callbacks);
                } else {
                    enablePlayerActions(callbacks);
                }
            }
            refreshHitChances();
        };
    });

    // Flee
    const btnFlee = document.getElementById('btnFlee');
    if (btnFlee) {
        btnFlee.disabled = false;
        btnFlee.onclick = async () => {
            disableAllActions();
            const success = attemptFlee();
            refreshCombatLog();

            if (success) {
                await delay(800);
                await handleResult(callbacks);
            } else {
                await delay(600);
                await doMonsterTurn();
                if (combat.result === 'defeat') {
                    await handleResult(callbacks);
                } else {
                    enablePlayerActions(callbacks);
                }
            }
        };
    }

    // Combat Admin
    const btnWin = document.getElementById('btnAdminWin');
    const btnLose = document.getElementById('btnAdminLose');
    const btnKill = document.getElementById('btnAdminKill');

    if (btnWin) btnWin.onclick = () => window.__admin.combatWin();
    if (btnLose) btnLose.onclick = () => window.__admin.combatLose();
    if (btnKill) btnKill.onclick = () => window.__admin.combatKill();
}

function disableAllActions() {
    document.querySelectorAll('.part-btn').forEach(b => b.disabled = true);
    const f = document.getElementById('btnFlee');
    if (f) f.disabled = true;
    document.querySelectorAll('.btn-admin-small').forEach(b => b.disabled = true);
}

async function handleResult(callbacks) {
    const combat = getCombatState();
    await delay(1000);

    const overlay = document.getElementById('combatOverlay');
    if (overlay) {
        overlay.classList.remove('combat-visible');
        await delay(300);
        overlay.remove();
    }

    // Clean up global refresh
    delete window.__refreshCombatUI;

    if (combat.result === 'victory') {
        if (callbacks.onVictory) callbacks.onVictory();
    } else if (combat.result === 'defeat') {
        if (callbacks.onDefeat) callbacks.onDefeat();
    } else if (combat.result === 'fled') {
        if (callbacks.onFlee) callbacks.onFlee();
    }
}

// ... (lines 135-292 omitted)

function refreshHitChances() {
    const combat = getCombatState();
    if (!combat) return;
    document.querySelectorAll('.part-btn:not(.part-disabled)').forEach((btn) => {
        const part = btn.dataset.part;
        const hitEl = btn.querySelector('.part-hit');
        const dmgEl = btn.querySelector('.part-dmg');

        if (hitEl) hitEl.textContent = getHitChance(part) + '%';

        const dmg = getPredictedDamage(part);
        if (dmgEl) dmgEl.textContent = `Dmg ${dmg.min}~${dmg.max}`;
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
