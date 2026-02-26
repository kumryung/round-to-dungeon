// ─── Dungeon Scene (던전씬) — Phase 3: Game Loop ───
import { changeScene } from '../sceneManager.js';
import { generateTiles, renderBoard, movePlayerToken, setPlayerPortrait, setTileObject } from '../mapEngine.js';
import {
  initDungeonState, getDungeonState, setLogCallback, setUpdateCallback,
  rollSpawnDice, getSpawnPlacements, commitSpawn,
  executeMovePhase, animateMovement,
  handleTileInteraction, advanceWave, getSanityStatus, loadDungeonState, reduceSanity,
  tickStatuses, triggerUpdate
} from '../dungeonState.js';
import { getMonster } from '../data/monsters.js';
import { initCombat, loadCombatState } from '../combatEngine.js';
import { showCombat } from '../combatOverlay.js';
import { initInventory, getInventory, addItem, removeItem } from '../inventory.js';
import { buildInlineInventoryHTML, refreshInlineInventory, showItemToast } from '../inventoryOverlay.js';
import { rollChestLoot, rollMonsterLoot, ITEMS } from '../data/items.js';
import { rollEvent } from '../data/events.js';
import { applyOutcome, showEventModal } from '../eventOverlay.js';
import { openCraftingOverlay } from '../craftingOverlay.js';
import { sendToMailbox, addItemToStorage, getState, clearActiveDungeon, updateDungeonStatus } from '../gameState.js';
import { playSFX } from '../soundEngine.js';
import { screenShake } from '../vfxEngine.js';
import { t } from '../i18n.js';
import { refreshCurrencyDisplay } from './town/townUtils.js';


