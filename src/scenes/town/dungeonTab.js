import { t } from '../../i18n.js';
import { getState, generateAvailableDungeons, selectMap, selectWanderer, refreshDungeonList } from '../../gameState.js';
import { MAPS } from '../../data/maps.js';
import { SETTINGS } from '../../data/settings.js';
import { getLocName, getLocDesc } from '../../utils/i18nUtils.js';
import { buildItemTooltipHTML } from '../../utils/itemCardUtils.js';
import { showConfirmModal, showToast } from './townUtils.js';
import { changeScene } from '../../sceneManager.js';

export function renderDungeon(el) {
  const state = getState();

  if (!state.availableDungeons || state.availableDungeons.length === 0) {
    generateAvailableDungeons();
  }

  const dungeonsToShow = state.availableDungeons || [];
  const activeMapId = state.activeDungeon ? state.activeDungeon.mapData.id : null;

  // Auto-select active dungeon if nothing selected
  if (activeMapId && (!state.selectedMap || state.selectedMap.id !== activeMapId)) {
    selectMap(dungeonsToShow.find(m => m.id === activeMapId));
  }

  // Prevent wanderer selection UI from opening for cleared/failed maps
  let isSelectedMapLocked = false;
  if (state.selectedMap && !activeMapId) {
    const sStatus = state.dungeonStatuses ? state.dungeonStatuses[state.selectedMap.id] : null;
    if (sStatus === 'cleared' || sStatus === 'failed') {
      isSelectedMapLocked = true;
      selectMap(null); // automatically deselect
    }
  }

  const showWandererSelect = state.selectedMap && !activeMapId && !isSelectedMapLocked;

  function getActionBarHTML() {
    if (activeMapId && state.selectedMap?.id === activeMapId) {
      return `
        <button class="btn-town-secondary" id="btnCancelDungeon" style="color:var(--danger-color); border-color:var(--danger-color);">포기</button>
        <button class="btn-town-primary" id="btnResumeDungeon">⚔️ ${t('ui.dungeon.resume_dungeon', '이어하기')}</button>
      `;
    } else if (!activeMapId && state.selectedMap && state.selectedWanderer) {
      return `<button class="btn-enter-dungeon" id="btnNextPrep">➡️ ${t('ui.dungeon.next', '다음 (Next)')}</button>`;
    } else {
      return `<div class="dungeon-action-placeholder">${t('ui.dungeon.placeholder')}</div>`;
    }
  }

  el.innerHTML = `
    <div class="tab-panel dungeon-panel fade-in">
      <div class="dungeon-header" style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <p class="dungeon-desc" style="color:var(--text-dim);">${t('ui.dungeon.desc', '마을 밖 위험한 던전을 탐험합니다.')}</p>
        </div>
        <button class="btn-town-secondary" id="btnRefreshDungeonList" title="${t('ui.dungeon.refresh_list', '던전 목록 갱신')}" style="padding: 6px 12px; font-size: 0.9rem;">
          🔄 ${t('ui.dungeon.refresh_list', '던전 목록 갱신')}
        </button>
      </div>

      <div class="dungeon-scroll-area">
          <div class="dungeon-cards-container" style="display: flex; gap: 20px; margin-bottom: 20px;">
            ${dungeonsToShow.map((m) => {
    const isActive = activeMapId === m.id;
    const mStatus = state.dungeonStatuses ? state.dungeonStatuses[m.id] : null;
    const isCleared = mStatus === 'cleared';
    const isFailed = mStatus === 'failed';
    const isLocked = (activeMapId && !isActive) || isCleared || isFailed;
    const isSelected = state.selectedMap?.id === m.id;

    return `
              <div class="dungeon-card-large ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''}" data-map="${m.id}" style="flex: 1; border: 2px solid ${isSelected ? 'var(--gold)' : 'var(--border)'}; border-radius: 8px; padding: 15px; cursor: pointer; background: var(--bg-surface); transition: all 0.2s; position: relative; ${isLocked ? 'opacity: 0.5; filter: grayscale(1); pointer-events: none;' : ''}">
                <div style="text-align: center; margin-bottom: 10px;">
                  <div style="font-size: 2.5rem; margin-bottom: 5px;">${m.icon}</div>
                  <h3 style="margin: 0; color: ${isSelected ? 'var(--gold)' : 'var(--text)'}; font-size: 1.1rem;">${isActive ? '🔄 ' : ''}${m.nameKey ? t(m.nameKey) : m.name}</h3>
                  <div style="color: var(--text-dim); font-size: 0.8rem; margin-top: 4px;">Lv.${m.mapLv} · ${t('ui.dungeon.tiles_count', { n: m.tiles })}</div>
                  ${isActive ? `<div style="color:var(--gold); font-size:0.85em; margin-top:4px; font-weight: bold;">진행 중</div>` : ''}
                  ${isCleared ? `<div style="position:absolute; top:10px; right:10px; background:var(--green); color:white; padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:bold;">${t('ui.dungeon.status_cleared', 'Cleared')}</div>` : ''}
                  ${isFailed ? `<div style="position:absolute; top:10px; right:10px; background:var(--red); color:white; padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:bold;">${t('ui.dungeon.status_failed', 'Failed')}</div>` : ''}
                </div>
                
                <p style="color: var(--text-dim); font-size: 0.85rem; text-align: center; margin-bottom: 15px; margin-top: 5px;">
                  ${m.descKey ? t(m.descKey) : m.desc}
                </p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 0.8rem; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 6px;">
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color:var(--text-dim);">구조</span>
                    <span>다층 타일 맵 (${m.floors ? m.floors.length : 1}층)</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color:var(--text-dim);">환경</span>
                    <span>${m.theme}</span>
                  </div>
                </div>
              </div>
              `;
  }).join('')}
          </div>

          <!-- Wanderer selection -->
          ${showWandererSelect ? renderWandererSelect(state) : ''}
      </div>

      <!-- Enter dungeon (Fixed Footer) -->
      <div class="dungeon-action-bar">
          ${getActionBarHTML()}
      </div>
    </div>
  `;

  // Dungeon card click
  el.querySelectorAll('.dungeon-card-large').forEach((card) => {
    card.addEventListener('click', () => {
      if (card.classList.contains('locked')) return; // 클리어/실패된 던전 클릭 방지
      const map = MAPS.find((m) => m.id === card.dataset.map);
      selectMap(map);
      renderDungeon(el);
    });
  });

  // Refresh Dungeon List button
  const btnRefreshList = el.querySelector('#btnRefreshDungeonList');
  if (btnRefreshList) {
    btnRefreshList.addEventListener('click', () => {
      showConfirmModal(
        t('ui.dungeon.refresh_list', '던전 목록 갱신'),
        t('ui.dungeon.refresh_confirm', '모든 던전 목록을 갱신하시겠습니까? (이미 클리어하거나 실패한 던전 포함)'),
        () => {
          refreshDungeonList();
          renderDungeon(el);
          showToast(t('ui_messages.dungeon_list_refreshed', '던전 목록이 갱신되었습니다.'));
        }
      );
    });
  }

  // Wanderer select
  if (showWandererSelect) {
    el.querySelectorAll('.wanderer-option').forEach((opt) => {
      opt.addEventListener('click', () => {
        const w = state.recruitedWanderers.find((c) => c.id === opt.dataset.id);
        selectWanderer(w);
        renderDungeon(el);
      });
    });
  }

  // Next / Resume button
  const resumeBtn = el.querySelector('#btnResumeDungeon');
  if (resumeBtn) {
    resumeBtn.addEventListener('click', () => {
      changeScene('dungeon', { resume: true });
    });
  }

  const cancelBtn = el.querySelector('#btnCancelDungeon');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      showConfirmModal(
        t('ui.dungeon.cancel_title', '탐험 포기'),
        t('ui.dungeon.cancel_confirm', '현재 진행 중인 탐험을 포기하시겠습니까? (획득한 아이템을 잃고 페널티를 받을 수 있습니다)'),
        () => {
          import('../../gameState.js').then(({ clearActiveDungeon }) => {
            clearActiveDungeon();
            renderDungeon(el);
            showToast("탐험을 포기하고 마을로 귀환했습니다.");
          });
        }
      );
    });
  }

  const nextBtn = el.querySelector('#btnNextPrep');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      renderDungeonPrep(el, state.selectedMap, state.selectedWanderer);
    });
  }
}

