import { t } from '../../i18n.js';
import { getState, craftItem, unlockRecipe, getBuildingLevel } from '../../gameState.js';
import { RECIPES } from '../../data/recipes.js';
import { ITEMS } from '../../data/items.js';
import { WEAPONS } from '../../data/weapons.js';
import { getLocName } from '../../utils/i18nUtils.js';
import { showToast } from './townUtils.js';
import { buildItemStatBadges, buildItemReqBadges } from '../../utils/itemCardUtils.js';
import { renderBuildingHeader, attachBuildingHeaderEvents } from './buildingHeader.js';

export function renderBlacksmith(el) {
  const state = getState();

  // Ensure filters exist in state
  if (!state.blacksmithFilters) {
    state.blacksmithFilters = { showCraftable: false, hideLocked: false };
  }

  function getMaterialQty(itemId) {
    return state.storage.reduce((sum, s) => (s && s.id === itemId) ? sum + (s.qty || 1) : sum, 0);
  }

  el.innerHTML = `
    <div class="tab-panel blacksmith-panel fade-in">
      ${renderBuildingHeader('blacksmith')}
      <div class="panel-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
        <div class="blacksmith-title-group">
          <p style="color:var(--text-dim); margin-top:5px;">${t('ui.blacksmith.desc')}</p>
        </div>
        <div class="header-right-group" style="display:flex; flex-direction:column; align-items:flex-end; gap: 8px;">
          <div class="filter-controls" style="background:var(--bg-surface); padding:8px 12px; border-radius:6px; border:1px solid var(--border); display:flex; gap:10px;">
            <label><input type="checkbox" id="chkCraftable" ${state.blacksmithFilters.showCraftable ? 'checked' : ''}> ${t('ui.blacksmith.filter_craftable')}</label>
            <label><input type="checkbox" id="chkHideLocked" ${state.blacksmithFilters.hideLocked ? 'checked' : ''}> ${t('ui.blacksmith.filter_hide_locked')}</label>
          </div>
        </div>
      </div>
      
      <div class="recipe-list row-layout">
        ${RECIPES.map(recipe => {
    const resultItem = WEAPONS[recipe.result] || ITEMS[recipe.result];
    const canCraft = recipe.ingredients.every(ing => getMaterialQty(ing.id) >= ing.qty);
    const isUnlocked = state.unlockedRecipes.includes(recipe.result);
    const blacksmithLevel = getBuildingLevel('blacksmith');
    const reqLv = recipe.reqBlacksmithLv || recipe.reqCastleLv || 1;

    // Hide recipes requiring higher blacksmith level than current (neither locked UI shown)
    if (blacksmithLevel < reqLv) return '';

    // Check unlock requirements
    const hasScroll = state.storage.some(s => s && s.id === recipe.reqItem);
    const blacksmithMet = blacksmithLevel >= reqLv;
    const canUnlock = hasScroll && blacksmithMet;

    // Filter Logic
    if (state.blacksmithFilters.showCraftable && !canCraft) return '';
    if (state.blacksmithFilters.hideLocked && !isUnlocked) return '';

    // Render Ingredients List
    const ingredientsHtml = recipe.ingredients.map(ing => {
      const mat = ITEMS[ing.id] || WEAPONS[ing.id];
      const has = getMaterialQty(ing.id);
      const met = has >= ing.qty;
      return `<span class="mat-item ${met ? 'met' : 'needed'}">${mat.emoji} ${has}/${ing.qty}</span>`;
    }).join('');

    if (!isUnlocked) {
      // Locked State
      const scrollItem = ITEMS[recipe.reqItem];
      return `
              <div class="recipe-row locked">
                <div class="row-info">
                  <span class="item-emoji">🔒</span>
                  <div class="info-text">
                    <span class="item-name">${t('ui.blacksmith.locked_item')} (${t('grades.' + resultItem.grade) || resultItem.grade})</span>
                    <span class="item-desc">${t('ui.blacksmith.locked_desc')}</span>
                  </div>
                </div>
                <div class="row-reqs">
                  <span class="${hasScroll ? 'met' : 'needed'}">${scrollItem ? scrollItem.emoji : '📜'} ${t('ui.blacksmith.req_recipe')}</span>
                </div>
                <div class="row-action">
                  <button class="btn-unlock btn-town-secondary" data-id="${recipe.result}" ${canUnlock ? '' : 'disabled'}>
                    🔓 ${t('ui.blacksmith.unlock')}
                  </button>
                </div>
              </div>
            `;
    }

    let statBadges = '';
    if (resultItem.type === 'weapon' || resultItem.dmgMin !== undefined) {
      statBadges = buildItemStatBadges(resultItem);
    }
    const reqBadges = buildItemReqBadges(resultItem);

    // Unlocked State
    return `
            <div class="recipe-row ${canCraft ? 'craftable' : ''}">
              <div class="row-info">
                <span class="item-emoji grade-${resultItem.grade}">${resultItem.emoji}</span>
                <div class="info-text">
                  <span class="item-name">${getLocName(resultItem)}</span>
                  <span class="item-grade grade-${resultItem.grade}">${t('grades.' + resultItem.grade) || resultItem.grade}</span>
                  ${statBadges ? `<div class="item-badge-row" style="margin-top:4px;">${statBadges}</div>` : ''}
                  ${reqBadges ? `<div class="item-badge-row item-badge-row-reqs">${reqBadges}</div>` : ''}
                </div>
              </div>
              <div class="row-mats">
                ${ingredientsHtml}
              </div>
              <div class="row-action">
                <button class="btn-craft btn-gothic" data-id="${recipe.result}" ${canCraft ? '' : 'disabled'}>
                  ${t('ui_messages.craft_btn')}
                </button>
              </div>
            </div>
          `;
  }).join('')}
      </div>
    </div>
  `;

  // Filter Events
  el.querySelector('#chkCraftable').onchange = (e) => {
    state.blacksmithFilters.showCraftable = e.target.checked;
    renderBlacksmith(el);
  };
  el.querySelector('#chkHideLocked').onchange = (e) => {
    state.blacksmithFilters.hideLocked = e.target.checked;
    renderBlacksmith(el);
  };

  // Craft Buttons
  el.querySelectorAll('.btn-craft').forEach(btn => {
    btn.onclick = () => {
      const resultMsg = craftItem(btn.dataset.id);
      if (resultMsg) {
        showToast(resultMsg);
        renderBlacksmith(el);
      }
    };
  });

  // Unlock Buttons
  el.querySelectorAll('.btn-unlock').forEach(btn => {
    btn.onclick = () => {
      if (unlockRecipe(btn.dataset.id)) {
        showToast(t('ui_messages.recipe_unlocked'));
        renderBlacksmith(el);
      } else {
        showToast(t('ui_messages.unlock_failed'));
      }
    };
  });

  attachBuildingHeaderEvents(el);
}