let boardRendered = false;
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export function mount(container, params = {}) {
  let { map, wanderer, resume, prepInv, prepSafeBag } = params;
  boardRendered = false;

  let sideLength;
  let tiles;
  let ds;

  if (resume && getState().activeDungeon) {
    const saved = getState().activeDungeon;
    map = saved.mapData;
    wanderer = saved.wanderer;
    sideLength = saved.sideLength;
    tiles = saved.tiles;
    ds = loadDungeonState(saved);

    // Restore inventory from saved snapshot
    if (saved.inventory) {
      prepInv = saved.inventory.slots;
      prepSafeBag = saved.inventory.safeBag;
    }
  } else {
    sideLength = map.tiles / 4;
    tiles = generateTiles(map);
    ds = initDungeonState(tiles, map, wanderer);
    // Mark global wanderer as exploring
    const globalW = getState().recruitedWanderers.find(rw => rw.id === wanderer.id);
    if (globalW) {
      globalW.status = 'exploring';
    }
  }

  container.innerHTML = `
  <div class="dungeon-scene">
      <!-- Top bar -->
      <div class="dungeon-topbar">
        <div class="dungeon-topbar-info">
          <span class="topbar-map">${map?.icon || '🗺️'} ${map?.nameKey ? t(map.nameKey) : (map?.name || t('dungeon_ui.dungeon', '던전'))}</span>
          <span class="topbar-sep">|</span>
          <span class="topbar-wave" id="topWave">${t('dungeon_ui.wave')} ${ds.wave}</span>
          <span class="topbar-sep">|</span>
          <span class="topbar-turn" id="topTurn">${t('dungeon_ui.turn')} ${ds.turn}</span>
        </div>
        <div class="topbar-actions" style="display:flex; align-items:center; gap: 10px;">
          <div class="currency-item diamond" title="${t('ui.town.tooltip_diamond', '다이아몬드')}">
            <span class="currency-icon">💎</span>
            <span class="currency-value">${getState().diamonds.toLocaleString()}</span>
          </div>
          <div class="currency-item gold" title="${t('ui.town.tooltip_gold', '골드')}">
            <span class="currency-icon">💰</span>
            <span class="currency-value">${getState().gold.toLocaleString()}</span>
          </div>
          <div class="topbar-wanderer">
            <span>${wanderer?.portrait || ''}</span>
            <span>${wanderer?.nameKey ? t(wanderer.nameKey) : (wanderer?.name || '')}</span>
          </div>
        </div>
      </div>

      <!-- 3-column layout -->
      <div class="dungeon-body">
        <!-- Left: Player Info Panel -->
        <aside class="dungeon-left">
          <div class="panel hud-panel" id="hudPanel">
            <h3>${t('dungeon_ui.player_info')}</h3>
            ${wanderer ? renderHUD(ds) : `<p>${t('dungeon_ui.no_info')}</p>`}
          </div>
        </aside>

        <!-- Center: Game Board -->
        <section class="dungeon-center">
          <div class="board-container" id="boardContainer"></div>
        </section>

        <!-- Right: Log & Action -->
        <aside class="dungeon-right">
          <div class="panel log-panel">
            <h3>${t('dungeon_ui.log')}</h3>
            <div class="log-content" id="logContent"></div>
          </div>
          <div class="panel action-panel" id="actionPanel">
            <h3>${t('dungeon_ui.action')}</h3>
            <div id="actionContent"></div>
          </div>
        </aside>

        <!-- Inline inventory panel -->
        ${buildInlineInventoryHTML()}
      </div>
  </div>
  `;

  // Log callback
  setLogCallback((msg) => {
    const logEl = document.getElementById('logContent');
    if (!logEl) return;
    const entry = document.createElement('p');
    entry.className = 'log-entry log-new';
    entry.textContent = msg;
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
  });

  // Update callback
  setUpdateCallback((state) => {
    refreshTopbar(state);
    refreshHUD(state);
  });

  // Initialize inventory
  const inv = initInventory(wanderer, prepInv, prepSafeBag);

  if (resume && getState().activeDungeon?.inventory?.equipped) {
    // Restore equipped weapon if resuming
    inv.equipped = getState().activeDungeon.inventory.equipped;
  } else if (!resume && wanderer.equipments?.weapon && wanderer.equipments.weapon.id !== 'w_fist') {
    // Load town equipment into dungeon run
    inv.equipped = { ...wanderer.equipments.weapon };
  }

  // Initial inventory render

  // Render the board
  const boardContainer = document.getElementById('boardContainer');
  renderBoard(tiles, sideLength, boardContainer, map?.theme);
  boardRendered = true;

  // Set player portrait & initial position
  if (wanderer) setPlayerPortrait(wanderer.portrait);

  // Need a tiny delay for DOM to settle before positioning
  requestAnimationFrame(() => {
    movePlayerToken(ds.playerPosition, sideLength, false);
    movePlayerToken(ds.playerPosition, sideLength, false);

    // Resolve localized names
    const wName = wanderer?.nameKey ? t(wanderer.nameKey) : (wanderer?.name || t('dungeon_ui.wanderer', '방랑자'));
    const mName = map?.nameKey ? t(map.nameKey) : (map?.name || t('dungeon_ui.dungeon', '던전'));

    // Only log entering messages if this is a fresh run (not resuming)
    if (!resume) {
      addLog(t('logs.enter_dungeon', { name: wName, map: mName }));
      addLog(t('logs.wave_start', { wave: ds.wave }));
    } else {
      addLog(t('logs.resume_explore', { name: wName }, `[System] ${wName} 방랑자의 탐험을 이어서 진행합니다.`));
    }

    // Initial inventory render
    refreshInlineInventory();

    // Expose refreshHUD globally for inventory popup cross-module use
    window.__refreshHUD = () => refreshHUD(getDungeonState());

    // Start spawn phase with Wave Title or resume combat
    (async () => {
      if (resume && ds.currentHp <= 0) {
        // Player died and refreshed before leaving
        addLog(t('logs.death'));
        showGameOver();
      } else if (resume && ds.combat) {
        // Resume combat session
        loadCombatState(ds.combat);
        const mainMonster = ds.combat.monsters[0];
        showCombat(mainMonster, createCombatCallbacks(mainMonster), true);
      } else if (resume && ds.activeEvent) {
        // Resume active event modal
        addLog(`[System] 진행 중이던 이벤트를 복원합니다.`);
        showEventModal(ds.activeEvent, addLog, refreshHUD, refreshInlineInventory, async ({ died, forceEncounter }) => {
          ds.activeEvent = null; // Clear event after choice
          updateDungeonStatus(ds);
          updateSanityVFX(ds);
          if (died) { addLog(t('logs.trap_death')); showGameOver(); return; }
          if (forceEncounter) {
            addLog('⚔️ 적이 나타났다!');
            const pool = ds.mapData.monsterPool || ['m_slime'];
            const monsterId = pool[Math.floor(Math.random() * pool.length)];
            const monsterInstance = getMonster(monsterId, ds.wave);
            initCombat(ds.wanderer, monsterInstance);
            await showCombat(monsterInstance, createCombatCallbacks(monsterInstance));
            return;
          }
          showMoveUI();
        });
      } else if (resume && ds.phase === 'move') {
        // Resume move phase (do not spawn again)
        showMoveUI();
        const btnStats = container.querySelector('#btnOpenStats');
        if (btnStats) {
          btnStats.addEventListener('click', () => {
            openLevelUpOverlay(() => renderHUD(container, getDungeonState()));
          });
        }
      } else if (resume && ds.phase === 'spawn') {
        // Resume spawn phase (dice already rolled, just replay animation)
        await showWaveTitle(ds.wave);
        startSpawnPhase(); // will restore from ds.spawnData if present
        const btnStats = container.querySelector('#btnOpenStats');
        if (btnStats) {
          btnStats.addEventListener('click', () => {
            openLevelUpOverlay(() => { renderHUD(container, getDungeonState()); });
          });
        }
      } else {
        await showWaveTitle(ds.wave);
        startSpawnPhase();
        // Bind Level Up button if present
        const btnStats = container.querySelector('#btnOpenStats');
        if (btnStats) {
          btnStats.addEventListener('click', () => {
            openLevelUpOverlay(() => {
              // Callback on close: refresh HUD
              renderHUD(container, getDungeonState());
            });
          });
        }
      }
    })();
  });
}

