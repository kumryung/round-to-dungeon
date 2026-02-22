// ─── Combat Overlay ───
// Full-screen overlay UI for turn-based combat
// Supports multi-enemy (bowling-pin layout) with target memory

import {
    getCombatState, getHitChance, playerAttack, monsterAttack,
    attemptFlee, determineInitiative, getPredictedDamage, getFighterName,
    setActiveTarget, getActiveTarget, advanceTick, resetTick
} from './combatEngine.js';
import { getDungeonState } from './dungeonState.js';
import { playSFX } from './soundEngine.js';
import { screenShake, screenFlash, spawnParticlesAtElement, spawnParticles } from './vfxEngine.js';
import { t } from './i18n.js';

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

    // Expose refresh functions for cross-module use
    window.__refreshCombatUI = () => {
        updatePlayerHP();
        refreshAllMonsterHP();
        refreshPartButtons();
    };
    window.__refreshCombatMonsters = () => {
        // Called when a monster is summoned mid-battle — rebuilds the monster area
        rebuildMonstersArea(combat, callbacks);
    };

    // Fade in
    requestAnimationFrame(() => overlay.classList.add('combat-visible'));

    // Attach monster click events
    attachMonsterClickEvents(combat, callbacks);

    // Highlight default target
    highlightSelectedMonster(combat.activeTargetIndex);

    const isResume = combat.nextTurn !== null;

    if (isResume) {
        // Restore previous combat log
        refreshCombatLog();

        // If the combat was interrupted and it's the monster's turn, let them act
        await processTurnQueue(callbacks);
    } else {
        // Determine initiative and apply traits
        determineInitiative();

        // Initial ATB drop animation!
        updateAllTicks(false);
        await delay(200);

        advanceTick(); // Let engine pick the first turn!
        updateAllTicks(true); // Animate dropping to 0
        await delay(500);

        refreshCombatLog();

        await processTurnQueue(callbacks);
    }

    // [Admin] Watcher for forced results
    const adminCheck = setInterval(() => {
        if (combat.result) {
            clearInterval(adminCheck);
            handleResult(callbacks);
        }
    }, 200);
}

// ─── HTML Building ───

/**
 * Build bowling-pin layout for an array of monsters.
 * Rows: 1, 2, 3... centered. E.g. 3 monsters → [1][2] row then [1] row.
 */
function buildMonstersHTML(combat) {
    const monsters = combat.monsters;
    // Simple single-row bowling display for now; visual rows based on count
    // Rows from back to front e.g. [M2 M3] [M1] (reversed for visual depth)
    // We just render them all in a flex-wrap centered layout with stagger via CSS
    return `
        <div class="combat-monsters-arena" id="combatMonstersArena">
            ${monsters.map((m, i) => buildMonsterCard(m, i, i === combat.activeTargetIndex)).join('')}
        </div>
    `;
}

function buildMonsterCard(m, index, isSelected) {
    const hpPercent = m.maxHp > 0 ? Math.round((m.hp / m.maxHp) * 100) : 0;
    const isDead = m.hp <= 0;
    const tickPercent = m.maxTick > 0 ? Math.round((m.currentTick / m.maxTick) * 100) : 0;
    const summonBadge = m.isSummon ? `<span class="summon-badge">소환</span>` : '';

    // Visual layout: 4 2 1 3 5 (Center is index 0, radiating outwards)
    const visualOrderMap = [3, 2, 4, 1, 5, 0, 6, -1, 7];
    const itemOrder = visualOrderMap[index] !== undefined ? visualOrderMap[index] : index + 10;

    // V-formation depth: Center is front (0), sides step backward
    const depth = Math.floor((index + 1) / 2);
    const translateY = depth * -12;
    const zIndex = 100 - depth;

    return `
        <div class="monster-card ${isDead ? 'monster-dead' : ''} ${isSelected && !isDead ? 'monster-selected' : ''}"
             data-monster-index="${index}"
             style="order: ${itemOrder}; --offset-y: ${translateY}px; transform: translateY(var(--offset-y)); z-index: ${zIndex};">
            ${summonBadge}
            <div class="monster-card-emoji">${m.emoji}</div>
            <div class="monster-card-name">${getFighterName(m)}${m.isSummon ? '' : ` Lv.${m.currentLevel}`}</div>
            <div class="monster-card-hp-bar">
                <div class="monster-card-hp-fill" id="monsterHpFill-${index}" style="width:${hpPercent}%"></div>
            </div>
            <div class="monster-card-hp-text" id="monsterHpText-${index}">${m.hp}/${m.maxHp}</div>
            <div class="atb-tick-bar">
                <div class="atb-tick-fill" id="monsterTickFill-${index}" style="width:${tickPercent}%"></div>
                <span class="atb-tick-text" id="monsterTickText-${index}">${m.currentTick != null ? m.currentTick.toFixed(1) : '-'}</span>
            </div>
            <div class="combat-damage-area" id="monsterDamageArea-${index}"></div>
            ${isDead ? '<div class="monster-dead-overlay">💀</div>' : ''}
        </div>
    `;
}

