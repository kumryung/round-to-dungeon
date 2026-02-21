import { t } from '../../i18n.js';
import { getState, sortStorage, updateSortOrder } from '../../gameState.js';
import { SETTINGS } from '../../data/settings.js';
import { getLocName, getLocDesc } from '../../utils/i18nUtils.js';

export function renderStorage(el) {
    const state = getState();
    const usedSlots = state.storage.filter(s => s !== null).length;
    const upgradeCost = state.storageMaxSlots * 50;
    const canUpgrade = state.gold >= upgradeCost && state.storageMaxSlots < 100;

    el.innerHTML = `
    <div class="tab-panel storage-panel fade-in">
      <div class="panel-header" style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <h2>📦 ${t('ui.storage.title')} (${usedSlots}/${state.storageMaxSlots})</h2>
          <div class="storage-controls" style="margin-top: 10px;">
            <button id="btnSortStorage" class="btn-town-secondary" title="${t('ui.storage.sort')}">🧹 ${t('ui.storage.sort')}</button>
            <button id="btnSortOrder" class="btn-town-secondary" title="${t('ui.storage.order')}">⚙️ ${t('ui.storage.order')}</button>
          </div>
        </div>
        <div class="roster-info" style="display:flex; align-items:center; gap: 10px; background:var(--bg-surface); padding:8px 12px; border-radius:6px; border:1px solid var(--border);">
          <div style="display:flex; flex-direction:column; align-items:flex-end;">
            <small style="color:var(--text-dim); font-size:0.8em;">${t('ui.storage.title')}: ${state.storageMaxSlots} / 100</small>
          </div>
          ${state.storageMaxSlots < 100
            ? `<button id="btnUpgradeStorage" class="btn-town-secondary" ${canUpgrade ? '' : 'disabled'} title="${t('ui.storage.expand')}">
                  💎 ${SETTINGS.storageExpandCostDiamond} ${t('ui.town.expand_roster', '확장')}
                </button>`
            : `<span style="color:var(--gold); font-size: 0.9em;">(최대)</span>`
        }
        </div>
      </div>

      <div class="storage-grid">
        ${state.storage.map((slot, i) => `
          <div class="storage-slot ${slot ? '' : 'empty'}" data-index="${i}">
            ${slot ? `
              <span class="slot-emoji">${slot.emoji}</span>
              ${slot.qty > 1 ? `<span class="slot-qty">${slot.qty}</span>` : ''}
              <div class="slot-tooltip">${getLocName(slot)}<br><small>${getLocDesc(slot)}</small></div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;

    const btnUpgrade = el.querySelector('#btnUpgradeStorage');
    if (btnUpgrade) {
        btnUpgrade.onclick = () => {
            import('../../gameState.js').then(({ upgradeStorage }) => {
                if (upgradeStorage()) renderStorage(el);
            });
        };
    }

    el.querySelector('#btnSortStorage').onclick = () => {
        sortStorage();
        renderStorage(el);
    };

    el.querySelector('#btnSortOrder').onclick = () => {
        renderSortOrderModal(el);
    };
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