export function unmount() {
  boardRendered = false;
}

// ─── Game Flow ───

const SPAWN_LABELS = { monster: 'dungeon_ui.monster', chest: 'dungeon_ui.treasure', event: 'dungeon_ui.event' };

/**
 * Auto-run spawn phase with sequential animation.
 * Shows dice results first, then places each object one-by-one.
 */
async function startSpawnPhase() {
  const ds = getDungeonState();
  const actionEl = document.getElementById('actionContent');
  if (!actionEl) return;

  // Check if we already rolled and saved spawn data (e.g. from a refresh before animation finished)
  let rolls, placements;

  if (ds.spawnData) {
    rolls = ds.spawnData.rolls;
    placements = ds.spawnData.placements;
    addLog("[System] 스폰 과정을 복원합니다.");
  } else {
    // Step 1: Roll dice
    rolls = rollSpawnDice();
    addLog(t('logs.spawn_dice', { monster: rolls.monsterRoll, treasure: rolls.treasureRoll, event: rolls.eventRoll }));

    // Step 2: Generate placements
    placements = getSpawnPlacements(rolls);

    // Save to state so a refresh doesn't reroll
    ds.spawnData = { rolls, placements };
    triggerUpdate();
  }

  // Show dice results in action panel
  playSFX('dice');
  actionEl.innerHTML = `
  <div class="spawn-result fade-in">
      <p class="action-label">${t('dungeon_ui.spawn_phase')}</p>
      <div class="dice-results">
        <div class="dice-item dice-roll-anim" style="animation-delay:0s"><span class="dice-icon">💀</span><span class="dice-val">${rolls.monsterRoll}</span><span class="dice-label">${t('dungeon_ui.monster')}</span></div>
        <div class="dice-item dice-roll-anim" style="animation-delay:0.15s"><span class="dice-icon">📦</span><span class="dice-val">${rolls.treasureRoll}</span><span class="dice-label">${t('dungeon_ui.treasure')}</span></div>
        <div class="dice-item dice-roll-anim" style="animation-delay:0.3s"><span class="dice-icon">❓</span><span class="dice-val">${rolls.eventRoll}</span><span class="dice-label">${t('dungeon_ui.event')}</span></div>
      </div>
      <div class="spawn-progress" id="spawnProgress"></div>
  </div>
  `;

  // Step 3: Animate each spawn one by one
  await delay(600); // Pause after showing dice

  const progressEl = document.getElementById('spawnProgress');

  for (let i = 0; i < placements.length; i++) {
    const p = placements[i];

    // Commit to state & DOM
    commitSpawn(p);

    // Tile pop animation
    const tileEl = document.getElementById(`tile-${p.tileIndex}`);
    if (tileEl) {
      if (p.type === 'monster') playSFX('spawnMonster');
      else if (p.type === 'chest') playSFX('spawnChest');
      else playSFX('spawnEvent');

      tileEl.classList.add('tile-spawn-pop');
      setTimeout(() => tileEl.classList.remove('tile-spawn-pop'), 600);
    }

    // Log & progress
    const typeLabel = t(SPAWN_LABELS[p.type]);
    const typeEmoji = p.type === 'monster' ? '💀' : p.type === 'chest' ? '📦' : '❓';
    addLog(t('logs.spawn_at_tile', { type: `${typeEmoji} ${typeLabel}`, tile: p.tileIndex }));
    if (progressEl) {
      progressEl.textContent = `${t('dungeon_ui.placing')} (${i + 1}/${placements.length})`;
    }

    await delay(350);
  }

  if (progressEl) {
    progressEl.textContent = `✅ ${placements.length} ${t('dungeon_ui.placement_complete')}`;
  }

  // Step 4: Transition to move phase
  ds.phase = 'move';
  delete ds.spawnData; // Clear spawn data once phase is complete
  triggerUpdate(); // Persist state so refresh doesn't repeat spawn phase
  await delay(400);
  showMoveUI();
}

function showMoveUI() {
  const actionEl = document.getElementById('actionContent');
  if (!actionEl) return;

  actionEl.innerHTML = `
  <div class="move-phase fade-in">
    <button class="btn-action btn-roll-move" id="btnRollMove">${t('dungeon_ui.roll_move')}</button>
  </div>
  `;

  document.getElementById('btnRollMove').addEventListener('click', handleRollMove);
}

