import re

with open('c:/Work/round-the-dungeon/src/scenes/dungeonScene.js', 'r', encoding='utf-8') as f:
    text = f.read()

# We'll just define the entire content here because rewriting it piecewise is too error prone given the structural changes.

new_content = """// ─── Dungeon Scene (던전씬) — Phase 4: Data Layer Integration ───
import { changeScene } from '../sceneManager.js';
import { renderFloorMap, movePlayerToken, setPlayerPortrait, setTileObject } from '../mapEngine.js';
import {
  initDungeonState, getDungeonState, setLogCallback, setUpdateCallback,
  executeMovePhase, processMovementSteps, moveToNextFloor, enterCurrentFloor,
  handleTileInteraction, getSanityStatus, loadDungeonState, reduceSanity,
  tickStatusEffects, triggerUpdate
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

  let ds;

  if (resume && getState().activeDungeon) {
    const saved = getState().activeDungeon;
    map = saved.mapData;
    wanderer = saved.wanderer;
    ds = loadDungeonState(saved);

    if (saved.inventory) {
      prepInv = saved.inventory.slots;
      prepSafeBag = saved.inventory.safeBag;
    }
  } else {
    // Generate full dungeon map first (dungeonMap graph)
    import('../mapEngine.js').then(({ buildDungeonMap }) => {
      const dungeonMap = buildDungeonMap(map);
      ds = initDungeonState(dungeonMap, map, wanderer);
      
      const globalW = getState().recruitedWanderers.find(rw => rw.id === wanderer.id);
      if (globalW) {
        globalW.status = 'exploring';
      }
      
      renderScene(container, map, wanderer, ds, resume, prepInv, prepSafeBag);
    });
    return; // Wait for initial build
  }

  renderScene(container, map, wanderer, ds, resume, prepInv, prepSafeBag);
}

function renderScene(container, map, wanderer, ds, resume, prepInv, prepSafeBag) {
  const floorNum = ds.dungeonMap.floors[ds.currentFloorIndex].floor;

  container.innerHTML = `
  <div class="dungeon-scene">
      <div class="dungeon-topbar">
        <div class="dungeon-topbar-info">
          <span class="topbar-map">${map?.icon || '🗺️'} ${map?.nameKey ? t(map.nameKey) : (map?.name || t('dungeon_ui.dungeon', '던전'))}</span>
          <span class="topbar-sep">|</span>
          <span class="topbar-wave" id="topFloor">${t('dungeon_ui.floor', '층')} ${floorNum}</span>
          <span class="topbar-sep">|</span>
          <span class="topbar-turn" id="topTurn">${t('dungeon_ui.turn', '턴')} ${ds.turn}</span>
        </div>
        <div class="topbar-actions" style="display:flex; align-items:center; gap: 10px;">
          <div class="currency-item diamond">
            <span class="currency-icon">💎</span>
            <span class="currency-value">${getState().diamonds.toLocaleString()}</span>
          </div>
          <div class="currency-item gold">
            <span class="currency-icon">💰</span>
            <span class="currency-value">${getState().gold.toLocaleString()}</span>
          </div>
          <div class="topbar-wanderer">
            <span>${wanderer?.portrait || ''}</span>
            <span>${wanderer?.nameKey ? t(wanderer.nameKey) : (wanderer?.name || '')}</span>
          </div>
        </div>
      </div>

      <div class="dungeon-body">
        <aside class="dungeon-left">
          <div class="panel hud-panel" id="hudPanel">
            <h3>${t('dungeon_ui.player_info')}</h3>
            ${wanderer ? renderHUD(ds) : `<p>${t('dungeon_ui.no_info')}</p>`}
          </div>
        </aside>

        <section class="dungeon-center">
          <div class="board-container" id="boardContainer"></div>
        </section>

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

        ${buildInlineInventoryHTML()}
      </div>
  </div>
  `;

  setLogCallback((msg) => {
    const logEl = document.getElementById('logContent');
    if (!logEl) return;
    const entry = document.createElement('p');
    entry.className = 'log-entry log-new';
    entry.textContent = msg;
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
  });

  setUpdateCallback((state) => {
    refreshTopbar(state);
    refreshHUD(state);
  });

  const inv = initInventory(wanderer, prepInv, prepSafeBag);
  if (resume && getState().activeDungeon?.inventory?.equipped) {
    inv.equipped = getState().activeDungeon.inventory.equipped;
  } else if (!resume && wanderer.equipments?.weapon && wanderer.equipments.weapon.id !== 'w_fist') {
    inv.equipped = { ...wanderer.equipments.weapon };
  }

  const floorMap = ds.dungeonMap.floors[ds.currentFloorIndex];
  const boardContainer = document.getElementById('boardContainer');
  renderFloorMap(floorMap, boardContainer, map?.theme);
  boardRendered = true;

  if (wanderer) setPlayerPortrait(wanderer.portrait);

  requestAnimationFrame(() => {
    movePlayerToken(ds.playerPosition, false);

    const wName = wanderer?.nameKey ? t(wanderer.nameKey) : (wanderer?.name || t('dungeon_ui.wanderer'));
    if (!resume) {
      addLog(`[System] ${wName} 플레이어가 던전에 진입했습니다.`);
    } else {
      addLog(`[System] ${wName} 탐험을 재개합니다.`);
    }

    refreshInlineInventory();
    window.__refreshHUD = () => refreshHUD(getDungeonState());

    (async () => {
      if (resume && ds.currentHp <= 0) {
        showGameOver();
      } else if (resume && ds.combat) {
        loadCombatState(ds.combat);
        const mainMonster = ds.combat.monsters[0];
        showCombat(mainMonster, createCombatCallbacks(mainMonster), true);
      } else if (resume && ds.activeEvent) {
        addLog(`[System] 이벤트를 복원합니다.`);
        showEventModal(ds.activeEvent, addLog, refreshHUD, refreshInlineInventory, async ({ died, forceEncounter }) => {
          ds.activeEvent = null;
          updateDungeonStatus(ds);
          if (died) { showGameOver(); return; }
          if (forceEncounter) { await launchRandomCombat(); return; }
          showMoveUI();
        });
      } else {
        await showFloorTitle(floorNum);
        showMoveUI();
      }
    })();
  });
}

export function unmount() {
  boardRendered = false;
}

// ─── UI Helpers ───
function addLog(msg) {
  const logEl = document.getElementById('logContent');
  if (logEl) {
    const p = document.createElement('p');
    p.className = 'log-entry log-new';
    p.textContent = msg;
    logEl.appendChild(p);
    logEl.scrollTop = logEl.scrollHeight;
  } else {
    // Queue if not rendered yet
    setTimeout(() => addLog(msg), 100);
  }
}

function refreshTopbar(state) {
  const floorEl = document.getElementById('topFloor');
  if (floorEl) {
    const floorNum = state.dungeonMap.floors[state.currentFloorIndex].floor;
    floorEl.textContent = `${t('dungeon_ui.floor', '층')} ${floorNum}`;
  }
  const turnEl = document.getElementById('topTurn');
  if (turnEl) turnEl.textContent = `${t('dungeon_ui.turn', '턴')} ${state.turn}`;
}

async function showFloorTitle(floorNum) {
  const ds = getDungeonState();
  const titleHtml = `
    <div class="wave-title-overlay" id="waveTitleOverlay">
        <h1 class="wave-text glitch" data-text="${floorNum} F">${floorNum} F</h1>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', titleHtml);
  playSFX('startWave');
  await delay(1500);
  const el = document.getElementById('waveTitleOverlay');
  if (el) el.remove();
}

function showDicePopup(val, penalty = 0, withBadge = false) {
  const old = document.getElementById('dicePopupOverlay');
  if (old) old.remove();

  const board = document.getElementById('boardContainer');
  if (!board) return;

  const overlay = document.createElement('div');
  overlay.id = 'dicePopupOverlay';
  overlay.className = 'dice-popup-overlay';

  let html = `<div class="dice-popup-content"><span class="dice-popup-icon">🎲</span><span class="dice-popup-val">${val}</span>`;
  if (penalty < 0 && withBadge) {
    html += `<div class="dice-penalty-badge">${penalty}</div>`;
  }
  html += `</div>`;
  overlay.innerHTML = html;

  board.appendChild(overlay);

  setTimeout(() => {
    overlay.classList.add('fade-out-up');
    setTimeout(() => overlay.remove(), 400);
  }, 600);
}

// ─── Game Flow ───
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
  const btn = document.getElementById('btnRollMove');
  if (btn) btn.disabled = true;
  playSFX('dice');

  const result = executeMovePhase();
  const rawRoll = result.rawRoll ?? result.roll;
  const penalty = result.penaltyApplied || 0;

  refreshTopbar(ds);
  refreshHUD(ds);

  if (penalty < 0) {
    showDicePopup(rawRoll, 0, false);
    await delay(700);
    showDicePopup(result.roll, penalty, true);
    addLog(`[무게 페널티] 주사위 ${rawRoll} ${penalty} = ${result.roll}`);
    await delay(600);
  } else {
    showDicePopup(result.roll, 0, false);
  }

  await executeMovementSteps(result.roll);
}

async function executeMovementSteps(stepsRemaining, chosenNextCell = null) {
  const ds = getDungeonState();
  
  const moveRes = processMovementSteps(stepsRemaining, [], chosenNextCell);
  
  // Animate the path segment
  if (moveRes.pathSegment.length > 0) {
    for (const pos of moveRes.pathSegment) {
      movePlayerToken(pos, true);
      // Heal HP per step
      if (ds.currentHp < ds.maxHp) {
        ds.currentHp = Math.min(ds.maxHp, ds.currentHp + 1); // fixed 1 hp per tile
        refreshHUD(ds);
      }
      await delay(350);
    }
  }

  // Update logic after this segment
  tickStatusEffects();
  refreshTopbar(ds);
  refreshHUD(ds);
  if (ds.currentHp <= 0) { showGameOver(); return; }

  if (moveRes.stoppedForChoice) {
      // Need player direction selection
      showDirectionChoiceUI(moveRes.availableChoices, moveRes.stepsRemaining);
      return;
  }

  if (moveRes.stepsRemaining === 0 || moveRes.stoppedForEvent) {
      // Finished moving organically or hit an event
      await resolveTileInteraction();
  }
}

function showDirectionChoiceUI(choices, stepsRemaining) {
    const ds = getDungeonState();
    const actionEl = document.getElementById('actionContent');
    if (!actionEl) return;

    let html = `
    <div class="move-phase fade-in">
        <p>갈림길에 도착했습니다. 방향을 선택하세요.</p>
        <p>잔여 이동 수: ${stepsRemaining}</p>
        <div class="direction-choices">
    `;

    // Try to map adjacency to logical directions
    const floorMap = ds.dungeonMap.floors[ds.currentFloorIndex];
    const currCell = floorMap.cells.find(c => c.index === ds.playerPosition);

    choices.forEach(cellIdx => {
        const nextCell = floorMap.cells.find(c => c.index === cellIdx);
        let dirLabel = '이동';
        if (nextCell.gr < currCell.gr) dirLabel = '위로';
        if (nextCell.gr > currCell.gr) dirLabel = '아래로';
        if (nextCell.gc < currCell.gc) dirLabel = '왼쪽으로';
        if (nextCell.gc > currCell.gc) dirLabel = '오른쪽으로';
        
        html += `<button class="btn-action direction-btn" data-target="${cellIdx}">${dirLabel}</button>`;
    });

    html += `</div></div>`;
    actionEl.innerHTML = html;

    document.querySelectorAll('.direction-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tgt = parseInt(e.target.dataset.target, 10);
            executeMovementSteps(stepsRemaining, tgt); // Continue with chosen
        });
    });
}

async function resolveTileInteraction() {
  const ds = getDungeonState();
  const interaction = handleTileInteraction(); // Returns { type, data }

  if (interaction.type === 'exit_cleared') {
      addLog(`출구가 열렸습니다! 던전 클리어!`);
      showDungeonClear();
      return;
  }

  if (interaction.type === 'stairs') {
      addLog(`계단을 발견했습니다. 다음 층으로 내려갑니다...`);
      await delay(1000);
      moveToNextFloor();
      const floorMap = ds.dungeonMap.floors[ds.currentFloorIndex];
      const boardContainer = document.getElementById('boardContainer');
      renderFloorMap(floorMap, boardContainer, ds.mapData.theme);
      movePlayerToken(ds.playerPosition, false); // jump to start
      await showFloorTitle(floorMap.floor);
      showMoveUI();
      return;
  }

  if (interaction.type === 'monster') {
    const monsterId = interaction.data?.monsterId;
    // Map wave logic is gone, use floor index as base level + 1
    const monsterLevel = (interaction.data?.level) || (ds.currentFloorIndex + 1);
    const monsterInstance = getMonster(monsterId, monsterLevel);

    if (!monsterInstance) {
      showMoveUI();
      return;
    }

    if (monsterInstance.fear) {
      const drop = reduceSanity(5);
      addLog(`공포! (-${drop})`);
      refreshHUD(ds);
    }

    const actionEl = document.getElementById('actionContent');
    if (actionEl) {
      actionEl.innerHTML = `
      <div class="encounter fade-in">
        <p class="action-label">${monsterInstance.emoji} 적 출현</p>
      </div>`;
    }

    initCombat(ds.wanderer, monsterInstance);
    await showCombat(monsterInstance, createCombatCallbacks(monsterInstance));
    return;
  }

  if (interaction.type === 'chest') {
    const loot = rollChestLoot();
    const added = addItem(loot);
    if (added) {
      addLog(`📦 ${t(loot.nameKey || '', loot.name)} 획득!`);
      showItemToast(loot);
      playSFX('itemPickup');
    } else {
      addLog(t('logs.inventory_full'));
    }
    refreshHUD(ds);
    refreshInlineInventory();
    await delay(800);
    showMoveUI();
    return;
  }

  if (interaction.type === 'event' || interaction.type === 'corner_event') {
    if (!ds.encounteredEvents) ds.encounteredEvents = [];
    const evt = rollEvent(ds.mapData, false, ds.encounteredEvents);
    if (evt && evt.id) {
      ds.encounteredEvents.push(evt.id);
      ds.eventsEncountered = (ds.eventsEncountered || 0) + 1;
    }

    if (evt.type === 'immediate') {
      const outcomes = evt.outcomes || [];
      const total = outcomes.reduce((a, o) => a + o.weight, 0);
      let r = Math.random() * total;
      let picked = outcomes[outcomes.length - 1];
      for (const o of outcomes) { r -= o.weight; if (r <= 0) { picked = o; break; } }
      const died = applyOutcome(picked, addLog, refreshHUD, refreshInlineInventory);
      updateDungeonStatus(ds);

      if (died) { showGameOver(); return; }
      await delay(800);
      showMoveUI();
    } else {
      ds.activeEvent = evt;
      updateDungeonStatus(ds);

      showEventModal(evt, addLog, refreshHUD, refreshInlineInventory, async ({ died, forceEncounter }) => {
        ds.activeEvent = null;
        updateDungeonStatus(ds);
        if (died) { showGameOver(); return; }
        if (forceEncounter) { await launchRandomCombat(); return; }
        showMoveUI();
      });
    }
    return;
  }

  // empty or completed start turn
  showMoveUI();
}

async function launchRandomCombat() {
  const ds = getDungeonState();
  const pool = ['m_slime'];
  const monsterId = pool[0];
  const monsterInstance = getMonster(monsterId, ds.currentFloorIndex + 1);
  initCombat(ds.wanderer, monsterInstance);
  await showCombat(monsterInstance, createCombatCallbacks(monsterInstance));
}

function createCombatCallbacks(monsterInstance) {
  const ds = getDungeonState();
  return {
    onVictory: (allMonsters) => {
      const floorMap = ds.dungeonMap.floors[ds.currentFloorIndex];
      const cell = floorMap.cells.find(c => c.index === ds.playerPosition);
      if (cell) {
          cell.object = null;
          cell.objectData = null;
          setTileObject(cell.index, null);
      }

      const naturalMonsters = allMonsters ? allMonsters.filter(m => !m.isSummon) : [monsterInstance];
      ds.monstersDefeated = (ds.monstersDefeated || 0) + naturalMonsters.length;
      const expGained = naturalMonsters.reduce((sum, m) => sum + (m.exp || 10), 0);

      import('../gameState.js').then(module => {
        module.addExpToWanderer(ds.wanderer.id, expGained);
        const globalWanderer = module.getState().recruitedWanderers.find(w => w.id === ds.wanderer.id);
        if (globalWanderer) {
          ds.exp = globalWanderer.exp;
          ds.expToNext = globalWanderer.level * 100;
          ds.wanderer.level = globalWanderer.level;
        }
        refreshHUD(getDungeonState());
      });

      addLog(`승리! (+${expGained} EXP)`);

      naturalMonsters.forEach(m => {
        const loot = rollMonsterLoot(m);
        if (loot) {
          const added = addItem(loot);
          if (added) {
            setTimeout(() => addLog(`> ${t(loot.nameKey || '', loot.name)}`), 150);
            showItemToast(loot);
            playSFX('itemPickup');
          }
        }
      });

      refreshHUD(getDungeonState());
      refreshInlineInventory();
      updateDungeonStatus(ds);
      showMoveUI();
    },
    onFlee: () => {
      addLog(t('logs.flee_success'));
      updateDungeonStatus(ds);
      showMoveUI();
    },
    onDefeat: () => {
      addLog(t('logs.death'));
      showGameOver();
    }
  };
}

function showGameOver() {
  const actionEl = document.getElementById('actionContent');
  if (!actionEl) return;
  
  // Actually handle death (kill wanderer in state)
  const wId = getDungeonState().wanderer.id;
  import('../gameState.js').then(module => {
      module.handleWandererDeath(wId);
      clearActiveDungeon();
  });

  playSFX('gameOver');
  actionEl.innerHTML = `
  <div class="game-over fade-in">
    <h3 style="color:var(--danger-color); margin-bottom:10px;">${t('dungeon_ui.game_over')}</h3>
    <button class="btn-action" id="btnReturnTown">${t('dungeon_ui.return_town')}</button>
  </div>
  `;
  document.getElementById('btnReturnTown').addEventListener('click', () => {
    changeScene('town');
  });
}

function showDungeonClear() {
  const actionEl = document.getElementById('actionContent');
  if (!actionEl) return;

  const ds = getDungeonState();
  const inv = getInventory();
  
  import('../gameState.js').then(module => {
      const gs = module.getState();
      const gw = gs.recruitedWanderers.find(w => w.id === ds.wanderer.id);
      if (gw) {
          gw.status = 'idle';
          gw.currentHp = ds.wanderer.vit * 5 + 50; // simple heal on return
      }
      
      // Transfer loot safe bag -> town storage
      inv.safeBag.forEach(it => module.addItemToStorage(it));
      
      module.progressTownLevel(ds.mapData.mapLv);
      module.clearActiveDungeon();
  });

  playSFX('dungeonClear');
  actionEl.innerHTML = `
  <div class="dungeon-clear fade-in">
    <h3 style="color:var(--success-color); margin-bottom:10px;">던전 클리어!</h3>
    <p>무사히 마을로 복귀합니다.</p>
    <button class="btn-action" id="btnReturnTownClear">${t('dungeon_ui.return_town')}</button>
  </div>
  `;
  document.getElementById('btnReturnTownClear').addEventListener('click', () => {
    changeScene('town');
  });
}

function renderHUD(state) {
  const w = state.wanderer;
  const hpStr = `${state.currentHp}/${state.maxHp}`;
  const hpPct = Math.max(0, Math.min(100, (state.currentHp / state.maxHp) * 100));

  const sanityStatus = getSanityStatus(state.sanity);
  const isDanger = state.sanity <= 20;

  let traitsHtml = '';
  if (w.traits && w.traits.length > 0) {
    traitsHtml = `<div class="hud-traits">` +
      w.traits.map(t => `<span class="hud-trait-pill ${t.type}" title="${t.desc}">${t.icon} ${t.name}</span>`).join('') +
      `</div>`;
  }

  let statusHtml = '';
  if (state.statusEffects && state.statusEffects.length > 0) {
    statusHtml = `<div class="status-effects-list">` +
      state.statusEffects.map(e => {
        const durText = e.duration === Infinity ? '∞' : `${e.duration}`;
        return `<span class="status-badge" title="${e.label || e.id}">${e.icon || '⚡'}<span class="status-dur">${durText}</span></span>`;
      }).join('') +
      `</div>`;
  }

  const wClass = `HUD`; // simplified

  // HUD
  const el = document.getElementById('hudPanel');
  if (el) {
    el.innerHTML = `
      <div class="hud-header">
          <div class="hud-portrait">${w.portrait}</div>
          <div class="hud-basic">
            <div class="hud-name">${w.name} ${traitsHtml}</div>
            <div class="hud-class">${wClass} <span class="hud-level">Lv.${state.level}</span></div>
            <div class="hud-exp-bar" title="EXP: ${state.exp} / ${state.expToNext}">
              <div class="hud-exp-fill" style="width: ${(state.exp / state.expToNext) * 100}%"></div>
            </div>
            ${statusHtml}
          </div>
      </div>
      <div class="hud-stats-grid">
          <div class="stat-hp">
              <span class="stat-label">HP</span>
              <div class="bar-bg"><div class="bar-fill hp-fill" style="width:${hpPct}%"></div></div>
              <span class="stat-val">${hpStr}</span>
          </div>
          <div class="stat-sanity">
              <span class="stat-label">이성</span>
              <div class="bar-bg sanity-bg ${isDanger ? 'glitch-bg' : ''}">
                  <div class="bar-fill sanity-fill ${sanityStatus.class}" style="width:${state.sanity}%"></div>
              </div>
              <span class="stat-val ${sanityStatus.class}">${state.sanity}%</span>
          </div>
      </div>
      <button class="btn-stats ${state.freeStatPoints > 0 ? 'pulse' : ''}" id="btnOpenStats">
        캐릭터 상세 & 스탯 ${state.freeStatPoints > 0 ? `<span class="badge">${state.freeStatPoints}</span>` : ''}
      </button>
    `;

    document.getElementById('btnOpenStats')?.addEventListener('click', () => {
      // openLevelUpOverlay(() => refreshHUD(getDungeonState()));
    });
  }
}

function refreshHUD(state) {
  renderHUD(state);
}
"""

with open('c:/Work/round-the-dungeon/src/scenes/dungeonScene.js', 'w', encoding='utf-8') as f:
    f.write(new_content)
