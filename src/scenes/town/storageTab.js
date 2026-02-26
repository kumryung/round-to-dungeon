import { t } from '../../i18n.js';
import { getState, sortStorage, updateSortOrder, getMaxStorageSlots } from '../../gameState.js';
import { SETTINGS } from '../../data/settings.js';
import { getLocName } from '../../utils/i18nUtils.js';
import { buildItemTooltipHTML } from '../../utils/itemCardUtils.js';
import { renderBuildingHeader, attachBuildingHeaderEvents } from './buildingHeader.js';

// Storage filter state
let currentStorageFilter = 'all';

export function renderStorage(el) {
  const state = getState();
  const maxSlots = getMaxStorageSlots();
  const usedSlots = state.storage.filter(s => s !== null).length;

  // Ensure storage array is large enough
  while (state.storage.length < maxSlots) state.storage.push(null);

  // Filter logic
  const filteredSlots = state.storage.map((slot, i) => ({ slot, i })).filter(({ slot }) => {
    if (currentStorageFilter === 'all') return true;
    if (!slot) return false;
    return slot.type === currentStorageFilter;
  });

  const filterTabs = [
    { id: 'all', label: `🗃️ ${t('ui.storage.filter_all', '전체')}` },
    { id: 'consumable', label: `🧪 ${t('ui.storage.filter_consumable', '소모품')}` },
    { id: 'material', label: `⛏️ ${t('ui.storage.filter_material', '재료')}` },
    { id: 'weapon', label: `⚔️ ${t('ui.storage.filter_weapon', '무기')}` },
    { id: 'armor', label: `🛡️ ${t('ui.storage.filter_armor', '방어구')}` },
    { id: 'accessory', label: `💍 ${t('ui.storage.filter_accessory', '악세사리')}` },
  ];

  el.innerHTML = `
    <div class="tab-panel storage-panel fade-in">
      ${renderBuildingHeader('storage')}
      <div class="panel-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px;">
        <div>
          <p style="color:var(--text-dim); margin-top:5px;">${t('ui.storage.desc', '탐험에서 획득한 아이템을 보관합니다.')}</p>
        </div>
        <div style="display:flex; align-items:center; gap: 8px; background:var(--bg-surface); padding:8px 12px; border-radius:6px; border:1px solid var(--border);">
          <small style="color:var(--text-dim); font-size:0.8em;">${t('ui.storage.title')}: ${usedSlots}/${maxSlots}</small>
          <button id="btnSortStorage" class="btn-town-secondary" title="${t('ui.storage.sort')}">🧹 ${t('ui.storage.sort')}</button>
          <button id="btnSortOrder" class="btn-town-secondary" title="${t('ui.storage.order')}">⚙️ ${t('ui.storage.order')}</button>
        </div>
      </div>

      <!-- Filter tabs -->
      <div class="storage-filter-tabs" style="display:flex; gap:6px; margin-bottom:12px; flex-wrap:wrap;">
        ${filterTabs.map(f => `
          <button class="btn-shop-tab ${currentStorageFilter === f.id ? 'active' : ''}" data-filter="${f.id}">${f.label}</button>
        `).join('')}
      </div>

      <div class="storage-grid">
        ${filteredSlots.map(({ slot, i }) => `
          <div class="storage-slot ${slot ? `grade-${slot.grade}` : 'empty'}" data-index="${i}">
            ${slot ? `
              <span class="slot-emoji">${slot.emoji}</span>
              ${slot.qty > 1 ? `<span class="slot-qty">${slot.qty}</span>` : ''}
              <div class="slot-tooltip">${buildItemTooltipHTML(slot)}</div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Filter tab events
  el.querySelectorAll('[data-filter]').forEach(btn => {
    btn.onclick = () => {
      currentStorageFilter = btn.dataset.filter;
      renderStorage(el);
    };
  });

  el.querySelector('#btnSortStorage').onclick = () => {
    sortStorage();
    renderStorage(el);
  };

  el.querySelector('#btnSortOrder').onclick = () => {
    renderSortOrderModal(el);
  };

  attachBuildingHeaderEvents(el);
}

function renderSortOrderModal(parentEl) {
  const state = getState();
  const modal = document.getElementById('equipSelectorModal'); // Reusing the modal container
  if (!modal) return;

  modal.classList.remove('hidden');
  modal.innerHTML = `
    <div class="modal-content sort-order-modal fade-in">
      <div class="modal-header">
        <h3>📦 ${t('ui.storage.sort_title', '정렬 순서 설정')}</h3>
        <button class="btn-close-modal">✖</button>
      </div>
      <p class="modal-desc">${t('ui.storage.sort_desc', '드래그하여 우선순위를 변경하세요. (위쪽이 먼저 정렬됨)')}</p>
      <div class="sort-list" id="sortList">
        ${state.storageSortOrder.map((type, idx) => `
          <div class="sort-item" draggable="true" data-type="${type}" data-index="${idx}">
            <span class="drag-handle">☰</span>
            <span class="type-name">${getTypeLabel(type)}</span>
          </div>
        `).join('')}
      </div>
      <div class="modal-footer">
        <button id="btnSaveSort" class="btn-town-primary">${t('ui.storage.btn_save_sort', '저장 및 정렬')}</button>
      </div>
    </div>
  `;

  function getTypeLabel(type) {
    const labels = {
      weapon: t('ui.equip.weapon'),
      armor: t('ui.equip.armor'),
      accessory: t('ui.equip.accessory'),
      tool: t('ui.storage.cat_tool', '도구'),
      consumable: t('ui.storage.cat_consumable', '소모품'),
      material: t('ui.storage.cat_material', '재료')
    };
    return labels[type] || type;
  }

  modal.querySelector('.btn-close-modal').onclick = () => modal.classList.add('hidden');

  const list = modal.querySelector('#sortList');
  let draggedItem = null;

  list.querySelectorAll('.sort-item').forEach(item => {
    item.addEventListener('dragstart', () => {
      draggedItem = item;
      item.classList.add('dragging');
    });
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
    });
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      const afterElement = getDragAfterElement(list, e.clientY);
      if (afterElement == null) {
        list.appendChild(draggedItem);
      } else {
        list.insertBefore(draggedItem, afterElement);
      }
    });
  });

  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.sort-item:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  modal.querySelector('#btnSaveSort').onclick = () => {
    const newOrder = [...list.querySelectorAll('.sort-item')].map(item => item.dataset.type);
    updateSortOrder(newOrder);
    sortStorage();
    modal.classList.add('hidden');
    renderStorage(parentEl);
  };
}