async function handleRollMove() {
  const ds = getDungeonState();

  // Disable the button
  const btn = document.getElementById('btnRollMove');
  if (btn) btn.disabled = true;

  playSFX('dice');

  // Roll and calculate path
  const result = executeMovePhase();
  const rawRoll = result.rawRoll ?? result.roll;
  const penalty = result.penaltyApplied || 0;

  // Update topbar
  refreshTopbar(ds);
  refreshHUD(ds);

  // Show dice popup: if there's a weight penalty, show raw first then animate reduction
  if (penalty < 0) {
    showDicePopup(rawRoll, 0, false);
    await delay(700);
    showDicePopup(result.roll, penalty, true); // show final with penalty badge
    addLog(`${result.weightIcon || '🎒'} [무게 페널티] 주사위 ${rawRoll} ${penalty} = ${result.roll}`);
    await delay(600);
  } else {
    showDicePopup(result.roll, 0, false);
  }

  // Animate movement along path
  await animateMovement(result.path, ds.sideLength);

  // Tick status effects (burn, poison, bleed, etc.)
  tickStatuses();
  refreshTopbar(ds);
  refreshHUD(ds);
  if (ds.currentHp <= 0) { addLog('☠️ 상태이상으로 사망했습니다.'); showGameOver(); return; }

  // Handle tile interaction
  const interaction = handleTileInteraction();

  // Handle wave advancement if at start
  if (result.finalPosition === 0 && ds.turn > 0) {
    addLog(t('logs.arrived_start'));

    addLog(t('logs.auto_advance'));

    if (ds.wave >= ds.mapData.maxWave) {
      showDungeonClear();
      return;
    }

    // Auto-advance wave
    advanceWave();
    refreshTopbar(getDungeonState());
    refreshHUD(getDungeonState());

    // Show title and spawn
    await showWaveTitle(getDungeonState().wave);
    await startSpawnPhase();

    return;
  }

  // If landed on monster, start combat
  if (interaction.type === 'monster') {
    const monsterId = interaction.data?.monsterId;
    const monsterLevel = interaction.data?.level || ds.wave;
    const monsterInstance = getMonster(monsterId, monsterLevel);

    if (!monsterInstance) {
      addLog(t('logs.unknown_monster', { id: monsterId }));
      showMoveUI();
      return;
    }

    // Fear monsters: sanity -5
    if (monsterInstance.fear) {
      const drop = reduceSanity(5);
      const mName = monsterInstance.nameKey ? t(monsterInstance.nameKey) : monsterInstance.name;
      addLog(t('logs.fear_effect', { name: mName }) + ` (-${drop})`);
      refreshHUD(ds);
    }

    const mName = monsterInstance.nameKey ? t(monsterInstance.nameKey) : monsterInstance.name;
    const actionEl = document.getElementById('actionContent');
    if (actionEl) {
      actionEl.innerHTML = `
  <div class="encounter fade-in">
          <p class="action-label">${t('logs.combat_start', { emoji: monsterInstance.emoji })}</p>
          <p class="action-desc">${t('logs.combat_desc', { name: mName, level: monsterLevel })}</p>
  </div>
  `;
    }

    // Init & show combat
    initCombat(ds.wanderer, monsterInstance);
    await showCombat(monsterInstance, createCombatCallbacks(monsterInstance));
    return;
  }

  // Chest tile: roll loot
  if (interaction.type === 'chest') {
    const loot = rollChestLoot();
    const added = addItem(loot);
    if (added) {
      addLog(t('logs.chest_gain', { emoji: loot.emoji, name: loot.nameKey ? t(loot.nameKey) : loot.name }));
      showItemToast(loot);
      playSFX('itemPickup');
    } else {
      addLog(t('logs.chest_full'));
    }
    refreshHUD(ds);
    refreshInlineInventory();
    await delay(800);
    showMoveUI();
    return;
  }

  // Event tile or Corner tile: roll random event (new system)
  if (interaction.type === 'event' || interaction.type === 'corner_event') {
    if (!ds.encounteredEvents) ds.encounteredEvents = [];

    const isThemeBoost = interaction.type === 'corner_event';
    const evt = rollEvent(ds.mapData, isThemeBoost, ds.encounteredEvents);

    // Track event to prevent duplicates
    if (evt && evt.id) {
      ds.encounteredEvents.push(evt.id);
      ds.eventsEncountered = (ds.eventsEncountered || 0) + 1;
    }

    // Log the event encounter
    addLog(`${evt.emoji || '❓'} ${t(evt.nameKey || '', evt.name || '이벤트')} - ${t(evt.descKey || '', evt.desc || '')}`);

    if (evt.type === 'immediate') {
      // Roll a single outcome and apply immediately
      const outcomes = evt.outcomes || [];
      const total = outcomes.reduce((a, o) => a + o.weight, 0);
      let r = Math.random() * total;
      let picked = outcomes[outcomes.length - 1];
      for (const o of outcomes) { r -= o.weight; if (r <= 0) { picked = o; break; } }
      const died = applyOutcome(picked, addLog, refreshHUD, refreshInlineInventory);
      updateSanityVFX(ds);

      // Save state immediately after applying outcome
      updateDungeonStatus(ds);

      if (died) { addLog(t('logs.trap_death')); showGameOver(); return; }
      await delay(800);
      showMoveUI();
    } else {
      // Interactive: show modal, wait for choice
      ds.activeEvent = evt;
      updateDungeonStatus(ds); // save state with pending event

      showEventModal(evt, addLog, refreshHUD, refreshInlineInventory, async ({ died, forceEncounter }) => {
        ds.activeEvent = null; // Clear event after choice
        updateSanityVFX(ds);

        // Save state immediately after choice
        updateDungeonStatus(ds);

        if (died) { addLog(t('logs.trap_death')); showGameOver(); return; }
        if (forceEncounter) {
          addLog('⚔️ 적이 나타났다!');
          const pool = ds.mapData.monsterPool || ['m_slime'];
          const monsterId = pool[Math.floor(Math.random() * pool.length)];
          const monsterInstance = getMonster(monsterId, ds.wave);
          initCombat(ds.wanderer, monsterInstance);
          await showCombat(monsterInstance, createCombatCallbacks(monsterInstance));
          return;
        }
        showMoveUI();
      });
    }
    return;
  }

  // Otherwise, enable next move
  showMoveUI();
}

