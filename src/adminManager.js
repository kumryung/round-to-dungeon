import {
  getState, addGold, adminRefreshGuild, adminRefreshShop, adminSendItem
} from './gameState.js';
import { ITEMS } from './data/items.js';

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
  const state = getState();

  el.innerHTML = `
    <div class="admin-sections">
      <div class="admin-section">
        <h3>✉️ 아이템 우편 발송</h3>
        <div class="admin-row">
          <select id="popAdminItem">
            ${itemEntries.map(([id, item]) => `<option value="${id}">${item.emoji} ${item.name}</option>`).join('')}
          </select>
          <input type="number" id="popAdminQty" value="1" min="1" style="width: 50px;" title="수량">
          <input type="number" id="popAdminExpiry" value="3" min="-1" style="width: 50px;" title="만료일 (-1:무제한)">
          <button class="btn-admin" id="btnPopAdminSend">발송</button>
        </div>
      </div>

      <div class="admin-section">
        <h3>🔄 즉시 갱신</h3>
        <div class="admin-row">
          <button class="btn-admin" id="btnPopAdminGuild">길드 갱신</button>
          <button class="btn-admin" id="btnPopAdminShop">상점 갱신</button>
        </div>
      </div>

      <div class="admin-section">
        <h3>💰 골드 & 레벨</h3>
        <div class="admin-row">
          <button class="btn-admin" id="btnPopAdminGold">1000G 지급</button>
          <button class="btn-admin" id="btnPopAdminLv">성 Lv +1</button>
        </div>
      </div>
    </div>
  `;

  el.querySelector('#btnPopAdminSend').onclick = () => {
    const id = el.querySelector('#popAdminItem').value;
    const qty = parseInt(el.querySelector('#popAdminQty').value);
    const expiry = parseInt(el.querySelector('#popAdminExpiry').value);
    if (adminSendItem(id, qty, expiry)) {
      alert(`${id} x ${qty} (만료: ${expiry >= 0 ? expiry + '일' : '무제한'}) 발송됨`);
      refreshCurrentTownTab();
    }
  };

  el.querySelector('#btnPopAdminGuild').onclick = () => {
    adminRefreshGuild();
    alert('길드 갱신됨');
    refreshCurrentTownTab();
  };

  el.querySelector('#btnPopAdminShop').onclick = () => {
    adminRefreshShop();
    alert('상점 갱신됨');
    refreshCurrentTownTab();
  };

  el.querySelector('#btnPopAdminGold').onclick = () => {
    addGold(1000);
    alert('1000G 지급됨');
    refreshCurrentTownTab();
  };

  el.querySelector('#btnPopAdminLv').onclick = () => {
    const s = getState();
    s.castleLevel++;
    adminRefreshShop();
    alert(`성 레벨 ${s.castleLevel}로 증가`);
    refreshCurrentTownTab();
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
