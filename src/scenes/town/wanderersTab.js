import { t } from '../../i18n.js';
import { getState, allocateStatPoint, dismissWanderer, buryWanderer, equipItem, unequipItem, getMaxWandererSlots } from '../../gameState.js';
import { SETTINGS } from '../../data/settings.js';
import { getLocName, getLocDesc } from '../../utils/i18nUtils.js';
import { showToast, showConfirmModal, refreshCurrencyDisplay } from './townUtils.js';
import { playSFX } from '../../soundEngine.js';
import { buildItemStatBadges, GRADE_COLOR } from '../../utils/itemCardUtils.js';
import { renderBuildingHeader, attachBuildingHeaderEvents } from './buildingHeader.js';

export function renderWanderers(el) {
  const state = getState();
  const maxWanderers = getMaxWandererSlots();

  el.innerHTML = `
    <div class="tab-panel wanderers-panel fade-in">
      ${renderBuildingHeader('lodge')}
      
      <div class="wanderers-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
        <div class="wanderers-title-group">
          <p style="color:var(--text-dim); margin-top:5px;">${t('ui.wanderers.desc', '고용한 방랑자들을 관리합니다.')}</p>
        </div>
        <div class="header-right-group" style="display:flex; align-items:center; gap: 10px; background:var(--bg-surface); padding:8px 12px; border-radius:6px; border:1px solid var(--border);">
          <small style="color:var(--text-dim); font-size:0.8em;">${t('ui.town.roster', '인원')}: ${state.recruitedWanderers.length} / ${maxWanderers}</small>
        </div>
      </div>
      
      <div class="wanderer-list compact-layout">
        ${state.recruitedWanderers.length === 0
      ? `<p class="placeholder-text">${t('ui.wanderers.empty')}</p>`
      : state.recruitedWanderers.map((ch) => {
        const traits = ch.traits || [];
        const tierClass = `tier-${ch.tier}`;
        return `
              <div class="wanderer-row ${ch.status === 'dead' ? 'dead-character' : ''}" data-id="${ch.id}" style="${ch.status === 'dead' ? 'opacity: 0.6; filter: grayscale(1);' : ''}">
                <!-- Identity Section -->
                <div class="w-col-identity">
                  <div class="w-portrait ${tierClass} ${ch.status === 'dead' ? 'dead' : ''}">${ch.portrait}</div>
                  <div class="w-info">
                    <div class="w-name-row">
                      <span class="w-name" style="${ch.status === 'dead' ? 'text-decoration: line-through; color: var(--red);' : ''}">${ch.nameKey ? t(ch.nameKey) : ch.name}</span>
                      <span class="w-lv">Lv.${ch.level}</span>
                    </div>
                    <div class="w-class">${ch.classIcon} ${ch.classKey ? t(ch.classKey) : ch.className}</div>
                  </div>
                </div>

                <!-- Status Bars (Compact) -->
                <div class="w-col-bars">
                  <div class="w-bar-group">
                    <div class="w-bar-label">HP ${ch.curHp}/${ch.maxHp}</div>
                    <div class="w-bar-track"><div class="w-bar-fill hp" style="width: ${(ch.curHp / ch.maxHp) * 100}%"></div></div>
                  </div>
                  <div class="w-bar-group">
                    <div class="w-bar-label">SAN ${ch.curSanity}/${ch.maxSanity}</div>
                    <div class="w-bar-track"><div class="w-bar-fill san" style="width: ${(ch.curSanity / ch.maxSanity) * 100}%"></div></div>
                  </div>
                  <div class="w-bar-group">
                    <div class="w-bar-label">EXP ${Math.min(100, Math.floor((ch.exp / (ch.level * 100)) * 100))}%</div>
                    <div class="w-bar-track"><div class="w-bar-fill exp" style="width: ${Math.min(100, (ch.exp / (ch.level * 100)) * 100)}%"></div></div>
                  </div>
                </div>

                <!-- Stats Grid (Mini) -->
                <div class="w-col-stats">
                  ${['str', 'agi', 'dex', 'luk', 'vit', 'spd'].map(s => `
                    <div class="w-stat-item" title="${s.toUpperCase()}">
                      <span class="w-stat-label">${s.toUpperCase().slice(0, 3)}</span>
                      <span class="w-stat-val">${ch[s]}</span>
                      ${ch.statPoints > 0 && ch.status !== 'dead' && ch.status !== 'resting' && s !== 'luk' ? `<button class="btn-stat-inc-mini" data-id="${ch.id}" data-stat="${s}">+</button>` : ''}
                    </div>
                  `).join('')}
                  ${ch.statPoints > 0 ? `<div class="stat-points-avail">+${ch.statPoints}</div>` : ''}
                </div>

                <!-- Equipment (Mini Icons) -->
                <div class="w-col-equip" ${ch.status === 'resting' ? 'style="opacity:0.5; pointer-events:none;"' : ''}>
                  <div class="w-equip-slot ${ch.equipments.weapon ? `equipped grade-${ch.equipments.weapon.grade}` : ''}" data-id="${ch.id}" data-slot="weapon" title="${t('ui.equip.weapon')}">
                    ${ch.equipments.weapon ? ch.equipments.weapon.emoji : '✊'}
                  </div>
                  <div class="w-equip-slot ${ch.equipments.armor ? `equipped grade-${ch.equipments.armor.grade}` : ''}" data-id="${ch.id}" data-slot="armor" title="${t('ui.equip.armor')}">
                    ${ch.equipments.armor ? ch.equipments.armor.emoji : '🛡️'}
                  </div>
                  <div class="w-equip-slot ${ch.equipments.accessory ? `equipped grade-${ch.equipments.accessory.grade}` : ''}" data-id="${ch.id}" data-slot="accessory" title="${t('ui.equip.accessory')}">
                    ${ch.equipments.accessory ? ch.equipments.accessory.emoji : '💍'}
                  </div>
                </div>

                <!-- Actions -->
                <div class="w-col-action" style="display:flex; flex-direction:column; align-items:flex-end; gap:5px;">
                  ${ch.status === 'dead'
            ? `<button class="btn-bury-mini" data-id="${ch.id}" title="${t('ui.town.bury', '묻어주기')}">⚰️ ${t('ui.town.bury', '묻어주기')}</button>`
            : `<button class="btn-town-secondary btn-dismiss-mini" data-id="${ch.id}" title="${t('ui.town.dissmiss', '해고')}" ${ch.status === 'resting' ? 'disabled' : ''}>❌</button>`
          }
                </div>
              </div>
            `;
      }).join('')
    }
      </div>
    </div>
  `;

  // Listeners
  el.querySelectorAll('.btn-stat-inc-mini').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      allocateStatPoint(btn.dataset.id, btn.dataset.stat);
      renderWanderers(el);
    });
  });

  el.querySelectorAll('.w-equip-slot').forEach(slotEl => {
    slotEl.addEventListener('click', () => {
      const ch = state.recruitedWanderers.find(w => w.id === slotEl.dataset.id);
      if (ch && ch.status === 'dead') {
        showToast(t('ui_messages.dead_wanderer_equip', '사망한 방랑자의 장비는 조작할 수 없습니다.'));
        return;
      }
      renderEquipSelector(slotEl.dataset.id, slotEl.dataset.slot, el);
    });
  });

  el.querySelectorAll('.btn-dismiss-mini').forEach(btn => {
    btn.addEventListener('click', () => {
      showConfirmModal(
        t('ui.wanderers.dismiss_confirm_title'),
        t('ui.wanderers.dismiss_confirm_msg'),
        () => {
          dismissWanderer(btn.dataset.id);
          renderWanderers(el);
          showToast(t('ui.wanderers.dismissed_msg'));
        }
      );
    });
  });

  el.querySelectorAll('.btn-bury-mini').forEach(btn => {
    btn.addEventListener('click', () => {
      showConfirmModal(
        t('ui.town.bury_confirm_title', '방랑자의 안식'),
        t('ui.town.bury_confirm_msg', '사망한 방랑자를 묻어주어 편안히 잠들게 합니다. 이 방랑자의 남은 데이터는 삭제됩니다. 진행하시겠습니까?'),
        () => {
          buryWanderer(btn.dataset.id);
          renderWanderers(el);
          showToast(t('ui_messages.wanderer_buried', '방랑자가 영면에 들었습니다.'));
        }
      );
    });
  });

  attachBuildingHeaderEvents(el);
}