function createCombatCallbacks(monsterInstance) {
  const ds = getDungeonState();
  return {
    onVictory: (allMonsters) => {
      // Clear monster from tile
      const tile = ds.tiles[ds.playerPosition];
      tile.object = null;
      tile.objectData = null;
      setTileObject(tile.index, null);

      // Only count non-summon monsters for EXP and loot
      const naturalMonsters = allMonsters ? allMonsters.filter(m => !m.isSummon) : [monsterInstance];

      // Track kills
      ds.monstersDefeated = (ds.monstersDefeated || 0) + naturalMonsters.length;

      // Grant EXP (sum all natural monster EXP)
      const expGained = naturalMonsters.reduce((sum, m) => sum + (m.exp || 10), 0);
      const mName = monsterInstance.nameKey ? t(monsterInstance.nameKey) : monsterInstance.name;

      import('../gameState.js').then(module => {
        module.addExpToWanderer(ds.wanderer.id, expGained);

        // Sync HUD exp for visual only
        const globalWanderer = module.getState().recruitedWanderers.find(w => w.id === ds.wanderer.id);
        if (globalWanderer) {
          ds.exp = globalWanderer.exp;
          ds.expToNext = globalWanderer.level * 100;
          ds.wanderer.level = globalWanderer.level;
        }
        refreshHUD(getDungeonState());
      });

      addLog(t('logs.victory', { name: mName }) + ` (+${expGained} EXP)`);

      naturalMonsters.forEach(m => {
        const loot = rollMonsterLoot(m);
        if (loot) {
          const added = addItem(loot);
          if (added) {
            setTimeout(() => {
              const logEl = document.getElementById('logContent');
              if (logEl) {
                const entry = document.createElement('p');
                entry.className = 'log-entry log-new';
                entry.textContent = `> ${t('logs.loot_gain', { emoji: loot.emoji, name: loot.name })}`;
                logEl.appendChild(entry);
                logEl.scrollTop = logEl.scrollHeight;
              }
            }, 150);
            showItemToast(loot);
            playSFX('itemPickup');
          } else {
            addLog(t('logs.inventory_full'));
          }
        }
      });

      refreshHUD(getDungeonState());
      refreshInlineInventory();
      showMoveUI();
    },
    onDefeat: () => {
      addLog(t('logs.death'));
      // Recover safe bag items
      const inv = getInventory();
      if (inv && inv.safeBag) {
        const recoveredItems = inv.safeBag.filter(i => i !== null);
        if (recoveredItems.length > 0) {
          sendToMailbox(recoveredItems, t('ui.mailbox.dead_safebag', { name: ds.wanderer?.nameKey ? t(ds.wanderer.nameKey) : ds.wanderer?.name }));
          addLog(t('logs.safe_bag_recovery'));
        }
      }
      showGameOver();
    },
    onFlee: () => {
      const mName = monsterInstance.nameKey ? t(monsterInstance.nameKey) : monsterInstance.name;
      addLog(t('logs.flee', { name: mName }));
      refreshHUD(getDungeonState());
      refreshInlineInventory();
      showMoveUI();
    },
  };
}

