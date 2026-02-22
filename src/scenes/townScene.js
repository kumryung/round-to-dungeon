import { changeScene } from '../sceneManager.js';
import { playSFX } from '../soundEngine.js';
import { t } from '../i18n.js';

import { renderCurrencyBar, updateTimers } from './town/townUtils.js';
import { renderCastle } from './town/castleTab.js';
import { renderWanderers, renderEquipSelector } from './town/wanderersTab.js';
import { renderGuild } from './town/guildTab.js';
import { renderStorage } from './town/storageTab.js';
import { renderShop } from './town/shopTab.js';
import { renderBlacksmith } from './town/blacksmithTab.js';
import { renderMailbox } from './town/mailboxTab.js';
import { renderDungeon, renderDungeonPrep } from './town/dungeonTab.js';
import { renderSettings } from './town/settingsTab.js';

let townTimerInterval = null;

export function mount(container) {
  container.innerHTML = `
    <div class="town-scene">
      <!-- Header -->
      <header class="town-header">
        <h1 class="town-title">🏘️ ${t('ui.town.title')}</h1>
        <p class="town-subtitle">${t('ui.town.subtitle')}</p>
      </header>

      <!-- Building tabs -->
      <nav class="town-tabs">
        <button class="town-tab active" data-tab="castle">🏰 ${t('ui.town.tabs.castle')}</button>
        <button class="town-tab" data-tab="wanderers">👥 ${t('ui.town.tabs.wanderers')}</button>
        <button class="town-tab" data-tab="guild">⚔️ ${t('ui.town.tabs.guild')}</button>
        <button class="town-tab" data-tab="storage">📦 ${t('ui.town.tabs.storage')}</button>
        <button class="town-tab" data-tab="shop">🛍️ ${t('ui.town.tabs.shop')}</button>
        <button class="town-tab" data-tab="blacksmith">⚒️ ${t('ui.town.tabs.blacksmith')}</button>
        <button class="town-tab" data-tab="mailbox">✉️ ${t('ui.town.tabs.mailbox')}</button>
        <button class="town-tab" data-tab="dungeon">🗺️ ${t('ui.town.tabs.dungeon')}</button>
        <button class="town-tab" data-tab="settings">⚙️ ${t('ui.town.tabs.settings')}</button>
      </nav>

      <!-- Currency bar -->
      <div class="town-currency-bar" id="townCurrencyBar"></div>

      <!-- Tab content area -->
      <main class="town-main" id="townContent"></main>
    </div>
    <div id="equipSelectorModal" class="modal-overlay hidden"></div>
  `;

  // Tab switching
  container.querySelectorAll('.town-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      playSFX('click');
      container.querySelectorAll('.town-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      renderTab(tab.dataset.tab);
    });
  });

  // Real-time timer update
  if (townTimerInterval) clearInterval(townTimerInterval);
  townTimerInterval = setInterval(() => {
    updateTimers(container);
  }, 1000);

  renderTab('castle');
  renderCurrencyBar(container.querySelector('#townCurrencyBar'));

  // Generic Confirm Modal
  const confirmModalHtml = `
    <div id="genericConfirmModal" class="modal-overlay hidden">
      <div class="modal-content confirm-modal fade-in">
        <h3 id="confirmTitle">${t('common.confirm')}</h3>
        <p id="confirmMessage">${t('ui.town.confirm_default_msg', '정말로 진행하시겠습니까?')}</p>
        <div class="modal-actions">
          <button id="btnConfirmCancel" class="btn-town-cancel">${t('common.cancel')}</button>
          <button id="btnConfirmOk" class="btn-town-secondary">${t('common.confirm')}</button>
        </div>
      </div>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', confirmModalHtml);
}

export function unmount() {
  if (townTimerInterval) {
    clearInterval(townTimerInterval);
    townTimerInterval = null;
  }
}

function renderTab(tabName, isRefresh = false) {
  const content = document.getElementById('townContent');
  const currencyBar = document.getElementById('townCurrencyBar');

  if (tabName === 'castle') renderCastle(content);
  else if (tabName === 'wanderers') renderWanderers(content);
  else if (tabName === 'guild') renderGuild(content, isRefresh);
  else if (tabName === 'storage') renderStorage(content);
  else if (tabName === 'shop') renderShop(content, isRefresh);
  else if (tabName === 'blacksmith') renderBlacksmith(content);
  else if (tabName === 'mailbox') renderMailbox(content, isRefresh);
  else if (tabName === 'dungeon') renderDungeon(content);
  else if (tabName === 'settings') renderSettings(content);

  // Always refresh currency bar on tab change or refresh
  renderCurrencyBar(currencyBar);
}
