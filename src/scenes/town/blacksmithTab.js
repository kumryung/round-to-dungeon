import { t } from '../../i18n.js';
import { getState, craftItem, unlockRecipe } from '../../gameState.js';
import { RECIPES } from '../../data/recipes.js';
import { ITEMS } from '../../data/items.js';
import { WEAPONS } from '../../data/weapons.js';
import { getLocName } from '../../utils/i18nUtils.js';
import { showToast } from './townUtils.js';

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
      <div class="panel-header" style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 20px;">
        <div class="blacksmith-title-group">
          <h2>⚒️ ${t('ui.blacksmith.title')}</h2>
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

    // Check unlock requirements
    const hasScroll = state.storage.some(s => s && s.id === recipe.reqItem);
    const castleMet = state.castleLevel >= recipe.reqCastleLv;
    const canUnlock = hasScroll && castleMet;

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
                  <span class="${castleMet ? 'met' : 'needed'}">🏰 ${t('ui.blacksmith.req_castle', { level: recipe.reqCastleLv })}</span>
                </div>
                <div class="row-action">
                  <button class="btn-unlock btn-town-secondary" data-id="${recipe.result}" ${canUnlock ? '' : 'disabled'}>
                    🔓 ${t('ui.blacksmith.unlock')}
                  </button>
                </div>
              </div>
            `;
    }

    let reqsHtml = '';
    if (resultItem.reqStats && Object.keys(resultItem.reqStats).length > 0) {
      const badges = Object.entries(resultItem.reqStats).map(([s, val]) => {
        return `<span class="req-stat" style="display:inline-block; margin-right:4px; margin-top:2px;">${s.toUpperCase()} ${val}</span>`;
      }).join('');
      reqsHtml = `<div style="margin-top:2px;">${badges}</div>`;
    }

    // Unlocked State
    return `
            <div class="recipe-row ${canCraft ? 'craftable' : ''}">
              <div class="row-info">
                <span class="item-emoji grade-${resultItem.grade}">${resultItem.emoji}</span>
                <div class="info-text">
                  <span class="item-name">${getLocName(resultItem)}</span>
                  <span class="item-grade grade-${resultItem.grade}">${t('grades.' + resultItem.grade) || resultItem.grade}</span>
                  ${reqsHtml}
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
}