function showDungeonClear() {
  const actionEl = document.getElementById('actionContent');
  if (!actionEl) return;

  const ds = getDungeonState();
  const inv = getInventory();

  // Gather all items
  const allItems = [
    ...(inv?.slots || []),
    ...(inv?.safeBag || []),
    ...(inv?.equipped ? [inv.equipped] : [])
  ].filter(item => item !== null && item.id !== 'w_fist');

  // Build item list HTML
  const itemListHTML = allItems.length === 0
    ? `<p style="color:var(--text-muted);font-size:12px;text-align:center;">아이템 없음</p>`
    : allItems.map(item => `
      <div class="grade-${item.grade || 'common'}" style="display:flex;align-items:center;gap:6px;padding:4px 6px;background:var(--bg-card);border-radius:6px;border:1px solid var(--border);">
        <span style="font-size:18px;">${item.emoji || '📦'}</span>
        <span style="font-size:12px;color:var(--text);flex:1;">${item.nameKey ? t(item.nameKey) : item.name}</span>
        ${item.qty && item.qty > 1 ? `<span style="font-size:11px;color:var(--gold);">x${item.qty}</span>` : ''}
      </div>
    `).join('');

  actionEl.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'fade-in';
  container.style.cssText = `
    display: flex; flex-direction: column; gap: 12px; padding: 16px;
    background: linear-gradient(180deg, rgba(20,30,15,0.97), rgba(10,15,5,0.97));
    border: 1px solid var(--gold-dim); border-radius: 12px; overflow-y: auto; max-height: 100%;
  `;

  container.innerHTML = `
    <div style="text-align:center;">
      <div style="font-size:36px;">🏆</div>
      <div style="font-family:var(--font-title);font-size:20px;color:var(--gold);font-weight:800;letter-spacing:1px;">
        ${t('ui.dungeon.status_cleared', '던전 클리어!')}
      </div>
      <div style="font-size:12px;color:var(--text-dim);margin-top:4px;">
        ${ds.mapData?.nameKey ? t(ds.mapData.nameKey) : (ds.mapData?.name || '던전')} 탐험 완료
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center;">
        <div style="font-size:22px;">⚔️</div>
        <div style="font-size:20px;font-weight:700;color:var(--gold);">${ds.monstersDefeated || 0}</div>
        <div style="font-size:11px;color:var(--text-dim);">처치한 몬스터</div>
      </div>
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center;">
        <div style="font-size:22px;">📜</div>
        <div style="font-size:20px;font-weight:700;color:var(--gold);">${ds.eventsEncountered || 0}</div>
        <div style="font-size:11px;color:var(--text-dim);">경험한 이벤트</div>
      </div>
    </div>

    <div>
      <div style="font-size:11px;color:var(--text-dim);font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">
        📦 획득 아이템 (${allItems.length}개) → 창고로 이동
      </div>
      <div style="display:flex;flex-direction:column;gap:4px;max-height:140px;overflow-y:auto;">
        ${itemListHTML}
      </div>
    </div>

    <button id="btnDungeonClearConfirm" style="
      padding:12px; font-size:14px; font-weight:700;
      background:linear-gradient(135deg, var(--gold-dim), var(--gold));
      color:#000; border:none; border-radius:8px; cursor:pointer;
      transition:opacity 0.2s;
    ">✅ 확인 (아이템 창고 이동 후 귀환)</button>
  `;

  actionEl.appendChild(container);

  document.getElementById('btnDungeonClearConfirm')?.addEventListener('click', async () => {
    const gs = getState();
    const ds = getDungeonState();
    const w = ds.wanderer;
    const inv = getInventory();

    if (w) {
      // Sync stats back to global wanderer
      const globalW = gs.recruitedWanderers.find(rw => rw.id === w.id);
      if (globalW) {
        globalW.curHp = ds.currentHp;
        globalW.curSanity = ds.sanity;
        globalW.level = ds.level;
        globalW.exp = ds.exp;
        globalW.statPoints = ds.freeStatPoints;
        globalW.vit = w.vit;
        globalW.str = w.str;
        globalW.agi = w.agi;
        globalW.spd = w.spd;
        globalW.dex = w.dex;
        globalW.luk = w.luk;
      }
    }

    // Transfer all items to storage (overflow → mailbox)
    const itemsToTransfer = [
      ...(inv?.slots || []),
      ...(inv?.safeBag || []),
      ...(inv?.equipped && inv.equipped.id !== 'w_fist' ? [inv.equipped] : []),
    ].filter(item => item !== null);

    const overflow = [];
    for (const item of itemsToTransfer) {
      const added = addItemToStorage(item);
      if (!added) overflow.push(item);
    }

    if (overflow.length > 0) {
      const wName = w?.nameKey ? t(w.nameKey) : (w?.name || '방랑자');
      sendToMailbox(overflow, `${wName}의 귀환 아이템 (창고 초과)`, 30);
    }

    updateDungeonStatus(ds.mapData.id, 'cleared');
    clearActiveDungeon();
    changeScene('town');
  });
}

