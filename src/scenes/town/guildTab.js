import { t } from '../../i18n.js';
import { getState, checkAndRefreshAll, recruitWanderer } from '../../gameState.js';
import { SETTINGS } from '../../data/settings.js';
import { showToast, formatTimeRemaining } from './townUtils.js';

export function renderGuild(el, isRefresh = false) {
  checkAndRefreshAll();
  const state = getState();

  // Calculate next refresh time
  const now = new Date();
  const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0);
  const timeText = formatTimeRemaining(nextHour.getTime());

  el.innerHTML = `
    <div class="tab-panel guild-panel ${isRefresh ? '' : 'fade-in'}">
      <div class="guild-header" style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 20px;">
        <div class="guild-title-group">
          <h2>⚔️ ${t('ui.town.tabs.guild', '길드')}</h2>
          <p style="color:var(--text-dim); margin-top:5px;">${t('ui.guild.desc', '새로운 동료를 고용할 수 있습니다.')}</p>
        </div>
        <div class="header-right-group" style="display:flex; flex-direction:row; align-items:center; gap: 8px;">
          <div class="premium-refresh-container" style="display:flex; align-items:center; gap: 10px; background:var(--bg-surface); padding:8px 12px; border-radius:6px; border:1px solid var(--border);">
            <div style="display:flex; flex-direction:column; align-items:flex-end;">
              <small style="color:var(--text-dim); font-size:0.8em;">${t('ui.town.daily_limit', { current: state.todayGuildRefreshes, max: SETTINGS.maxDailyRefreshes })}</small>
            </div>
            <button id="btnPremiumRefreshGuild" class="btn-town-secondary" ${state.todayGuildRefreshes >= SETTINGS.maxDailyRefreshes || state.diamonds < SETTINGS.guildRefreshCostDiamond ? 'disabled' : ''}>
              💎 ${SETTINGS.guildRefreshCostDiamond} ${t('ui.town.premium_refresh')}
            </button>
          </div>
          <div class="refresh-banner" style="margin: 0; padding: 8px 12px;">
            <div class="refresh-info-main">
              <span class="refresh-icon">🕒</span>
              <span class="refresh-label">${t('ui.guild.refresh_label')}</span>
              <span class="refresh-timer" data-timer-type="next-hour">${timeText}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="char-grid">
         ${state.availableWanderers.map((ch) => {
    // Check if THIS SPECIFIC INSTANCE is recruited
    const isThisInstanceRecruited = state.recruitedWanderers.some(w => w === ch) || ch.isRecruited;
    const isFull = state.recruitedWanderers.length >= state.maxWandererLimit;
    const traits = ch.traits || [];
    const tierClass = `tier-${ch.tier}`;

    return `
            <div class="char-card ${isThisInstanceRecruited ? 'recruited' : ''}" data-id="${ch.id}">
              <div class="char-tier ${tierClass}">${ch.tier}</div>

              <div class="char-card-header">
                <div class="char-portrait-small">${ch.portrait}</div>
                <div class="char-header-text">
                  <div class="char-name">${ch.nameKey ? t(ch.nameKey) : ch.name}</div>
                  <div class="char-class-hp">
                    <span class="char-class-label">${ch.classIcon} ${ch.classKey ? t(ch.classKey) : ch.className}</span>
                    <span class="char-hp-label">❤️ ${50 + (ch.vit * 5)}</span>
                  </div>
                </div>
              </div>

              <div class="char-stats-grid">
                <div class="stat-item"><span class="label">VIT</span><span class="val">${ch.vit}</span></div>
                <div class="stat-item"><span class="label">STR</span><span class="val">${ch.str}</span></div>
                <div class="stat-item"><span class="label">AGI</span><span class="val">${ch.agi}</span></div>
                <div class="stat-item"><span class="label">DEX</span><span class="val">${ch.dex}</span></div>
                <div class="stat-item"><span class="label">LUK</span><span class="val">${ch.luk}</span></div>
                <div class="stat-item"><span class="label">SPD</span><span class="val">${ch.spd}</span></div>
              </div>

              <div class="char-traits">
                ${traits.map((trait) => {
      const nameKey = trait.nameKey || `traits.${trait.type}.${trait.id}.name`;
      const descKey = trait.descKey || `traits.${trait.type}.${trait.id}.desc`;
      return `<span class="trait-badge ${trait.type}" title="${t(descKey)}">${trait.icon || ''} ${t(nameKey)}</span>`;
    }).join('')}
              </div>

              <p class="char-desc">${ch.descKey ? t(ch.descKey) : ch.desc}</p>

              <button class="btn-recruit btn-town-primary ${isThisInstanceRecruited ? 'btn-dismiss' : ''}" data-id="${ch.id}" ${isThisInstanceRecruited || isFull || state.gold < SETTINGS.wandererRecruitCost ? 'disabled' : ''}>
                ${isThisInstanceRecruited ? t('ui.guild.recruited') : isFull ? t('ui.town.roster_full', '[모집 불가 - 인원 초과]') : `💰 x ${SETTINGS.wandererRecruitCost}`}
              </button>
            </div>
          `;
  }).join('')}
      </div>
    </div>
  `;

  el.querySelectorAll('.btn-recruit').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const instance = state.availableWanderers.find((c) => c.id === id);
      if (instance && !instance.isRecruited) {
        recruitWanderer(instance);
        renderGuild(el);
      }
    });
  });

  const btnPremium = el.querySelector('#btnPremiumRefreshGuild');
  if (btnPremium) {
    btnPremium.addEventListener('click', () => {
      if (state.todayGuildRefreshes >= SETTINGS.maxDailyRefreshes) {
        showToast(t('ui.town.limit_reached'));
        return;
      }
      if (state.diamonds < SETTINGS.guildRefreshCostDiamond) {
        showToast(t('ui.town.not_enough_diamond'));
        return;
      }
      import('../../gameState.js').then(({ premiumRefreshGuild }) => {
        if (premiumRefreshGuild()) {
          renderGuild(el);
        }
      });
    });
  }
}
