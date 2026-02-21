import { t } from '../../i18n.js';
import { getState, checkAndRefreshAll, receiveMail, receiveAllMail } from '../../gameState.js';
import { formatTimeRemaining } from './townUtils.js';

export function renderMailbox(el, isRefresh = false) {
  checkAndRefreshAll();
  const state = getState();

  el.innerHTML = `
    <div class="tab-panel mailbox-panel ${isRefresh ? '' : 'fade-in'}">
      <div class="mailbox-header" style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 20px;">
        <div class="mailbox-title-group">
          <h2>✉️ ${t('ui.mailbox.title')}</h2>
          <p style="color:var(--text-dim); margin-top:5px;">${t('ui.mailbox.desc')}</p>
        </div>
        <div class="header-right-group" style="display:flex; flex-direction:column; align-items:flex-end; gap: 8px;">
          ${state.mailbox.length > 0 ? `<button class="btn-receive-all btn-town-secondary" id="btnReceiveAll">📦 ${t('ui.mailbox.receive_all')}</button>` : ''}
        </div>
      </div>

      <div class="mail-list">
        ${state.mailbox.length === 0
      ? `<p class="mail-empty">${t('ui.mailbox.empty')}</p>`
      : state.mailbox.map(mail => `
            <div class="mail-card" data-id="${mail.id}">
              <div class="mail-body">
                <div class="mail-row-top">
                  <span class="mail-subject">${mail.subject}</span>
                  <span class="mail-expiry" data-timer-type="timestamp" data-target="${mail.expiryTimestamp}">${mail.expiryDays === -1 ? t('ui.mail.unlimited') : `${t('ui.mail.expires_in', { time: formatTimeRemaining(mail.expiryTimestamp) })}`}</span>
                </div>
                <div class="mail-row-bottom">
                  <div class="mail-items-preview">
                    ${mail.items.map(i => `
                      <div class="mail-item-icon">
                        <span class="item-emoji">${i.emoji}</span>
                        <span class="mail-item-qty">x${i.qty || 1}</span>
                      </div>
                    `).join('')}
                  </div>
                  <button class="btn-receive-mail" data-id="${mail.id}">${t('ui.mailbox.receive')}</button>
                </div>
              </div>
            </div>
          `).join('')
    }
      </div>
    </div>
  `;

  el.querySelectorAll('.btn-receive-mail').forEach(btn => {
    btn.addEventListener('click', () => {
      const res = receiveMail(btn.dataset.id);
      if (!res.allAdded) alert(t('ui.mailbox.msg_storage_full'));
      renderMailbox(el);
    });
  });

  const btnAll = el.querySelector('#btnReceiveAll');
  if (btnAll) {
    btnAll.onclick = () => {
      const res = receiveAllMail();
      if (res.storageFull) {
        alert(t('ui.mailbox.msg_partial', { count: res.removedCount }));
      } else {
        alert(t('ui.mailbox.msg_received_all', { count: res.removedCount }));
      }
      renderMailbox(el);
    };
  }
}
