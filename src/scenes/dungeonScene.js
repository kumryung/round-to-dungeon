// ─── Dungeon Scene (던전씬) — Phase 4: Data Layer Integration ───
import { changeScene } from '../sceneManager.js';
import { renderFloorMap, movePlayerToken, setPlayerPortrait, setTileObject, updateBoardVisibility, initMapControls, centerCameraOnPlayer, centerCameraOnCell, enableTileClick, disableTileClick, showPathPreview, clearPathPreview, findShortestPath } from '../mapEngine.js';
import {
  initDungeonState, getDungeonState, setLogCallback, setUpdateCallback,
  executeClickMove, incrementTurn, handleMoveStepEnd, enterCurrentFloor, moveToNextFloor,
  handleTileInteraction, getSanityStatus, loadDungeonState, reduceSanity,
  tickStatusEffects, triggerUpdate, updateVisibility, revealTile, hasStatusEffect
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
import { sendToMailbox, addItemToStorage, getState, clearActiveDungeon, updateDungeonStatus, progressTownLevel } from '../gameState.js';
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
    
    renderScene(container, map, wanderer, ds, resume, prepInv, prepSafeBag);
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
  }
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
          <div class="board-viewport" id="boardViewport">
            <div class="board-container" id="boardContainer"></div>
            <button id="btnCenterPlayer" class="btn-center-player" title="내 위치로 이동">🎯</button>
          </div>
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

  // Initialize camera controls BEFORE calculating player token offset
  initMapControls('boardViewport', 'boardContainer', 'btnCenterPlayer', floorMap);

  requestAnimationFrame(() => {
    movePlayerToken(ds.playerPosition, false);

    // Center the camera slightly after ensuring the token has moved
    setTimeout(centerCameraOnPlayer, 60);

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
        if (!resume) await showFloorTitle(floorNum);
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
    p.textContent = `> ${msg}`;
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
  refreshCurrencyDisplay();
}

async function showFloorTitle(floorNum) {
  const container = document.querySelector('.dungeon-scene');
  if (!container) return;

  playSFX('waveStart');

  const titleHtml = `
    <div class="wave-title-overlay" id="waveTitleOverlay">
        <h1 class="wave-text glitch" data-text="${floorNum} F">${floorNum} F</h1>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', titleHtml);
  await delay(1500);
  const el = document.getElementById('waveTitleOverlay');
  if (el) el.remove();
}

function showDicePopup(val, penalty = 0, isPenalized = false) {
  // Kept for backward compatibility or potential future UI effects
}

// ─── Game Flow ───
function showMoveUI() {
  const ds = getDungeonState();
  const floorMap = ds.dungeonMap.floors[ds.currentFloorIndex];
  const actionEl = document.getElementById('actionContent');
  if (!actionEl) return;
  
  actionEl.innerHTML = `
  <div class="move-phase fade-in">
    <p>${t('dungeon_ui.click_to_move', '이동할 타일을 클릭하세요.')}</p>
    <div id="pathPreviewInfo" class="path-preview-info">
      ${t('dungeon_ui.hover_path_info', '타일에 마우스를 올려 경로를 확인하세요.')}
    </div>
  </div>
  `;

  enableTileClick(floorMap, ds.playerPosition, handleTileClick, handleTileHover);
}

function handleTileHover(path, targetCellIndex) {
    const infoEl = document.getElementById('pathPreviewInfo');
    if (!infoEl) return;

    if (!path || path.length === 0) {
        infoEl.innerHTML = t('dungeon_ui.hover_path_info', '타일에 마우스를 올려 경로를 확인하세요.');
        clearPathPreview();
        return;
    }

    const ds = getDungeonState();
    
    showPathPreview(path);
    
    const moveInfo = executeClickMove(targetCellIndex);
    const totalCost = moveInfo.sanityCostPerTile * path.length;
    
    // We do NOT check for hidden tiles during hover to prevent spoiling players
    // The player will just see the full path cost and distance, but will stop mid-way if they hit a '?'
    let html = `이동 거리: <b>${path.length}</b>칸 | <span style="color:var(--sanity-color)">예상 정신력 소모: <b>${totalCost}</b></span>`;
    infoEl.innerHTML = html;
}

async function handleTileClick(targetCellIndex) {
  const ds = getDungeonState();
  const floorMap = ds.dungeonMap.floors[ds.currentFloorIndex];
  
  disableTileClick();
  playSFX('click');

  const path = findShortestPath(floorMap, ds.playerPosition, targetCellIndex);
  if (!path || path.length === 0) {
      showMoveUI();
      return;
  }

  const moveInfo = executeClickMove(targetCellIndex);
  incrementTurn(); 

  refreshTopbar(ds);
  refreshHUD(ds);

  await executeMovementSteps(path, moveInfo.sanityCostPerTile);
}

async function executeMovementSteps(path, sanityCostPerTile) {
  const ds = getDungeonState();
  const floorMap = ds.dungeonMap.floors[ds.currentFloorIndex];
  
  let stoppedEarly = false;

  for (let i = 0; i < path.length; i++) {
    const nextPos = path[i];
    const cell = floorMap.cells.find(c => c.index === nextPos);

    // Apply per-tile logic BEFORE moving into it
    if (!hasStatusEffect('torch_buff')) {
        const reduced = reduceSanity(sanityCostPerTile);
    }
    tickStatusEffects();
    
    if (ds.currentHp <= 0) {
        showGameOver();
        return;
    }

    // Move token
    movePlayerToken(nextPos, true);
    handleMoveStepEnd(nextPos);
    centerCameraOnCell(nextPos);

    if (ds.currentHp < ds.maxHp && ds.sanity > 0) {
        const SETTINGS = (await import('../data/settings.js')).SETTINGS;
        ds.currentHp = Math.min(ds.maxHp, ds.currentHp + (SETTINGS.hpRegenPerTile || 1));
    }
    refreshHUD(ds);
    
    await delay(350);

    // Check if we hit a hidden/mystery tile. If so, stop immediately.
    if (cell && cell.hidden) {
        stoppedEarly = true;
        // The tile interaction resolution will handle revealing it
        break;
    }
    
    // Also stop if it's the exit/boss
    if (cell && cell.isEnd) {
        stoppedEarly = true;
        break;
    }
  }

  // End of movement
  await resolveTileInteraction();
}

async function resolveTileInteraction() {
  const ds = getDungeonState();
  
  // Reveal current tile if it was hidden
  const floorMap = ds.dungeonMap.floors[ds.currentFloorIndex];
  const cell = floorMap.cells.find(c => c.index === ds.playerPosition);
  if (cell && cell.hidden) {
      revealTile(ds.playerPosition);
      import('../mapEngine.js').then(({ revealTileObject }) => {
          revealTileObject(ds.playerPosition, cell.object);
      });
  }

  const interaction = handleTileInteraction();

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
      
      // Wait for DOM to paint so movePlayerToken can calculate cell offset
      setTimeout(() => {
          movePlayerToken(ds.playerPosition, false);
          centerCameraOnPlayer();
      }, 100);
      
      await showFloorTitle(floorMap.floor);
      showMoveUI();
      return;
  }

  if (interaction.type === 'monster') {
    const monsterId = interaction.data?.monsterId;
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
      if (outcomes.length > 0) {
          const total = outcomes.reduce((a, o) => a + o.weight, 0);
          let r = Math.random() * total;
          let picked = outcomes[outcomes.length - 1];
          for (const o of outcomes) { r -= o.weight; if (r <= 0) { picked = o; break; } }
          const died = applyOutcome(picked, addLog, refreshHUD, refreshInlineInventory);
          updateDungeonStatus(ds);
          if (died) { showGameOver(); return; }
      }
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

  showMoveUI();
}

async function launchRandomCombat() {
  const ds = getDungeonState();
  const pool = [1001, 2001, 3001, 4001, 9001];
  const monsterId = pool[Math.floor(Math.random() * pool.length)];
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
  const ds = getDungeonState();
  const wId = ds.wanderer.id;
  import('../gameState.js').then(module => {
      module.handleWandererDeath(wId);
      module.clearActiveDungeon();
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
          gw.curHp = ds.currentHp;
          gw.curSanity = ds.sanity;
      }
      inv.safeBag.forEach(it => module.addItemToStorage(it));
      progressTownLevel(ds.mapData.mapLv);
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

function renderHUD(ds) {
  const w = ds.wanderer;
  if (!w) return `<p>${t('dungeon_ui.no_info')}</p>`;
  
  // Create an explicit wrapper matching the original structure so existing CSS fits.
  let html = `
    <div class="hud-header">
      <div class="hud-portrait">${w.portrait}</div>
      <div class="hud-name">${w.nameKey ? t(w.nameKey) : w.name}</div>
      <div class="hud-class">${w.classKey ? t(w.classKey) : w.className || '방랑자'}</div>
    </div>
  `;

  const hpPercent = Math.max(0, Math.min(100, (ds.currentHp / ds.maxHp) * 100));
  const sanityPercent = Math.max(0, Math.min(100, (ds.sanity / ds.maxSanity) * 100));
  const expPercent = Math.max(0, Math.min(100, (ds.exp / ds.expToNext) * 100));

  html += `
    <div class="hud-bar-group">
      <label class="hud-bar-label">${t('dungeon_ui.hp')}</label>
      <div class="hud-bar hp-bar"><div class="hud-bar-fill" style="width:${hpPercent}%"></div><span class="hud-bar-text">${ds.currentHp}/${ds.maxHp}</span></div>
    </div>
    <div class="hud-bar-group">
      <label class="hud-bar-label">${t('dungeon_ui.sanity')}</label>
      <div class="hud-bar sanity-bar"><div class="hud-bar-fill" style="width:${sanityPercent}%"></div><span class="hud-bar-text">${ds.sanity}/${ds.maxSanity}</span></div>
    </div>
    <div class="hud-bar-group">
      <label class="hud-bar-label">${t('dungeon_ui.exp', '경험치')}</label>
      <div class="hud-bar exp-bar"><div class="hud-bar-fill" style="width:${expPercent}%"></div><span class="hud-bar-text">${ds.exp}/${ds.expToNext}</span></div>
    </div>
  `;

  if (ds.statusEffects && ds.statusEffects.length > 0) {
    html += `<div class="hud-status-effects">` + ds.statusEffects.map(e => {
        const durText = e.duration === Infinity ? '∞' : `${e.duration}`;
        const labelText = e.labelKey ? t(e.labelKey, e.id) : (e.label || e.id);
        return `<span class="status-badge" title="${labelText} (${durText}칸)">${e.icon || '⚠️'} ${durText}</span>`;
    }).join('') + `</div>`;
  }

  html += `
    <div class="hud-info-row" style="margin-top:8px;">
      <span class="hud-info-item">📍 ${t('dungeon_ui.floor', '층')} ${ds.dungeonMap?.floors[ds.currentFloorIndex]?.floor || 1}</span>
      <span class="hud-info-item">🆙 Lv.${ds.level} ${ds.freeStatPoints > 0 ? `<button id="btnOpenStats" class="btn-levelup-trigger pulse">스탯 배분</button>` : ''}</span>
    </div>
  `;

  return html;
}

function refreshHUD(ds) {
  const hudEl = document.getElementById('hudPanel');
  if (!hudEl) return;
  hudEl.innerHTML = `<h3>${t('dungeon_ui.player_info')}</h3>` + renderHUD(ds);
}

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

setUpdateCallback((newState) => {
  const ds = newState;
  const container = document.getElementById('app'); // Fallback if needed, though state pushes update
  if (ds) {
    refreshTopbar(ds);
    refreshHUD(ds);
    updateSanityVFX(ds);
    const floorMap = ds.dungeonMap.floors[ds.currentFloorIndex];
    if (floorMap && floorMap.cells) {
      updateBoardVisibility(floorMap.cells);
    }
  }
});
