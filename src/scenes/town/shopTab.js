import { t } from '../../i18n.js';
import { getState, checkAndRefreshAll, buyShopItem, performGachaDraw, premiumRefreshShop } from '../../gameState.js';
import { SETTINGS } from '../../data/settings.js';
import { getLocName, getLocDesc } from '../../utils/i18nUtils.js';
import { showToast, formatTimeRemaining } from './townUtils.js';

let currentShopTab = 'consumable';

export function renderShop(el, isRefresh = false, activeShopTab = null) {
  if (activeShopTab) currentShopTab = activeShopTab;
  const tabToRender = currentShopTab;
  checkAndRefreshAll();
  const state = getState();

  const now = new Date();
  const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0);
  const timeText = formatTimeRemaining(nextHour.getTime());

  // ─── Pick active inventory ───
  const isConsumable = tabToRender === 'consumable';
  const isEquipment = tabToRender === 'equipment';
  const isGacha = tabToRender === 'gacha';
  const shopInv = isConsumable ? state.shopInvConsumable : state.shopInvEquipment;

  const currentRefreshes = isConsumable ? state.todayShopRefreshesConsumable : state.todayShopRefreshesEquipment;
  const maxRefreshes = isConsumable ? SETTINGS.maxShopRefreshesConsumable : SETTINGS.maxShopRefreshesEquipment;

  // ─── Gacha Cost Labels ───
  const singleCostLabel = (() => {
    const silver = state.storage.find(s => s && s.id === 'i_ticket_silver' && (s.qty || 1) > 0);
    return silver ? `🎫 x 1` : `💰 x 100`;
  })();
  const multiCostLabel = (() => {
    const gold = state.storage.find(s => s && s.id === 'i_ticket_gold' && (s.qty || 1) > 0);
    if (gold) return `🎟️ x 1`;
    const totalSilver = state.storage.filter(s => s && s.id === 'i_ticket_silver').reduce((sum, s) => sum + (s.qty || 1), 0);
    if (totalSilver >= 10) return `🎫 x 10`;
    return `💰 x 1000`;
  })();

  // ─── Render Item Grid (Consumable & Equipment) ───
  const renderGrid = (inv) => inv.map((item, i) => {
    if (item === null) {
      return `<div class="shop-slot locked">
              <span class="lock-icon">🔒</span>
              <span class="lock-msg">${t('ui.blacksmith.req_castle').replace('{level}', i >= 8 ? 5 : i >= 6 ? 4 : i >= 4 ? 3 : i >= 2 ? 2 : 1)}</span>
            </div>`;
    }
    const gradeColor = { common: '#aaa', uncommon: '#5b8c5a', magic: '#4a7fb5', rare: '#8b5cf6', epic: '#e06c00', legendary: '#f59e0b' }[item.grade] || '#ccc';

    let statsHtml = '';
    if (item.type === 'armor') {
      statsHtml = `<div class="tooltip-stat">🛡 DEF +${item.def || 0}${item.maxHp ? ` / HP +${item.maxHp}` : ''}</div>`;
    } else if (item.type === 'accessory') {
      statsHtml = `<div class="tooltip-stat">✨ ${['str', 'agi', 'spd', 'vit'].filter(s => item[s]).map(s => `${s.toUpperCase()}+${item[s]}`).join(' ')}</div>`;
    } else if (item.type === 'weapon') {
      statsHtml = `<div class="tooltip-stat">⚔️ DMG ${item.dmgMin || 0}~${item.dmgMax || 0}</div>`;
    }

    let reqsHtml = '';
    if (item.reqStats && Object.keys(item.reqStats).length > 0) {
      const badges = Object.entries(item.reqStats).map(([s, val]) => {
        return `<span class="req-stat" style="display:inline-block; margin-right:4px; margin-bottom:4px;">${s.toUpperCase()} ${val}</span>`;
      }).join('');
      reqsHtml = `<div style="margin-top:6px;">${badges}</div>`;
    }

    return `
            <div class="shop-item-card ${item.bought ? 'bought' : ''}" style="border-top: 3px solid ${gradeColor};">
              <div class="shop-item-visual">${item.emoji}</div>
              <div class="shop-item-name" style="color:${gradeColor};">${getLocName(item)}</div>
              
              <div class="shop-item-tooltip">
                <div class="tooltip-title" style="color:${gradeColor};">${getLocName(item)}</div>
                <div class="tooltip-desc">${getLocDesc(item)}</div>
                ${statsHtml}
                ${reqsHtml}
              </div>

              <div class="shop-item-buy">
                <button class="btn-buy btn-town-primary" data-index="${i}" data-shoptype="${tabToRender}" ${item.bought || state.gold < item.price ? 'disabled' : ''}>
                  ${item.bought ? t('common.completed') : `💰 x ${item.price}`}
                </button>
              </div>
            </div>
          `;
  }).join('');

  el.innerHTML = `
    <div class="tab-panel shop-panel ${isRefresh ? '' : 'fade-in'}">
      <div class="shop-header" style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 16px;">
        <div class="shop-title-group">
          <h2>🛍️ ${t('ui.town.tabs.shop', '상점')}</h2>
        </div>
      </div>

      <!-- Sub-tabs -->
      <div class="shop-subtabs">
        <button class="btn-shop-tab ${isConsumable ? 'active' : ''}" data-stab="consumable">🧪 ${t('ui.shop.tab_consumable', '소모품')}</button>
        <button class="btn-shop-tab ${isEquipment ? 'active' : ''}" data-stab="equipment">⚔️ ${t('ui.shop.tab_equipment', '장비')}</button>
        <button class="btn-shop-tab ${isGacha ? 'active' : ''}" data-stab="gacha">🎰 ${t('ui.shop.tab_gacha', '뽑기')}</button>
      </div>

      ${!isGacha ? `
      <!-- Refresh Area -->
      <div class="shop-refresh-area" style="display:flex; justify-content:flex-end; align-items:center; gap: 8px; margin-top: 16px; margin-bottom: 8px;">
        <div class="premium-refresh-container" style="display:flex; align-items:center; gap: 10px; background:var(--bg-surface); padding:8px 12px; border-radius:6px; border:1px solid var(--border);">
          <small style="color:var(--text-dim); font-size:0.8em;">${t('ui.town.daily_limit', { current: currentRefreshes, max: maxRefreshes })}</small>
          <button id="btnPremiumRefreshShop" class="btn-town-secondary" data-shoptype="${tabToRender}" ${currentRefreshes >= maxRefreshes || state.diamonds < SETTINGS.shopRefreshCostDiamond ? 'disabled' : ''}>
            💎 ${SETTINGS.shopRefreshCostDiamond} ${t('ui.town.premium_refresh')}
          </button>
        </div>
        <div class="refresh-banner" style="margin: 0; padding: 8px 12px;">
          <div class="refresh-info-main">
            <span class="refresh-icon">🔄</span>
            <span class="refresh-label">${t('ui.shop.refresh_label')}</span>
            <span class="refresh-timer" data-timer-type="next-hour">${timeText}</span>
          </div>
        </div>
      </div>
      ` : ''}

      ${isGacha ? `
      <!-- Gacha Panel -->
      <div class="gacha-panel" style="display:flex; flex-direction:column; align-items:center; gap:20px; padding:20px 0;">
        <p style="color:var(--text-dim); text-align:center;">🎰 ${t('ui.town.tabs.shop')} — ${t('ui.shop.tab_gacha')}</p>
        <div style="display:flex; gap:30px; flex-wrap:wrap; justify-content:center;">
          
          <!-- Single Draw Card -->
          <div class="gacha-card" style="width: 220px; height: 320px; background:var(--bg-surface); border:1px solid var(--border); border-radius:12px; display:flex; flex-direction:column; overflow:hidden;">
            <!-- Top 2/3: Icon -->
            <div style="flex: 2; display:flex; justify-content:center; align-items:center; background:rgba(255,255,255,0.02); border-bottom:1px solid var(--border);">
              <span style="font-size: 5em; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));">🎫</span>
            </div>
            <!-- Bottom 1/3: Info & Button -->
            <div style="flex: 1; display:flex; flex-direction:column; justify-content:space-between; align-items:center; padding:16px;">
              <div style="font-size:1.15em; font-weight:bold;">${t('ui.shop.gacha_draw_single', '1회 뽑기')}</div>
              <button id="btnGachaSingle" class="btn-town-primary" style="width:100%; margin-top:auto; font-weight:bold; padding:12px 0; font-size:1.1em; letter-spacing:0.5px;">${singleCostLabel}</button>
            </div>
          </div>

          <!-- Multi Draw Card -->
          <div class="gacha-card" style="width: 220px; height: 320px; background:var(--bg-surface); border:2px solid #f59e0b; border-radius:12px; display:flex; flex-direction:column; overflow:hidden; box-shadow: 0 0 20px rgba(245,158,11,0.15);">
            <!-- Top 2/3: Icon -->
            <div style="flex: 2; display:flex; justify-content:center; align-items:center; background: linear-gradient(180deg, rgba(245,158,11,0.08) 0%, rgba(139,92,246,0.08) 100%); border-bottom:1px solid rgba(245,158,11,0.2);">
              <span style="font-size: 5em; filter: drop-shadow(0 0 15px rgba(245,158,11,0.6));">🎟️</span>
            </div>
            <!-- Bottom 1/3: Info & Button -->
            <div style="flex: 1; display:flex; flex-direction:column; justify-content:space-between; align-items:center; padding:12px 16px;">
              <div style="text-align:center;">
                <div style="font-size:1.15em; font-weight:bold;">${t('ui.shop.gacha_draw_multi', '10+1회 뽑기')}</div>
                <div style="font-size:0.8em; color:#f59e0b; margin-top:4px;">${t('ui.shop.gacha_guaranteed', '✨ rare+ 보장')}</div>
              </div>
              <button id="btnGachaMulti" class="btn-town-primary" style="width:100%; margin-top:auto; font-weight:bold; padding:12px 0; font-size:1.1em; letter-spacing:0.5px; background: linear-gradient(135deg, #8b5cf6, #f59e0b); border:none; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">${multiCostLabel}</button>
            </div>
          </div>

        </div>
      </div>
      ` : `
      <!-- Item Grid -->
      <div class="shop-grid">
        ${renderGrid(shopInv)}
      </div>
      `}
    </div>
  `;

  // Sub-tab switching
  el.querySelectorAll('.btn-shop-tab').forEach(btn => {
    btn.addEventListener('click', () => renderShop(el, true, btn.dataset.stab));
  });

  // Buy items (consumable/equipment)
  el.querySelectorAll('.btn-buy').forEach(btn => {
    btn.addEventListener('click', () => {
      if (buyShopItem(parseInt(btn.dataset.index), btn.dataset.shoptype)) renderShop(el, true, tabToRender);
    });
  });

  // Gacha buttons
  const btnSingle = el.querySelector('#btnGachaSingle');
  if (btnSingle) {
    btnSingle.addEventListener('click', () => {
      const result = performGachaDraw(false);
      if (result.success) showGachaResult(result.items, false, el, tabToRender);
      else showToast(t('ui.shop.gacha_no_funds', { amount: 100 }));
    });
  }
  const btnMulti = el.querySelector('#btnGachaMulti');
  if (btnMulti) {
    btnMulti.addEventListener('click', () => {
      const result = performGachaDraw(true);
      if (result.success) showGachaResult(result.items, true, el, tabToRender);
      else showToast(t('ui.shop.gacha_no_funds_multi', { amount: 1000 }));
    });
  }

  // Premium refresh
  const btnPremiumShop = el.querySelector('#btnPremiumRefreshShop');
  if (btnPremiumShop) {
    btnPremiumShop.addEventListener('click', () => {
      const shopType = btnPremiumShop.dataset.shoptype;
      const maxLimit = shopType === 'equipment' ? SETTINGS.maxShopRefreshesEquipment : SETTINGS.maxShopRefreshesConsumable;
      const currentRefresh = shopType === 'equipment' ? state.todayShopRefreshesEquipment : state.todayShopRefreshesConsumable;

      if (currentRefresh >= maxLimit) { showToast(t('ui.town.limit_reached')); return; }
      if (premiumRefreshShop(shopType)) renderShop(el, false, tabToRender);
      else showToast(t('ui.town.not_enough_diamonds', { amount: SETTINGS.shopRefreshCostDiamond }));
    });
  }
}

