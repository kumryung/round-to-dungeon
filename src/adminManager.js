import {
  getState, addGold, adminRefreshGuild, adminRefreshShop, adminSendItem, refreshDungeonList
} from './gameState.js';
import { ITEMS } from './data/items.js';
import { WEAPONS } from './data/weapons.js';
import { t } from './i18n.js';

let adminOverlay = null;

export function initAdminButton() {
  if (document.getElementById('admin-floating-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'admin-floating-btn';
  btn.innerHTML = '🛠️';
  btn.title = 'Admin Tools';
  document.body.appendChild(btn);

  btn.onclick = toggleAdminPopup;
}

function toggleAdminPopup() {
  if (adminOverlay) {
    closeAdminPopup();
  } else {
    openAdminPopup();
  }
}

function openAdminPopup() {
  adminOverlay = document.createElement('div');
  adminOverlay.className = 'admin-popup-overlay';
  adminOverlay.innerHTML = `
    <div class="admin-popup-content">
      <div class="admin-popup-header">
        <h2>🛠️ Admin Tools</h2>
        <button class="btn-close-admin">✖</button>
      </div>
      <div id="admin-popup-body"></div>
    </div>
  `;
  document.body.appendChild(adminOverlay);

  adminOverlay.querySelector('.btn-close-admin').onclick = closeAdminPopup;
  adminOverlay.onclick = (e) => {
    if (e.target === adminOverlay) closeAdminPopup();
  };

  renderAdminContent(adminOverlay.querySelector('#admin-popup-body'));
}

function closeAdminPopup() {
  if (adminOverlay) {
    adminOverlay.remove();
    adminOverlay = null;
  }
}

function renderAdminContent(el) {
  const itemEntries = Object.entries(ITEMS);
  const weaponEntries = Object.entries(WEAPONS);
  const state = getState();

  el.innerHTML = `
    <div class="admin-sections">
      <div class="admin-section">
        <h3>${t('ui.admin.mail')}</h3>
        <div class="admin-row">
          <select id="popAdminItem">
            <optgroup label="${t('ui.admin.tools')}">
              ${itemEntries.map(([id, item]) => `<option value="${id}">${item.emoji} ${item.nameKey ? t(item.nameKey) : item.name}</option>`).join('')}
            </optgroup>
            <optgroup label="${t('ui.admin.weapons')}">
              ${weaponEntries.map(([id, item]) => `<option value="${id}">${item.emoji} ${item.nameKey ? t(item.nameKey) : item.name}</option>`).join('')}
            </optgroup>
          </select>
          <input type="number" id="popAdminQty" value="1" min="1" style="width: 50px;" title="수량">
          <input type="number" id="popAdminExpiry" value="3" min="-1" style="width: 50px;" title="만료일 (-1:무제한)">
          <button class="btn-admin" id="btnPopAdminSend">발송</button>
        </div>
      </div>

      <div class="admin-section">
        <h3>${t('ui.admin.refresh')}</h3>
        <div class="admin-row">
          <button class="btn-admin" id="btnPopAdminGuild">길드 갱신</button>
          <button class="btn-admin" id="btnPopAdminShop">상점 갱신</button>
          <button class="btn-admin" id="btnPopAdminDungeon">던전 갱신</button>
        </div>
      </div>

      <div class="admin-section">
        <h3>${t('ui.admin.gold_level')}</h3>
        <div class="admin-row">
          <button class="btn-admin" id="btnPopAdminGold">1000G 지급</button>
          <button class="btn-admin" id="btnPopAdminDiamond">10💎 지급</button>
          <button class="btn-admin" id="btnPopAdminLv">성 Lv +1</button>
        </div>
      </div>

      <div class="admin-section">
        <h3>${t('ui.admin.account')}</h3>
        <button id="btnAdminReset" class="btn-town-secondary" style="width:100%; border-color: var(--red); color: var(--red);">
          ${t('ui.admin.reset')}
        </button>
      </div>
    </div>
  `;

  el.querySelector('#btnPopAdminSend').onclick = () => {
    const id = el.querySelector('#popAdminItem').value;
    const qty = parseInt(el.querySelector('#popAdminQty').value);
    const expiry = parseInt(el.querySelector('#popAdminExpiry').value);
    if (adminSendItem(id, qty, expiry)) {
      alert(t('ui.admin.mail_sent', { id, qty, expiry: expiry >= 0 ? expiry + 'd' : t('ui.admin.unlimited') }));
      refreshCurrentTownTab();
    }
  };

  el.querySelector('#btnPopAdminGuild').onclick = () => {
    adminRefreshGuild();
    alert(t('ui.admin.guild_refreshed'));
    refreshCurrentTownTab();
  };

  el.querySelector('#btnPopAdminShop').onclick = () => {
    adminRefreshShop();
    alert(t('ui.admin.shop_refreshed'));
    refreshCurrentTownTab();
  };

  el.querySelector('#btnPopAdminDungeon').onclick = () => {
    refreshDungeonList();
    alert(t('ui.admin.dungeons_refreshed', '던전 목록이 강제 갱신되었습니다.'));
    refreshCurrentTownTab();
  };

  el.querySelector('#btnPopAdminGold').onclick = () => {
    addGold(1000);
    alert(t('ui.admin.gold_granted'));
    refreshCurrentTownTab();
  };

  el.querySelector('#btnPopAdminDiamond').onclick = () => {
    state.diamonds += 10;
    alert("10 다이아 지급 됨");
    refreshCurrentTownTab();
  };

  el.querySelector('#btnPopAdminLv').onclick = () => {
    const s = getState();
    s.castleLevel++;
    adminRefreshShop();
    alert(t('ui.admin.castle_level', { level: s.castleLevel }));
    refreshCurrentTownTab();
  };

  el.querySelector('#btnAdminReset').onclick = () => {
    if (confirm(t('ui.admin.reset_confirm'))) {
      state.adminResetAccount();
    }
  };
}

/**
 * 마을 씬에 있을 경우, 현재 활성화된 탭을 강제 리프레시(클릭)합니다.
 */
function refreshCurrentTownTab() {
  const activeTab = document.querySelector('.town-tab.active');
  if (activeTab) {
    activeTab.click();
  }
}