function buildPartButtonsHTML(combat) {
    const target = getActiveTarget();
    if (!target) return '<p class="no-target-msg">타겟이 없습니다.</p>';

    const parts = ['head', 'body', 'legs'];
    const partIcons = { head: '🎯', body: '🫁', legs: '🦵' };
    const partNames = { head: t('dungeon_ui.part_head'), body: t('dungeon_ui.part_body'), legs: t('dungeon_ui.part_legs') };

    const isPlayerTurn = combat.nextTurn === 'player' && combat.player.currentTick === 0;

    return parts.map((part) => {
        const canHitPart = target.parts?.[part] !== false;
        const hitChance = canHitPart ? getHitChance(part) : 0;
        const dmg = canHitPart ? getPredictedDamage(part) : { min: 0, max: 0 };
        return `
            <button class="part-btn ${canHitPart ? '' : 'part-disabled'}"
                    data-part="${part}"
                    ${(canHitPart && isPlayerTurn) ? '' : 'disabled'}>
                <span class="part-icon">${partIcons[part]}</span>
                <div class="part-info">
                    <span class="part-name">${partNames[part]}</span>
                    <span class="part-hit">${canHitPart ? hitChance + '%' : t('dungeon_ui.part_disabled')}</span>
                    <span class="part-dmg">${canHitPart ? `Dmg ${dmg.min}~${dmg.max}` : '-'}</span>
                </div>
            </button>
        `;
    }).join('');
}

function buildCombatHTML(combat) {
    const p = combat.player;
    const playerHpPercent = Math.round((p.hp / p.maxHp) * 100);
    const targetName = getFighterName(getActiveTarget());

    return `
        <div class="combat-container">
            <!-- Monster bowling-pin area -->
            ${buildMonstersHTML(combat)}

            <!-- Body part selection (for active target) -->
            <div class="combat-action-section">
                <p class="combat-action-label">${t('dungeon_ui.select_part_attack')} · <span id="activeTargetLabel">${targetName}</span></p>
                <div class="combat-parts" id="combatParts">
                    ${buildPartButtonsHTML(combat)}
                </div>
            </div>

            <!-- Player HP -->
            <div class="combat-player-section">
                <div class="combat-player-header">
                    <span class="combat-player-portrait">${p.portrait}</span>
                    <div class="combat-player-info-stack">
                        <span class="combat-player-name">${getFighterName(p)}</span>
                        <div class="atb-tick-bar player-tick-bar">
                            <div class="atb-tick-fill player-tick" id="playerTickFill" style="width:${p.maxTick > 0 ? Math.round((p.currentTick / p.maxTick) * 100) : 0}%"></div>
                            <span class="atb-tick-text" id="playerTickText">${p.currentTick != null ? p.currentTick.toFixed(1) : '-'}</span>
                        </div>
                    </div>
                </div>
                <div class="combat-hp-section">
                    <label class="combat-hp-label">${t('dungeon_ui.player_hp')}</label>
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
                  <button class="btn-flee" id="btnFlee" disabled>🏃 ${t('dungeon_ui.flee_btn')}</button>
                  <div class="combat-admin-controls">
                    <button class="btn-admin-small" id="btnAdminWin" disabled>⚔️Win</button>
                    <button class="btn-admin-small" id="btnAdminLose" disabled>🏳️Lose</button>
                    <button class="btn-admin-small" id="btnAdminKill" disabled>💀Kill</button>
                  </div>
                </div>
            </div>
        </div>
    `;
}

// ─── Monster Interaction ───

function attachMonsterClickEvents(combat, callbacks) {
    const arena = document.getElementById('combatMonstersArena');
    if (!arena) return;

    arena.querySelectorAll('.monster-card:not(.monster-dead)').forEach(card => {
        const idx = parseInt(card.dataset.monsterIndex);
        card.addEventListener('click', () => {
            if (combat.result) return;
            if (setActiveTarget(idx)) {
                highlightSelectedMonster(idx);
                refreshPartButtons();
                // Update active target label
                const label = document.getElementById('activeTargetLabel');
                if (label) label.textContent = getFighterName(getActiveTarget());
            }
        });
    });
}

function highlightSelectedMonster(index) {
    document.querySelectorAll('.monster-card').forEach((card, i) => {
        card.classList.toggle('monster-selected', i === index && !card.classList.contains('monster-dead'));
    });
}

