// ─── Level Up Overlay (스탯 관리창) ───
import { getDungeonState, allocateStat } from './dungeonState.js';
import { SETTINGS } from './data/settings.js';

let overlayEl = null;

/**
 * Open the level-up stat allocation overlay.
 * @param {Function} [onClose] Callback when overlay is closed
 */
export function openLevelUpOverlay(onClose) {
  if (overlayEl) return; // already open

  overlayEl = document.createElement('div');
  overlayEl.className = 'levelup-overlay';
  overlayEl.innerHTML = buildContent();
  document.body.appendChild(overlayEl);

  // Bind buttons
  bindButtons(onClose);
}

function buildContent() {
  const ds = getDungeonState();
  const w = ds.wanderer;

  const stats = [
    { key: 'vit', label: 'VIT', icon: '❤️', value: w.vit, bonus: '+1' },
    { key: 'str', label: 'STR', icon: '⚔️', value: w.str, bonus: '+1' },
    { key: 'agi', label: 'AGI', icon: '💨', value: w.agi, bonus: '+1' },
    { key: 'spd', label: 'SPD', icon: '⚡', value: w.spd, bonus: '+1' },
    { key: 'dex', label: 'DEX', icon: '🎯', value: w.dex, bonus: '+1' },
    { key: 'luk', label: 'LUK', icon: '🍀', value: w.luk, bonus: '+1' },
  ];

  return `
    <div class="levelup-modal">
      <div class="levelup-header">
        <h2>🎉 스탯 배분</h2>
        <div class="levelup-info">
          <span class="levelup-level">Lv.${ds.level}</span>
          <span class="levelup-points">남은 포인트: <strong>${ds.freeStatPoints}</strong></span>
        </div>
      </div>

      <div class="levelup-stats">
        ${stats.map(s => `
          <div class="levelup-stat-row">
            <span class="levelup-stat-icon">${s.icon}</span>
            <span class="levelup-stat-label">${s.label}</span>
            <span class="levelup-stat-value" id="lu-val-${s.key}">${s.value}</span>
            <button class="btn-stat-up" data-stat="${s.key}" ${ds.freeStatPoints <= 0 ? 'disabled' : ''}>
              + (${s.bonus})
            </button>
          </div>
        `).join('')}
      </div>

      <div class="levelup-footer">
        <button class="btn-levelup-close" ${ds.freeStatPoints > 0 ? '' : ''}>확인</button>
      </div>
    </div>
  `;
}

function bindButtons(onClose) {
  // Stat allocation buttons
  overlayEl.querySelectorAll('.btn-stat-up').forEach(btn => {
    btn.addEventListener('click', () => {
      const stat = btn.dataset.stat;
      const success = allocateStat(stat);
      if (success) {
        // Refresh content
        overlayEl.innerHTML = buildContent();
        bindButtons(onClose);
      }
    });
  });

  // Close button
  overlayEl.querySelector('.btn-levelup-close')?.addEventListener('click', () => {
    closeLevelUpOverlay();
    if (onClose) onClose();
  });
}

export function closeLevelUpOverlay() {
  if (overlayEl) {
    overlayEl.remove();
    overlayEl = null;
  }
}