/**
 * 장비 선택 모달 렌더링
 */
export function renderEquipSelector(wandererId, slot, parentEl) {
  const state = getState();
  const modal = document.getElementById('equipSelectorModal');
  if (!modal) return;

  const wanderer = state.recruitedWanderers.find(w => w.id === wandererId);
  const STAT_LABEL = { str: 'STR', agi: 'AGI', spd: 'SPD', vit: 'VIT', dex: 'DEX', luk: 'LUK' };

  const eligibleItems = state.storage.map((item, idx) => ({ item, idx }))
    .filter(({ item }) => {
      if (!item) return false;
      return item.type === slot;
    });

  const renderReqStats = (item) => {
    const reqs = item.reqStats || {};
    if (Object.keys(reqs).length === 0) return '';
    return `<div class="item-req-stats">${Object.entries(reqs).map(([stat, val]) => {
      const has = (wanderer?.[stat] ?? 0) >= val;
      return `<span class="req-stat ${has ? 'met' : 'unmet'}">${STAT_LABEL[stat] ?? stat} ${val}</span>`;
    }).join('')}</div>`;
  };

  const renderItemStats = (item) => {
    const badges = buildItemStatBadges(item);
    if (!badges) return '';
    return `<div class="item-stat-chips">${badges}</div>`;
  };

  const canEquip = (item) => {
    const reqs = item.reqStats || {};
    return Object.entries(reqs).every(([stat, val]) => (wanderer?.[stat] ?? 0) >= val);
  };

  modal.classList.remove('hidden');
  modal.innerHTML = `
    <div class="modal-content equip-selector-modal fade-in">
      <div class="modal-header">
        <h3>${t('ui.equip.title')} (${slot === 'weapon' ? t('ui.equip.weapon') : slot === 'armor' ? t('ui.equip.armor') : t('ui.equip.accessory')})</h3>
        <button class="btn-close-modal">✖</button>
      </div>
      <div class="selector-list">
        ${eligibleItems.length === 0
      ? `<p class="placeholder-text">${t('ui.equip.empty')}</p>`
      : eligibleItems.map(({ item, idx }) => {
        const eligible = canEquip(item);
        return `
            <div class="selector-item ${eligible ? '' : 'req-not-met'} grade-${item.grade}" data-idx="${idx}">
              <span class="item-emoji">${item.emoji}</span>
              <div class="item-info">
                <div class="item-name">${getLocName(item)}</div>
                <div class="item-desc">${getLocDesc(item)}</div>
                ${renderItemStats(item)}
                ${renderReqStats(item)}
              </div>
              <button class="btn-equip-action btn-town-primary" ${eligible ? '' : 'disabled title="스탯 조건을 충족하지 못했습니다."'}>${t('ui.action.equip')}</button>
            </div>
          `;
      }).join('')
    }
        <div class="selector-item unequip-action">
          <button class="btn-unequip-action btn-town-secondary">${t('ui.action.unequip')}</button>
        </div>
      </div>
    </div>
  `;

  modal.querySelector('.btn-close-modal').onclick = () => modal.classList.add('hidden');

  modal.querySelectorAll('.btn-equip-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const storageIdx = parseInt(btn.closest('.selector-item').dataset.idx);
      const result = equipItem(wandererId, storageIdx, slot);
      if (!result.success && result.reason === 'STATS_NOT_MET') {
        const missing = Object.entries(result.missingStats)
          .map(([s, v]) => `${STAT_LABEL[s] ?? s}: ${v.current}/${v.required}`)
          .join(', ');
        showToast(`스탯 부족: ${missing}`);
        return;
      }
      playSFX('equip');
      modal.classList.add('hidden');
      renderWanderers(parentEl);
    });
  });

  modal.querySelector('.btn-unequip-action').onclick = () => {
    unequipItem(wandererId, slot);
    playSFX('equip');
    modal.classList.add('hidden');
    renderWanderers(parentEl);
  };
}