function rebuildMonstersArea(combat, callbacks) {
    const arena = document.getElementById('combatMonstersArena');
    if (!arena) return;
    arena.innerHTML = combat.monsters.map((m, i) => buildMonsterCard(m, i, i === combat.activeTargetIndex)).join('');
    attachMonsterClickEvents(combat, callbacks);
    highlightSelectedMonster(combat.activeTargetIndex);
}

// ─── HP Updates ───

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

function refreshAllMonsterHP() {
    const combat = getCombatState();
    if (!combat) return;
    combat.monsters.forEach((m, i) => {
        const pct = m.maxHp > 0 ? Math.max(0, Math.min(100, Math.round((m.hp / m.maxHp) * 100))) : 0;
        const fill = document.getElementById(`monsterHpFill-${i}`);
        const text = document.getElementById(`monsterHpText-${i}`);
        if (fill) fill.style.width = `${pct}%`;
        if (text) text.textContent = `${m.hp}/${m.maxHp}`;

        // Mark dead
        const card = document.querySelector(`.monster-card[data-monster-index="${i}"]`);
        if (card) {
            card.classList.toggle('monster-dead', m.hp <= 0);
            if (m.hp <= 0 && !card.querySelector('.monster-dead-overlay')) {
                card.innerHTML += '<div class="monster-dead-overlay">💀</div>';
            }
        }
    });
}

function refreshPartButtons() {
    const partsContainer = document.getElementById('combatParts');
    if (!partsContainer) return;
    const combat = getCombatState();
    if (!combat) return;
    partsContainer.innerHTML = buildPartButtonsHTML(combat);
    // Re-attach part click events
    if (!combat.result && combat.nextTurn === 'player' && combat.player.currentTick === 0) {
        attachPartEvents(combat.__pendingCallbacks);
    }
}

function updateAllTicks(animate = true, resetingActor = null) {
    const combat = getCombatState();
    if (!combat) return;

    // Update player
    const pFill = document.getElementById('playerTickFill');
    const pText = document.getElementById('playerTickText');
    if (pFill) {
        // Only use transition if animating, OR if this specific actor is resetting
        pFill.style.transition = (animate && resetingActor !== 'player') ? 'width 0.4s linear' : 'none';
        pFill.style.width = `${combat.player.maxTick > 0 ? Math.round((combat.player.currentTick / combat.player.maxTick) * 100) : 0}%`;
    }
    if (pText) pText.textContent = combat.player.currentTick != null ? combat.player.currentTick.toFixed(1) : '-';

    // Update monsters
    combat.monsters.forEach((m, i) => {
        const mFill = document.getElementById(`monsterTickFill-${i}`);
        const mText = document.getElementById(`monsterTickText-${i}`);
        if (mFill) {
            mFill.style.transition = (animate && resetingActor !== i) ? 'width 0.4s linear' : 'none';
            mFill.style.width = `${m.maxTick > 0 ? Math.round((m.currentTick / m.maxTick) * 100) : 0}%`;
        }
        if (mText) mText.textContent = m.currentTick != null ? m.currentTick.toFixed(1) : '-';
    });
}

// ─── Combat Flow ───

async function processTurnQueue(callbacks) {
    const combat = getCombatState();
    while (combat && !combat.result && combat.nextTurn === 'monster') {
        const mIdx = combat.actingMonsterIndex !== undefined ? combat.actingMonsterIndex : combat.activeTargetIndex;
        await doMonsterTurn(mIdx);
    }
    if (combat && !combat.result) {
        enablePlayerActions(callbacks);
    } else if (combat && combat.result) {
        await handleResult(callbacks);
    }
}

async function doMonsterTurn(monsterIndex) {
    const combat = getCombatState();
    if (!combat) return;

    // Light up acting monster
    const actingCard = document.querySelector(`.monster-card[data-monster-index="${monsterIndex}"]`);
    if (actingCard) actingCard.classList.add('monster-acting');
    await delay(500);

    combat.actingMonsterIndex = monsterIndex;
    const { damage, evaded } = monsterAttack();
    combat.actingMonsterIndex = undefined;

    if (actingCard) actingCard.classList.remove('monster-acting');

    refreshCombatLog();

    if (damage > 0) {
        showDamageFloat('playerDamageArea', damage, 'player');
        playSFX('playerHit');
        screenShake(5, 400);
        screenFlash('rgba(255, 0, 0, 0.25)', 200);
    } else if (evaded) {
        showDamageFloat('playerDamageArea', '회피!', 'player');
        playSFX('miss');
    } else {
        showDamageFloat('playerDamageArea', 'Miss', 'player');
        playSFX('miss');
    }

    updatePlayerHP();
    await delay(600);

    // ATB: reset each monster's tick and advance to next actor
    if (!combat.result) {
        const resetTarget = monsterIndex !== undefined ? monsterIndex : combat.activeTargetIndex;
        // Reset only the monster that just acted
        resetTick(resetTarget);
        updateAllTicks(false, resetTarget);
        await delay(50);

        // Advance and animate
        advanceTick();
        updateAllTicks(true, resetTarget);
        await delay(500);
    }
}

