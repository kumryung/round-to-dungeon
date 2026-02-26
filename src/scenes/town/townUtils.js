import { t } from '../../i18n.js';
import { getState } from '../../gameState.js';
import { SETTINGS } from '../../data/settings.js';

export function updateTimers(container) {
    if (!container) return;
    const now = new Date();

    container.querySelectorAll('[data-timer-type="next-hour"]').forEach(el => {
        const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0).getTime();
        el.textContent = formatTimeRemaining(nextHour);
    });

    container.querySelectorAll('[data-timer-type="daily-reset"]').forEach(el => {
        const nextReset = new Date(now);
        nextReset.setUTCHours(SETTINGS.dailyResetTimeUTC, 0, 0, 0);
        if (now > nextReset) nextReset.setUTCDate(nextReset.getUTCDate() + 1);
        el.textContent = formatTimeRemaining(nextReset.getTime());
    });

    container.querySelectorAll('[data-timer-type="timestamp"]').forEach(el => {
        const target = parseInt(el.dataset.target);
        if (target) el.textContent = t('ui.mail.expires_in', { time: formatTimeRemaining(target) });
    });
}

export function showToast(message) {
    let toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger reflow
    void toast.offsetWidth;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 2000);
}

export function formatTimeRemaining(targetTimestamp) {
    if (!targetTimestamp) return t('time.unlimited');
    const diff = targetTimestamp - Date.now();
    if (diff <= 0) return t('time.expired');

    const sec = 1000;
    const min = sec * 60;
    const hr = min * 60;
    const day = hr * 24;

    if (diff >= day) {
        return t('time.days_left', { n: Math.floor(diff / day) });
    } else if (diff >= hr) {
        return t('time.hours_left', { n: Math.floor(diff / hr) });
    } else {
        const mm = Math.floor(diff / min);
        const ss = Math.floor((diff % min) / sec);
        return t('time.min_sec_left', { m: mm.toString().padStart(2, '0'), s: ss.toString().padStart(2, '0') });
    }
}

export function showConfirmModal(title, message, onConfirm) {
    const modal = document.getElementById('genericConfirmModal');
    const titleEl = document.getElementById('confirmTitle');
    const msgEl = document.getElementById('confirmMessage');
    const btnOk = document.getElementById('btnConfirmOk');
    const btnCancel = document.getElementById('btnConfirmCancel');

    if (!modal || !btnOk || !btnCancel) return;

    titleEl.textContent = title;
    msgEl.textContent = message;

    modal.classList.remove('hidden');

    // Remove existing event listeners by cloning the buttons
    const newBtnOk = btnOk.cloneNode(true);
    const newBtnCancel = btnCancel.cloneNode(true);
    btnOk.parentNode.replaceChild(newBtnOk, btnOk);
    btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);

    const close = () => {
        modal.classList.add('hidden');
    };

    newBtnOk.addEventListener('click', () => {
        onConfirm();
        close();
    });

    newBtnCancel.addEventListener('click', () => {
        close();
    });
}

export function renderCurrencyBar(el) {
    if (!el) return;
    const state = getState();
    el.innerHTML = `
    <div class="currency-item diamond" title="${t('ui.town.tooltip_diamond', '다이아몬드')}">
      <span class="currency-icon">💎</span>
      <span class="currency-value" id="dispDiamonds">${state.diamonds.toLocaleString()}</span>
    </div>
    <div class="currency-item gold" title="${t('ui.town.tooltip_gold', '골드')}">
      <span class="currency-icon">💰</span>
      <span class="currency-value" id="dispGold">${state.gold.toLocaleString()}</span>
    </div>
  `;
}

/**
 * Lightweight in-place update of currently displayed currency values.
 * Call this after any action that changes gold or diamonds.
 */
export function refreshCurrencyDisplay() {
    const state = getState();
    const goldEls = document.querySelectorAll('#dispGold, .currency-item.gold .currency-value');
    const diamEls = document.querySelectorAll('#dispDiamonds, .currency-item.diamond .currency-value');
    goldEls.forEach(el => { el.textContent = state.gold.toLocaleString(); });
    diamEls.forEach(el => { el.textContent = state.diamonds.toLocaleString(); });
}

