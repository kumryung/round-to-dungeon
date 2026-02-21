import { t, setLanguage } from '../../i18n.js';
import { getState, adminResetAccount } from '../../gameState.js';
import { showConfirmModal } from './townUtils.js';

export function renderSettings(el) {
    const state = getState();
    const currentLang = state.language || 'ko';

    el.innerHTML = `
    <div class="tab-panel settings-panel fade-in">
      <h2>⚙️ ${t('ui.settings.title')}</h2>
      
      <div class="settings-section">
        <div class="settings-row">
          <span class="settings-label">${t('ui.settings.language')}</span>
          <div class="settings-value">
            <select id="langSelect" class="gothic-select">
              <option value="ko" ${currentLang === 'ko' ? 'selected' : ''}>🇰🇷 한국어</option>
              <option value="en" ${currentLang === 'en' ? 'selected' : ''}>🇺🇸 English</option>
              <option value="ja" ${currentLang === 'ja' ? 'selected' : ''}>🇯🇵 日本語</option>
            </select>
          </div>
        </div>
      </div>

      <hr class="settings-divider" style="margin: 24px 0; border: 0; border-top: 1px solid var(--border);">

      <div class="settings-section danger-zone" style="border: 1px solid var(--red-dim); padding: 16px; border-radius: 8px; background: rgba(50, 10, 10, 0.3);">
        <h3 style="color: var(--red); margin-top: 0;">${t('ui.settings.reset_account')}</h3>
        <p class="danger-desc" style="color: var(--text-dim); margin-bottom: 12px;">${t('ui.settings.reset_desc')}</p>
        <button id="btnSettingsReset" class="btn-town-secondary btn-danger-large" style="width: 100%;">
          🗑️ ${t('ui.settings.delete_btn')}
        </button>
      </div>
    </div>
  `;

    // Language Change
    el.querySelector('#langSelect').addEventListener('change', (e) => {
        const newLang = e.target.value;
        if (newLang !== currentLang) {
            setLanguage(newLang);
            location.reload();
        }
    });

    // Reset
    el.querySelector('#btnSettingsReset').addEventListener('click', () => {
        showConfirmModal(
            t('ui.settings.reset_confirm_title'),
            t('ui.settings.reset_confirm_msg'),
            () => {
                adminResetAccount();
            }
        );
    });
}