function showGachaResult(items, isMulti, el, activeShopTab) {
  const GRADE_COLOR = { common: '#aaa', uncommon: '#5b8c5a', magic: '#4a7fb5', rare: '#8b5cf6', epic: '#e06c00', legendary: '#f59e0b' };
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = `
    <div style="background:var(--bg-panel,#1a1a2e);border:1px solid var(--border,#333);border-radius:16px;padding:28px;max-width:600px;width:90%;max-height:80vh;overflow-y:auto;">
      <h3 style="text-align:center;margin-bottom:16px;">${t('ui.shop.gacha_result_title')}</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:10px;">
        ${items.map((item, i) => {
    const color = GRADE_COLOR[item.grade] || '#ccc';
    const isGuaranteed = isMulti && i === items.length - 1;
    return `<div style="background:var(--bg-surface,#111);border:2px solid ${color};border-radius:10px;padding:10px;text-align:center;${isGuaranteed ? 'box-shadow:0 0 12px ' + color + ';' : ''}">
            <div style="font-size:1.8em;">${item.emoji}</div>
            <div style="font-size:0.75em;color:${color};font-weight:bold;">${getLocName(item)}</div>
            ${isGuaranteed ? `<div style="font-size:0.6em;color:#f59e0b;">✨ ${t('ui.shop.gacha_guaranteed')}</div>` : ''}
          </div>`;
  }).join('')}
      </div>
      <div style="display:flex;justify-content:center;margin-top:16px;">
        <button id="btnCloseGacha" class="btn-town-primary">확인</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#btnCloseGacha').addEventListener('click', () => {
    overlay.remove();
    renderShop(el, true, activeShopTab);
  });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) { overlay.remove(); renderShop(el, true, activeShopTab); } });
}
