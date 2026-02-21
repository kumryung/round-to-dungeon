import { t } from '../../i18n.js';
import { getState } from '../../gameState.js';
import { MAPS } from '../../data/maps.js';

export function renderCastle(el) {
    el.innerHTML = `
    <div class="tab-panel castle-panel fade-in">
      <div class="castle-banner">
        <div class="castle-icon">🏰</div>
        <h2>${t('ui.castle.title')}</h2>
      </div>
      <div class="castle-message">
        <p class="castle-welcome">${t('ui.castle.welcome')}</p>
        <p>${t('ui.castle.desc')}</p>
        <p class="castle-tip">${t('ui.castle.tip').replace('<1>', '<em>').replace('</1>', '</em>').replace('<2>', '<em>').replace('</2>', '</em>')}</p>
      </div>
      <div class="castle-stats">
        <div class="stat-card"><span class="stat-value">${getState().recruitedWanderers.length}</span><span class="stat-label">${t('ui.castle.stat_wanderers')}</span></div>
        <div class="stat-card"><span class="stat-value">${MAPS.length}</span><span class="stat-label">${t('ui.castle.stat_dungeons')}</span></div>
        <div class="stat-card"><span class="stat-value">0</span><span class="stat-label">${t('ui.castle.stat_clears')}</span></div>
      </div>
    </div>
  `;
}