function enablePlayerActions(callbacks) {
    const combat = getCombatState();
    if (!combat || combat.result) return;

    // Store callbacks for refresh use
    combat.__pendingCallbacks = callbacks;

    attachPartEvents(callbacks);

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
                await processTurnQueue(callbacks);
            }
        };
    }

    // Combat Admin
    const btnWin = document.getElementById('btnAdminWin');
    const btnLose = document.getElementById('btnAdminLose');
    const btnKill = document.getElementById('btnAdminKill');

    if (btnWin) btnWin.onclick = () => window.__admin?.combatWin();
    if (btnLose) btnLose.onclick = () => window.__admin?.combatLose();
    if (btnKill) btnKill.onclick = () => window.__admin?.combatKill();
}

function attachPartEvents(callbacks) {
    const combat = getCombatState();
    if (!combat || !callbacks) return;

    const partBtns = document.querySelectorAll('.part-btn:not(.part-disabled)');
    partBtns.forEach((btn) => {
        btn.disabled = false;
        btn.onclick = async () => {
            disableAllActions();

            const part = btn.dataset.part;
            const { hit, damage, critical, weaponBroke, targetIndex } = playerAttack(part);
            refreshCombatLog();

            if (hit) {
                showDamageFloat(`monsterDamageArea-${targetIndex}`, damage, critical ? 'critical' : 'monster');
                const targetCard = document.querySelector(`.monster-card[data-monster-index="${targetIndex}"]`);

                if (critical) {
                    playSFX('crit');
                    screenShake(6, 400);
                    screenFlash('rgba(255, 215, 0, 0.2)', 200);
                    spawnParticlesAtElement(targetCard, { count: 12, emoji: '✨', spread: 60 });
                } else {
                    playSFX('hit');
                    screenShake(3, 200);
                    spawnParticlesAtElement(targetCard, { count: 8, emoji: '💢', spread: 40 });
                }

                refreshAllMonsterHP();
                highlightSelectedMonster(combat.activeTargetIndex);
            } else {
                showDamageFloat(`monsterDamageArea-${targetIndex}`, 'Miss', 'monster');
                playSFX('miss');
            }

            if (combat.result === 'victory') {
                await delay(800);
                await handleResult(callbacks);
            } else {
                // Keep targeting the same monster (or auto-selected one)
                const activeLabel = document.getElementById('activeTargetLabel');
                if (activeLabel) activeLabel.textContent = getFighterName(getActiveTarget());
                refreshPartButtons();

                // Wait slightly for attack damage visual
                await delay(400);

                // ATB: reset player tick instantly
                resetTick('player');
                updateAllTicks(false, 'player');
                await delay(50);

                // Advance and animate ticks
                advanceTick();
                updateAllTicks(true, 'player');
                await delay(500);

                await processTurnQueue(callbacks);
            }
        };
    });
}

function disableAllActions() {
    document.querySelectorAll('.part-btn').forEach(b => b.disabled = true);
    const f = document.getElementById('btnFlee');
    if (f) f.disabled = true;
    document.querySelectorAll('.btn-admin-small').forEach(b => b.disabled = true);
}

async function handleResult(callbacks) {
    const combat = getCombatState();
    if (combat.handled) return;
    combat.handled = true;

    await delay(1000);

    const overlay = document.getElementById('combatOverlay');
    if (overlay) {
        overlay.classList.remove('combat-visible');
        await delay(300);
        overlay.remove();
    }

    // Clean up global refresh
    delete window.__refreshCombatUI;
    delete window.__refreshCombatMonsters;

    delete window.__refreshCombatMonsters;

    if (combat.result === 'victory') {
        playSFX('victory');
        spawnParticles(window.innerWidth / 2, window.innerHeight / 2, { count: 20, emoji: '⭐', spread: 150 });
        if (callbacks.onVictory) callbacks.onVictory(combat.monsters);
    } else if (combat.result === 'defeat') {
        playSFX('defeat');
        screenFlash('rgba(139, 0, 0, 0.4)', 1000);
        if (callbacks.onDefeat) callbacks.onDefeat();
    } else if (combat.result === 'fled') {
        if (callbacks.onFlee) callbacks.onFlee();
    }
}

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