function showGameOver() {
  const actionEl = document.getElementById('actionContent');
  if (actionEl) {
    actionEl.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'game-over fade-in';

    // Game Over Label
    const p1 = document.createElement('p');
    p1.className = 'action-label';
    p1.textContent = t('dungeon_ui.game_over');
    container.appendChild(p1);

    // Description
    const p2 = document.createElement('p');
    p2.className = 'action-desc';
    p2.textContent = t('dungeon_ui.wanderer_fallen');
    container.appendChild(p2);

    // Return Button
    const btn = document.createElement('button');
    btn.className = 'btn-action btn-return-town';
    btn.id = 'btnGameOverReturn';
    btn.textContent = t('dungeon_ui.return_to_town');
    container.appendChild(btn);

    actionEl.appendChild(container);

    btn.addEventListener('click', () => {
      const gs = getState();
      const ds = getDungeonState();
      const w = ds.wanderer; // Current wanderer in dungeon
      if (w) {
        const globalW = gs.recruitedWanderers.find(rw => rw.id === w.id);
        if (globalW) {
          globalW.status = 'dead';
          globalW.level = ds.level;
          globalW.exp = ds.exp;
          globalW.statPoints = ds.freeStatPoints;
          globalW.vit = w.vit;
          globalW.str = w.str;
          globalW.agi = w.agi;
          globalW.spd = w.spd;
          globalW.dex = w.dex;
          globalW.luk = w.luk;
        }
        // send Safe Bag to mailbox
        const safeItems = (ds.inventory?.safeBag || []).filter(item => item !== null);
        if (safeItems.length > 0) {
          sendToMailbox(safeItems, t('ui.mailbox.dead_safebag', { name: w.nameKey ? t(w.nameKey) : w.name }), 7);
        }
      }
      updateDungeonStatus(ds.mapData.id, 'failed');
      clearActiveDungeon();
      changeScene('town');
    });
  }
}

// ─── UI Helpers ───

function addLog(msg) {
  const logEl = document.getElementById('logContent');
  if (!logEl) return;
  const entry = document.createElement('p');
  entry.className = 'log-entry log-new';
  entry.textContent = `> ${msg}`;
  logEl.appendChild(entry);
  logEl.scrollTop = logEl.scrollHeight;
}

function showDicePopup(value, penalty = 0, isPenalized = false) {
  const board = document.getElementById('boardContainer');
  if (!board) return;
  const popup = document.createElement('div');
  popup.className = 'dice-popup' + (isPenalized ? ' dice-popup-penalized' : '');
  if (isPenalized && penalty < 0) {
    popup.innerHTML = `${value} <span class="dice-penalty-badge">${penalty}</span>`;
  } else {
    popup.textContent = value;
  }
  // Remove any existing popup first
  board.querySelectorAll('.dice-popup').forEach(p => p.remove());
  board.appendChild(popup);
  const duration = isPenalized ? 1400 : 1000;
  setTimeout(() => popup.remove(), duration);
}

function refreshTopbar(ds) {
  const waveEl = document.getElementById('topWave');
  const turnEl = document.getElementById('topTurn');
  if (waveEl) {
    const isFinal = ds.mapData && ds.mapData.maxWave && ds.wave >= ds.mapData.maxWave;
    waveEl.textContent = isFinal ? t('ui.dungeon.final_wave', 'Final Wave') : `${t('dungeon_ui.wave', 'Wave')} ${ds.wave}`;
  }
  if (turnEl) turnEl.textContent = `Turn ${ds.turn}`;
  refreshCurrencyDisplay();
}

async function showWaveTitle(wave) {
  const container = document.querySelector('.dungeon-scene');
  if (!container) return;

  playSFX('waveStart');

  const ds = getDungeonState();
  const isFinal = ds.mapData && ds.mapData.maxWave && wave >= ds.mapData.maxWave;
  const titleText = isFinal ? t('ui.dungeon.final_wave', 'Final Wave') : t('dungeon_ui.wave_title', { wave });

  const overlay = document.createElement('div');
  overlay.className = 'wave-title-overlay';
  overlay.innerHTML = `<div class="wave-title-text">${titleText}</div>`;
  container.appendChild(overlay);

  // Wait for animation (Reduced to ~1.3s total)
  await delay(1300);
  overlay.remove();
}

function refreshHUD(ds) {
  const hudEl = document.getElementById('hudPanel');
  if (!hudEl) return;
  hudEl.innerHTML = `<h3>${t('dungeon_ui.player_info')}</h3>` + renderHUD(ds);
}

