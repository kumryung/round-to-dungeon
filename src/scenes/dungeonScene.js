// ─── Dungeon Scene (던전씬) — Phase 3: Game Loop ───
import { changeScene } from '../sceneManager.js';
import { generateTiles, renderBoard, movePlayerToken, setPlayerPortrait } from '../mapEngine.js';
import {
  initDungeonState, getDungeonState, setLogCallback, setUpdateCallback,
  rollSpawnDice, getSpawnPlacements, commitSpawn,
  executeMovePhase, animateMovement,
  handleTileInteraction, advanceWave, getSanityStatus,
} from '../dungeonState.js';
import { getMonster } from '../data/monsters.js';
import { initCombat } from '../combatEngine.js';
import { showCombat } from '../combatOverlay.js';
import { initInventory, getInventory, addItem } from '../inventory.js';
import { buildInlineInventoryHTML, refreshInlineInventory, showItemToast } from '../inventoryOverlay.js';
import { rollChestLoot, rollEvent, rollMonsterLoot, ITEMS } from '../data/items.js';
import { openCraftingOverlay } from '../craftingOverlay.js';


let boardRendered = false;
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export function mount(container, params = {}) {
  const { map, wanderer } = params;
  boardRendered = false;

  // Generate tiles
  const sideLength = 5 + (map?.mapLv || 1);
  const tiles = generateTiles(map);

  // Init dungeon state
  const ds = initDungeonState(tiles, map, wanderer);

  container.innerHTML = `
    <div class="dungeon-scene">
      <!-- Top bar -->
      <div class="dungeon-topbar">
        <button class="btn-return" id="btnReturn">← 마을로 귀환</button>
        <div class="dungeon-topbar-info">
          <span class="topbar-map">${map?.icon || '🗺️'} ${map?.name || '던전'}</span>
          <span class="topbar-sep">|</span>
          <span class="topbar-wave" id="topWave">Wave ${ds.wave}</span>
          <span class="topbar-sep">|</span>
          <span class="topbar-turn" id="topTurn">Turn ${ds.turn}</span>
        </div>
        <div class="topbar-actions">
          <button class="btn-craft" id="btnCraft">⚒️ 제작</button>
          <div class="topbar-wanderer">
            <span>${wanderer?.portrait || ''}</span>
            <span>${wanderer?.name || ''}</span>
          </div>
        </div>
      </div>

      <!-- 3-column layout -->
      <div class="dungeon-body">
        <!-- Left: Player Info Panel -->
        <aside class="dungeon-left">
          <div class="panel hud-panel" id="hudPanel">
            <h3>👤 플레이어</h3>
            ${wanderer ? renderHUD(ds) : '<p>정보 없음</p>'}
          </div>
        </aside>

        <!-- Center: Game Board -->
        <section class="dungeon-center">
          <div class="board-container" id="boardContainer"></div>
        </section>

        <!-- Right: Log & Action -->
        <aside class="dungeon-right">
          <div class="panel log-panel">
            <h3>📜 로그</h3>
            <div class="log-content" id="logContent"></div>
          </div>
          <div class="panel action-panel" id="actionPanel">
            <h3>🎯 액션</h3>
            <div id="actionContent"></div>
          </div>
        </aside>

        <!-- Center Bottom: Inline inventory panel -->
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
  initInventory(wanderer);

  // Return button
  document.getElementById('btnReturn').addEventListener('click', () => {
    changeScene('town');
  });

  // Crafting button
  document.getElementById('btnCraft').addEventListener('click', () => {
    openCraftingOverlay();
  });

  // Render the board
  const boardContainer = document.getElementById('boardContainer');
  renderBoard(tiles, sideLength, boardContainer);
  boardRendered = true;

  // Set player portrait & initial position
  if (wanderer) setPlayerPortrait(wanderer.portrait);

  // Need a tiny delay for DOM to settle before positioning
  requestAnimationFrame(() => {
    movePlayerToken(0, sideLength, false);
    addLog(`${wanderer?.name || '방랑자'}이(가) ${map?.name || '던전'}에 입장했습니다.`);
    addLog(`Wave ${ds.wave} 시작!`);

    // Initial inventory render
    refreshInlineInventory();

    // Expose refreshHUD globally for inventory popup cross-module use
    window.__refreshHUD = () => refreshHUD(getDungeonState());

    // Start spawn phase with Wave Title
    (async () => {
      await showWaveTitle(ds.wave);
      startSpawnPhase();
    })();
  });
}

export function unmount() {
  boardRendered = false;
}

// ─── Game Flow ───

const SPAWN_LABELS = { monster: '💀 몬스터', chest: '📦 보물상자', event: '❓ 이벤트' };

/**
 * Auto-run spawn phase with sequential animation.
 * Shows dice results first, then places each object one-by-one.
 */
async function startSpawnPhase() {
  const ds = getDungeonState();
  const actionEl = document.getElementById('actionContent');
  if (!actionEl) return;

  // Step 1: Roll dice
  const rolls = rollSpawnDice();
  addLog(`🎲 스폰 주사위  — 몬스터: ${rolls.monsterRoll} | 보물: ${rolls.treasureRoll} | 이벤트: ${rolls.eventRoll}`);

  // Show dice results in action panel
  actionEl.innerHTML = `
    <div class="spawn-result fade-in">
      <p class="action-label">🎲 스폰 단계</p>
      <div class="dice-results">
        <div class="dice-item dice-roll-anim" style="animation-delay:0s"><span class="dice-icon">💀</span><span class="dice-val">${rolls.monsterRoll}</span><span class="dice-label">몬스터</span></div>
        <div class="dice-item dice-roll-anim" style="animation-delay:0.15s"><span class="dice-icon">📦</span><span class="dice-val">${rolls.treasureRoll}</span><span class="dice-label">보물</span></div>
        <div class="dice-item dice-roll-anim" style="animation-delay:0.3s"><span class="dice-icon">❓</span><span class="dice-val">${rolls.eventRoll}</span><span class="dice-label">이벤트</span></div>
      </div>
      <div class="spawn-progress" id="spawnProgress"></div>
    </div>
  `;

  // Step 2: Generate placements
  const placements = getSpawnPlacements(rolls);

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
      tileEl.classList.add('tile-spawn-pop');
      setTimeout(() => tileEl.classList.remove('tile-spawn-pop'), 600);
    }

    // Log & progress
    addLog(`  ↳ ${SPAWN_LABELS[p.type]} → 타일 ${p.tileIndex}`);
    if (progressEl) {
      progressEl.textContent = `배치 중... (${i + 1}/${placements.length})`;
    }

    await delay(350);
  }

  if (progressEl) {
    progressEl.textContent = `✅ ${placements.length}개 오브젝트 배치 완료`;
  }

  // Step 4: Transition to move phase
  ds.phase = 'move';
  await delay(400);
  showMoveUI();
}

function showMoveUI() {
  const actionEl = document.getElementById('actionContent');
  if (!actionEl) return;

  actionEl.innerHTML = `
    <div class="move-phase fade-in">
      <button class="btn-action btn-roll-move" id="btnRollMove">🎲 ROLL MOVE</button>
    </div>
  `;

  document.getElementById('btnRollMove').addEventListener('click', handleRollMove);
}

async function handleRollMove() {
  const ds = getDungeonState();

  // Disable the button
  const btn = document.getElementById('btnRollMove');
  if (btn) btn.disabled = true;

  // Roll and calculate path
  const result = executeMovePhase();

  // Update topbar
  refreshTopbar(ds);
  refreshHUD(ds);

  // Show dice result
  showDicePopup(result.roll);

  // Animate movement along path
  await animateMovement(result.path, ds.sideLength);

  // Handle tile interaction
  const interaction = handleTileInteraction();

  // Handle wave advancement if at start
  if (result.finalPosition === 0 && ds.turn > 0) {
    addLog(`🏠 시작점에 도착!`);

    addLog(`🏠 시작점에 도착! 다음 웨이브로 자동 진행합니다.`);

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
      addLog(`⚠️ 알 수 없는 몬스터: ${monsterId}`);
      showMoveUI();
      return;
    }

    // Fear monsters: sanity -5
    if (monsterInstance.fear) {
      ds.sanity = Math.max(0, ds.sanity - 5);
      addLog(`😱 공포! 정신력 -5 (${monsterInstance.name})`);
      refreshHUD(ds);
    }

    const actionEl = document.getElementById('actionContent');
    if (actionEl) {
      actionEl.innerHTML = `
        <div class="encounter fade-in">
          <p class="action-label">${monsterInstance.emoji} 전투 중!</p>
          <p class="action-desc">${monsterInstance.name} Lv.${monsterLevel}</p>
        </div>
      `;
    }

    // Init & show combat
    initCombat(ds.wanderer, monsterInstance);
    await showCombat(monsterInstance, {
      onVictory: () => {
        // Clear monster from tile
        const tile = ds.tiles[ds.playerPosition];
        tile.object = null;
        tile.objectData = null;
        setTileObject(tile.index, null);
        addLog(`🏆 ${monsterInstance.name} 처치!`);
        refreshHUD(getDungeonState());
        // Drop loot
        const loot = rollMonsterLoot(monsterInstance);
        if (loot) {
          const added = addItem(loot);
          if (added) {
            // Delay log slightly
            setTimeout(() => {
              const logEl = document.getElementById('logContent');
              if (logEl) {
                const entry = document.createElement('p');
                entry.className = 'log-entry log-new';
                entry.textContent = `> 💎 획득: ${loot.emoji} ${loot.name}`;
                logEl.appendChild(entry);
                logEl.scrollTop = logEl.scrollHeight;
              }
            }, 150);
            showItemToast(loot);
          } else {
            addLog(`💎 가방이 가득 찼습니다.`);
          }
        }

        refreshHUD(getDungeonState());
        refreshInlineInventory();
        showMoveUI();
      },
      onDefeat: () => {
        addLog(`💀 사망...`);
        showGameOver();
      },
      onFlee: () => {
        addLog(`🏃 ${monsterInstance.name}에게서 도망쳤다!`);
        refreshHUD(getDungeonState());
        refreshInlineInventory();
        showMoveUI();
      },
    });
    return;
  }

  // Chest tile: roll loot
  if (interaction.type === 'chest') {
    const loot = rollChestLoot();
    const added = addItem(loot);
    if (added) {
      addLog(`📦 보물상자: ${loot.emoji} ${loot.name} 획득!`);
      showItemToast(loot);
    } else {
      addLog(`📦 보물상자: 인벤토리가 가득 찼습니다!`);
    }
    refreshHUD(ds);
    refreshInlineInventory();
    await delay(800);
    showMoveUI();
    return;
  }

  // Event tile: roll random event
  if (interaction.type === 'event') {
    const evt = rollEvent();
    addLog(`${evt.emoji} ${evt.name}: ${evt.desc}`);

    if (evt.effect === 'heal') {
      ds.currentHp = Math.min(ds.maxHp, ds.currentHp + evt.value);
    } else if (evt.effect === 'sanity_restore') {
      ds.sanity = Math.min(ds.maxSanity, ds.sanity + evt.value);
    } else if (evt.effect === 'trap') {
      ds.currentHp = Math.max(0, ds.currentHp - evt.hpDmg);
      ds.sanity = Math.max(0, ds.sanity - evt.sanityDmg);
    } else if (evt.effect === 'sanity_drain') {
      ds.sanity = Math.max(0, ds.sanity - evt.value);
    } else if (evt.effect === 'random_item') {
      const loot = rollChestLoot();
      const added = addItem(loot);
      if (added) {
        addLog(`  ↳ ${loot.emoji} ${loot.name} 획득!`);
        showItemToast(loot);
      }
    } else if (evt.effect === 'rest') {
      ds.currentHp = Math.min(ds.maxHp, ds.currentHp + evt.hpVal);
      ds.sanity = Math.min(ds.maxSanity, ds.sanity + evt.sanityVal);
    }

    refreshHUD(ds);
    refreshInlineInventory();
    updateSanityVFX(ds);

    if (ds.currentHp <= 0) {
      addLog(`💀 함정으로 사망...`);
      showGameOver();
      return;
    }

    await delay(800);
    showMoveUI();
    return;
  }

  // Otherwise, enable next move
  showMoveUI();
}

function showGameOver() {
  const actionEl = document.getElementById('actionContent');
  if (actionEl) {
    actionEl.innerHTML = `
      <div class="game-over fade-in">
        <p class="action-label">💀 Game Over</p>
        <p class="action-desc">방랑자가 쓰러졌습니다...</p>
        <button class="btn-action btn-return-town" id="btnGameOverReturn">마을로 돌아가기</button>
      </div>
    `;
    document.getElementById('btnGameOverReturn').addEventListener('click', () => {
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

function showDicePopup(value) {
  const board = document.getElementById('boardContainer');
  if (!board) return;
  const popup = document.createElement('div');
  popup.className = 'dice-popup';
  popup.textContent = value;
  board.appendChild(popup);
  setTimeout(() => popup.remove(), 1200);
}

function refreshTopbar(ds) {
  const waveEl = document.getElementById('topWave');
  const turnEl = document.getElementById('topTurn');
  if (waveEl) waveEl.textContent = `Wave ${ds.wave}`;
  if (turnEl) turnEl.textContent = `Turn ${ds.turn}`;
}

async function showWaveTitle(wave) {
  const container = document.querySelector('.dungeon-scene');
  if (!container) return;

  const overlay = document.createElement('div');
  overlay.className = 'wave-title-overlay';
  overlay.innerHTML = `<div class="wave-title-text">WAVE ${wave}</div>`;
  container.appendChild(overlay);

  // Wait for animation (Reduced to ~1.3s total)
  await delay(1300);
  overlay.remove();
}

function refreshHUD(ds) {
  const hudEl = document.getElementById('hudPanel');
  if (!hudEl) return;
  hudEl.innerHTML = `<h3>👤 플레이어</h3>` + renderHUD(ds);
}

function renderHUD(ds) {
  const w = ds.wanderer;
  if (!w) return '<p>정보 없음</p>';

  const hpPercent = Math.round((ds.currentHp / ds.maxHp) * 100);
  const sanityPercent = Math.round((ds.sanity / ds.maxSanity) * 100);
  const sanityState = getSanityStatus(ds.sanity);

  return `
    <div class="hud-portrait">${w.portrait}</div>
    <div class="hud-name">${w.name}</div>
    <div class="hud-class">${w.classIcon} ${w.className}</div>

    <div class="hud-bar-group">
      <label class="hud-bar-label">❤️ HP</label>
      <div class="hud-bar hp-bar"><div class="hud-bar-fill" style="width:${hpPercent}%"></div><span class="hud-bar-text">${ds.currentHp}/${ds.maxHp}</span></div>
    </div>
    <div class="hud-bar-group">
      <label class="hud-bar-label">🔮 Sanity</label>
      <div class="hud-bar sanity-bar ${sanityState.class}"><div class="hud-bar-fill" style="width:${sanityPercent}%"></div><span class="hud-bar-text">${ds.sanity}/${ds.maxSanity} (${sanityState.label})</span></div>
    </div>



    <div class="hud-info-row">
      <span class="hud-info-item">📍 Tile ${ds.playerPosition}</span>
      <span class="hud-info-item">🌊 Wave ${ds.wave}</span>
    </div>

    <div class="hud-stats">
      <div class="hud-stat"><span class="hud-stat-key">STR</span><span class="hud-stat-val">${w.str}</span></div>
      <div class="hud-stat"><span class="hud-stat-key">AGI</span><span class="hud-stat-val">${w.agi}</span></div>
      <div class="hud-stat"><span class="hud-stat-key">SPD</span><span class="hud-stat-val">${w.spd}</span></div>
      <div class="hud-stat"><span class="hud-stat-key">DEX</span><span class="hud-stat-val">${w.dex}</span></div>
      <div class="hud-stat"><span class="hud-stat-key">LUK</span><span class="hud-stat-val">${w.luk}</span></div>
    </div>

    <div class="hud-traits">
      ${w.traits.map((t) => `<span class="trait-badge ${t.type}" title="${t.desc}">${t.name}</span>`).join('')}
    </div>
  `;
}

// Re-export setTileObject for wave clear
import { setTileObject } from '../mapEngine.js';

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