export function renderDungeonInfo(map) {
  return `
    <div class="dungeon-info-card fade-in">
      <div class="dungeon-info-header">
        <span class="dungeon-info-icon">${map.icon}</span>
        <h3>${map.nameKey ? t(map.nameKey) : map.name}</h3>
        <span class="dungeon-info-en">${map.nameEn}</span>
      </div>
      <p class="dungeon-info-desc">${map.descKey ? t(map.descKey) : map.desc}</p>
      <div class="dungeon-info-stats">
        <div class="info-stat"><span class="info-stat-label">${t('ui.dungeon.info_level')}</span><span class="info-stat-value">Lv.${map.mapLv}</span></div>
        <div class="info-stat"><span class="info-stat-label">층 수</span><span class="info-stat-value">${map.floors ? map.floors.length : 1} 층</span></div>
        <div class="info-stat"><span class="info-stat-label">환경</span><span class="info-stat-value">${map.theme}</span></div>
      </div>
    </div>
  `;
}

export function renderWandererSelect(state) {
  const aliveWanderers = state.recruitedWanderers.filter(w => w.status !== 'dead' && w.status !== 'resting');
  if (aliveWanderers.length === 0) {
    return `<div class="wanderer-select"><p class="placeholder-text">${t('ui_messages.recruit_first')}</p></div>`;
  }
  return `
    <div class="wanderer-select fade-in">
      <h3>🧑 ${t('ui.dungeon.select_wanderer_title')}</h3>
      <div class="wanderer-options">
        ${aliveWanderers.map((w) => `
          <div class="wanderer-option ${state.selectedWanderer?.id === w.id ? 'selected' : ''}" data-id="${w.id}">
            <span class="wanderer-portrait">${w.portrait}</span>
            <span class="wanderer-name">${w.nameKey ? t(w.nameKey) : w.name}</span>
            <span class="wanderer-class">${w.classIcon}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function renderDungeonPrep(el, map, wanderer) {
  const state = getState();

  // Create temporary copies for prep
  let prepStorage = [...state.storage].map(s => s ? { ...s } : null);
  let prepInv = new Array(SETTINGS.inventorySlots).fill(null);
  let prepSafeBag = new Array(SETTINGS.safeBagSlots).fill(null);

  // Initial UI layout (runs once)
  el.innerHTML = `
    <div class="tab-panel dungeon-prep-panel fade-in" style="display:flex; flex-direction:column; height:100%;">
      <div class="prep-header" style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 20px;">
        <div class="prep-title-group">
          <h2>🎒 ${t('ui.dungeon.prep', '탐험 준비')} (<span style="color:var(--gold);">${wanderer.nameKey ? t(wanderer.nameKey) : wanderer.name}</span> ▶️ ${map.nameKey ? t(map.nameKey) : map.name})</h2>
          <p style="color:var(--text-dim); margin-top:5px;">${t('ui.dungeon.prep_desc', '가져갈 아이템을 드래그하여 배치하세요.')}</p>
        </div>
      </div>

      <div class="prep-sections" style="flex:1; display:flex; flex-direction:column; gap:20px; overflow-y:auto; padding-right:10px;">
        <div class="prep-section">
          <h3 style="margin-bottom:10px; color:var(--text-highlight);">📦 ${t('ui.storage.title', '창고')}</h3>
          <div class="storage-grid" id="prepStorageGrid"></div>
        </div>
        <div style="height: 1px; background: var(--border); margin: 5px 0;"></div>
        <div style="display: flex; gap: 20px;">
          <div class="prep-section" style="flex: 2;">
            <h3 style="margin-bottom:10px; color:var(--text-highlight);">🛡️ ${t('ui.inventory.title', '던전 인벤토리')}</h3>
            <div class="storage-grid" id="prepInvGrid"></div>
          </div>
          <div class="prep-section" style="flex: 1;">
            <h3 style="margin-bottom:10px; color:var(--gold);">👜 ${t('ui.inventory.safebag', '안전 가방')}</h3>
            <div class="storage-grid" id="prepSafeBagGrid"></div>
          </div>
        </div>
      </div>
      
      <div class="prep-actions" style="margin-top:20px; display:flex; justify-content:space-between;">
        <button class="btn-town-secondary" id="btnPrepBack">🔙 ${t('ui.dungeon.back', '뒤로가기')}</button>
        <button class="btn-town-primary" id="btnPrepEnter" style="padding:15px 30px; font-size:1.1rem;">⚔️ ${t('ui.dungeon.enter', '출발')}</button>
      </div>
    </div>
  `;

  // Global prevent default to stop page refresh
  const panel = el.querySelector('.dungeon-prep-panel');
  if (panel) {
    panel.addEventListener('dragover', e => e.preventDefault());
    panel.addEventListener('drop', e => e.preventDefault());
  }

  // Static event listeners
  el.querySelector('#btnPrepBack').addEventListener('click', () => {
    renderDungeon(el);
  });

  el.querySelector('#btnPrepEnter').addEventListener('click', () => {
    // Check for weapons (either equipped, or packed in inventory/safebag)
    const hasEquippedWeapon = wanderer.equipments?.weapon && wanderer.equipments.weapon.id !== 'w_fist';
    const hasWeapon = hasEquippedWeapon || [...prepInv, ...prepSafeBag].some(item => item && item.type === 'weapon');

    const proceed = () => {
      state.storage = prepStorage;
      import('../../gameState.js').then(({ saveState }) => {
        saveState();
        changeScene('dungeon', { map, wanderer, prepInv, prepSafeBag });
      });
    };

    if (!hasWeapon) {
      showConfirmModal(
        t('ui.dungeon.prep', '탐험 준비'),
        t('ui_messages.no_weapon_confirm', "방랑자가 무기를 가지고 있지 않습니다.\n이대로 진행하시겠습니까?"),
        proceed
      );
    } else {
      proceed();
    }
  });

  function renderGrid() {
    const makeSlotHTML = (slot, i, type, extraStyle = '') => `
      <div class="storage-slot ${slot ? `grade-${slot.grade}` : 'empty'} prep-slot" data-type="${type}" data-index="${i}" ${extraStyle}>
        ${slot ? `<span style="pointer-events:none;font-size:1.4em;">${slot.emoji}</span>${slot.qty > 1 ? `<span class="slot-qty" style="pointer-events:none;">${slot.qty}</span>` : ''}<div class="slot-tooltip" style="pointer-events:none;">${buildItemTooltipHTML(slot)}</div>` : ''}
      </div>
    `;

    el.querySelector('#prepStorageGrid').innerHTML = prepStorage.map((s, i) => makeSlotHTML(s, i, 'storage')).join('');
    el.querySelector('#prepInvGrid').innerHTML = prepInv.map((s, i) => makeSlotHTML(s, i, 'inv', 'style="background:rgba(30,20,20,0.8);"')).join('');
    el.querySelector('#prepSafeBagGrid').innerHTML = prepSafeBag.map((s, i) => makeSlotHTML(s, i, 'safebag', 'style="border-color:var(--gold);background:rgba(50,40,0,0.5);"')).join('');

    // Update draggable attributes on new slots (event listeners are bound once)
    el.querySelectorAll('.prep-slot').forEach(slot => {
      const arr = getTargetArr(slot.dataset.type);
      const hasItem = arr && arr[parseInt(slot.dataset.index)] !== null;
      slot.setAttribute('draggable', hasItem ? 'true' : 'false');
    });
  }

  let dragSrc = { type: null, index: -1 };

  function attachSlotDragEvents() {
    const gridIds = ['#prepStorageGrid', '#prepInvGrid', '#prepSafeBagGrid'];

    gridIds.forEach(gridId => {
      const grid = el.querySelector(gridId);
      if (!grid) return;

      grid.addEventListener('dragstart', (e) => {
        const slot = e.target.closest('.prep-slot');
        if (!slot) return;
        const type = slot.dataset.type;
        const idx = parseInt(slot.dataset.index);
        const arr = getTargetArr(type);
        if (!arr || !arr[idx]) { e.preventDefault(); return; }
        dragSrc = { type, index: idx };
        slot.style.opacity = '0.4';
      });

      grid.addEventListener('dragend', (e) => {
        const slot = e.target.closest('.prep-slot');
        if (slot) slot.style.opacity = '1';
        el.querySelectorAll('.prep-slot.drag-over').forEach(s => s.classList.remove('drag-over'));
      });

      grid.addEventListener('dragover', (e) => {
        e.preventDefault();
        const slot = e.target.closest('.prep-slot');
        if (slot) slot.classList.add('drag-over');
      });

      grid.addEventListener('dragleave', (e) => {
        const slot = e.target.closest('.prep-slot');
        if (slot) slot.classList.remove('drag-over');
      });

      grid.addEventListener('drop', (e) => {
        e.preventDefault();
        const slot = e.target.closest('.prep-slot');
        if (!slot) return;
        const toType = slot.dataset.type;
        const toIdx = parseInt(slot.dataset.index);
        slot.classList.remove('drag-over');
        if (dragSrc.type === null) return;
        if (dragSrc.type === toType && dragSrc.index === toIdx) return;
        handleDrop(dragSrc.type, dragSrc.index, toType, toIdx);
        dragSrc = { type: null, index: -1 };
      });
    });
  }

  function getTargetArr(type) {
    if (type === 'storage') return prepStorage;
    if (type === 'inv') return prepInv;
    if (type === 'safebag') return prepSafeBag;
    return null;
  }

  function showSplitPopup(item, onConfirm) {
    const existing = document.getElementById('prepSplitPopup');
    if (existing) existing.remove();

    const backdrop = document.createElement('div');
    backdrop.id = 'prepSplitPopup';
    backdrop.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;z-index:9999;';

    backdrop.innerHTML = `
      <div style="background:#1a1520;border:1px solid var(--gold-dim);border-radius:12px;padding:24px 28px;min-width:280px;max-width:340px;box-shadow:0 8px 32px rgba(0,0,0,0.8);">
        <h3 style="margin:0 0 6px;color:var(--gold);font-size:1rem;">📦 ${t('ui.dungeon.split_title', '수량 선택')}</h3>
        <p style="margin:0 0 16px;color:var(--text-dim);font-size:0.85rem;">${item.emoji} ${getLocName(item)} (최대 <strong style="color:var(--gold)">${item.qty}</strong>개)</p>
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:20px;">
          <button id="splitDecBtn" style="width:32px;height:32px;background:#2a2030;border:1px solid var(--border);border-radius:6px;color:var(--gold);font-size:1.2rem;cursor:pointer;">-</button>
          <input id="splitQtyInput" type="number" min="1" max="${item.qty}" value="${item.qty}" style="flex:1;text-align:center;background:#0d0b12;border:1px solid var(--gold-dim);border-radius:6px;color:var(--gold);font-size:1.1rem;padding:6px;">
          <button id="splitIncBtn" style="width:32px;height:32px;background:#2a2030;border:1px solid var(--border);border-radius:6px;color:var(--gold);font-size:1.2rem;cursor:pointer;">+</button>
        </div>
        <div style="display:flex;gap:10px;">
          <button id="splitCancelBtn" style="flex:1;padding:10px;background:#1a1520;border:1px solid var(--border);border-radius:8px;color:var(--text-dim);cursor:pointer;font-size:0.9rem;">${t('common.cancel')}</button>
          <button id="splitAllBtn" style="flex:1;padding:10px;background:rgba(60,40,0,0.6);border:1px solid var(--gold-dim);border-radius:8px;color:var(--gold);cursor:pointer;font-size:0.9rem;">${t('ui.dungeon.split_all', '전체 이동')}</button>
          <button id="splitConfirmBtn" style="flex:1;padding:10px;background:linear-gradient(180deg,#2a1800,#1a0e00);border:1px solid var(--gold);border-radius:8px;color:var(--gold);cursor:pointer;font-size:0.9rem;font-weight:700;">${t('ui.dungeon.split_confirm', '이동')}</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const input = backdrop.querySelector('#splitQtyInput');
    backdrop.querySelector('#splitDecBtn').onclick = () => { const v = Math.max(1, parseInt(input.value) || 1) - 1; input.value = Math.max(1, v); };
    backdrop.querySelector('#splitIncBtn').onclick = () => { const v = parseInt(input.value) || 1; input.value = Math.min(item.qty, v + 1); };
    backdrop.querySelector('#splitCancelBtn').onclick = () => { backdrop.remove(); };
    backdrop.querySelector('#splitAllBtn').onclick = () => { backdrop.remove(); onConfirm(item.qty); };
    backdrop.querySelector('#splitConfirmBtn').onclick = () => {
      const amt = parseInt(input.value);
      backdrop.remove();
      onConfirm(isNaN(amt) || amt <= 0 ? item.qty : Math.min(amt, item.qty));
    };
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.remove(); });
    setTimeout(() => input.focus(), 50);
  }

  function handleDrop(fromType, fromIdx, toType, toIdx) {
    fromIdx = Number(fromIdx);
    toIdx = Number(toIdx);
    if (fromType === toType && fromIdx === toIdx) return;

    const srcArr = getTargetArr(fromType);
    const dstArr = getTargetArr(toType);
    if (!srcArr || !dstArr) return;

    const sourceItem = srcArr[fromIdx];
    if (!sourceItem) return;

    const destItem = dstArr[toIdx];
    const crossZone = fromType !== toType;

    // Stackable item crossing zones - show popup
    if (crossZone && sourceItem.stackable && sourceItem.qty > 1) {
      showSplitPopup(sourceItem, (amount) => {
        if (destItem && sourceItem.id === destItem.id) {
          // Merge onto same item
          if (amount >= sourceItem.qty) {
            destItem.qty += sourceItem.qty;
            srcArr[fromIdx] = null;
          } else {
            destItem.qty += amount;
            sourceItem.qty -= amount;
          }
        } else {
          // Move to empty or different slot
          if (amount >= sourceItem.qty) {
            dstArr[toIdx] = sourceItem;
            srcArr[fromIdx] = destItem || null;
          } else {
            dstArr[toIdx] = destItem ? destItem : { ...sourceItem, qty: amount };
            if (!destItem) sourceItem.qty -= amount;
            else {
              // Swap: move partial to temp doesn't make sense, just swap
              dstArr[toIdx] = { ...sourceItem, qty: amount };
              sourceItem.qty -= amount;
            }
          }
        }
        renderGrid();
      });
      return; // wait for popup callback
    }

    // Same zone or non-stackable: just move/swap
    if (destItem && sourceItem.id === destItem.id && sourceItem.stackable) {
      destItem.qty += sourceItem.qty;
      srcArr[fromIdx] = null;
    } else {
      dstArr[toIdx] = sourceItem;
      srcArr[fromIdx] = destItem || null;
    }

    renderGrid();
  }

  renderGrid();
  attachSlotDragEvents();
}