function renderHUD(ds) {
  const w = ds.wanderer;
  if (!w) return `<p>${t('dungeon_ui.no_info')}</p>`;


  const hpPercent = Math.round((ds.currentHp / ds.maxHp) * 100);
  const sanityPercent = Math.round((ds.sanity / ds.maxSanity) * 100);
  const sanityState = getSanityStatus(ds.sanity);

  return `
  <div class="hud-portrait">${w.portrait}</div>
    <div class="hud-name">${w.nameKey ? t(w.nameKey) : w.name}</div>
    <div class="hud-class">${w.classIcon} ${w.classKey ? t(w.classKey) : w.className}</div>

    <div class="hud-bar-group">
      <label class="hud-bar-label">${t('dungeon_ui.hp')}</label>
      <div class="hud-bar hp-bar"><div class="hud-bar-fill" style="width:${hpPercent}%"></div><span class="hud-bar-text">${ds.currentHp}/${ds.maxHp}</span></div>
    </div>
    <div class="hud-bar-group">
      <label class="hud-bar-label">${t('dungeon_ui.sanity')}</label>
      <div class="hud-bar sanity-bar ${sanityState.class}"><div class="hud-bar-fill" style="width:${sanityPercent}%"></div><span class="hud-bar-text">${ds.sanity}/${ds.maxSanity} (${t(sanityState.labelKey)})</span></div>
    </div>
    <div class="hud-bar-group">
    <div class="hud-bar-group">
      <label class="hud-bar-label">${t('dungeon_ui.exp')}</label>
      <div class="hud-bar exp-bar"><div class="hud-bar-fill" style="width:${(ds.exp / ds.expToNext) * 100}%"></div><span class="hud-bar-text">${ds.exp}/${ds.expToNext}</span></div>
    </div>

    ${ds.statusEffects && ds.statusEffects.length > 0 ? `
    <div class="hud-status-effects">
      ${ds.statusEffects.map(e => {
    const durText = e.duration === Infinity ? '∞' : `${e.duration}`;
    const label = e.labelKey ? t(e.labelKey, e.id) : (e.label || e.id);
    return `<span class="status-badge status-${e.id}" title="${label} (${durText}턴)">${e.icon || '⚠️'} ${durText}</span>`;
  }).join('')}
    </div>` : ''
    }
    <div class="hud-info-row">
      <span class="hud-info-item">📍 Tile ${ds.playerPosition}</span>
      <span class="hud-info-item">${(ds.mapData && ds.mapData.maxWave && ds.wave >= ds.mapData.maxWave) ? t('ui.dungeon.final_wave', 'Final Wave') : `${t('dungeon_ui.wave', 'Wave')} ${ds.wave}`}</span>
      <span class="hud-info-item">🆙 Lv.${ds.level} ${ds.freeStatPoints > 0 ? `<button id="btnOpenStats" class="btn-levelup-trigger pulse">${t('dungeon_ui.stats_dist')}</button>` : ''}</span>
    </div>

    <div class="hud-stats">
      <div class="hud-stat"><span class="hud-stat-key">${t('dungeon_ui.vit')}</span><span class="hud-stat-val">${w.vit}</span></div>
      <div class="hud-stat"><span class="hud-stat-key">${t('dungeon_ui.str')}</span><span class="hud-stat-val">${w.str}</span></div>
      <div class="hud-stat"><span class="hud-stat-key">${t('dungeon_ui.agi')}</span><span class="hud-stat-val">${w.agi}</span></div>
      <div class="hud-stat"><span class="hud-stat-key">${t('dungeon_ui.spd')}</span><span class="hud-stat-val">${w.spd}</span></div>
      <div class="hud-stat"><span class="hud-stat-key">${t('dungeon_ui.dex')}</span><span class="hud-stat-val">${w.dex}</span></div>
      <div class="hud-stat"><span class="hud-stat-key">${t('dungeon_ui.luk')}</span><span class="hud-stat-val">${w.luk}</span></div>
    </div>

    <div class="hud-traits">
      ${w.traits.map((trait) => {
      const nameKey = trait.nameKey || `traits.${trait.type}.${trait.id}.name`;
      const descKey = trait.descKey || `traits.${trait.type}.${trait.id}.desc`;
      return `<span class="trait-badge ${trait.type}" title="${t(descKey)}">${trait.icon || ''} ${t(nameKey)}</span>`;
    }).join('')}
    </div>
`;
}

// Re-export setTileObject for wave clear (already imported at top)
import { updateBoardVisibility } from '../mapEngine.js';

function updateSanityVFX(ds) {
  const vfx = document.getElementById('sanityVfx') || createSanityVfx();
  if (ds.sanity <= 30) {
    vfx.classList.add('sanity-vfx-active');
    if (ds.sanity <= 10) {
      vfx.classList.add('sanity-vfx-madness');
    } else {
      vfx.classList.remove('sanity-vfx-madness');
    }
  } else {
    vfx.classList.remove('sanity-vfx-active', 'sanity-vfx-madness');
  }
}

function createSanityVfx() {
  const el = document.createElement('div');
  el.id = 'sanityVfx';
  el.className = 'sanity-vfx';
  document.body.appendChild(el);
  return el;
}

// ─── Setup Update Callback ───
setUpdateCallback((newState) => {
  const container = document.getElementById('app');
  if (container && newState) {
    renderHUD(container, newState);
    updateSanityVFX(newState);
    // Update Fog of War visibility on board tiles
    if (newState.tiles) {
      updateBoardVisibility(newState.tiles);
    }
  }
});
