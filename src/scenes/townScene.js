// ─── Town Scene (마을씬) ───
import { changeScene } from '../sceneManager.js';
import {
  getState, recruitWanderer, dismissWanderer, selectWanderer, selectMap,
  upgradeStorage, buyShopItem, receiveMail, receiveAllMail, checkAndRefreshAll, addGold, removeFromStorage
} from '../gameState.js';
import { CHARACTERS } from '../data/characters.js';
import { MAPS } from '../data/maps.js';
import { ITEMS } from '../data/items.js';

let townTimerInterval = null;

function formatTimeRemaining(targetTimestamp) {
  if (!targetTimestamp) return '무제한';
  const diff = targetTimestamp - Date.now();
  if (diff <= 0) return '시간 만료';

  const sec = 1000;
  const min = sec * 60;
  const hr = min * 60;
  const day = hr * 24;

  if (diff >= day) {
    return `${Math.floor(diff / day)}일 남음`;
  } else if (diff >= hr) {
    return `${Math.floor(diff / hr)}시간 남음`;
  } else {
    const mm = Math.floor(diff / min);
    const ss = Math.floor((diff % min) / sec);
    return `${mm.toString().padStart(2, '0')}분 ${ss.toString().padStart(2, '0')}초 남음`;
  }
}
export function mount(container) {
  container.innerHTML = `
    <div class="town-scene">
      <!-- Header -->
      <header class="town-header">
        <h1 class="town-title">🏘️ 마을</h1>
        <p class="town-subtitle">모험을 떠나기 전, 준비를 마치세요.</p>
      </header>

      <!-- Building tabs -->
      <nav class="town-tabs">
        <button class="town-tab active" data-tab="castle">🏰 성</button>
        <button class="town-tab" data-tab="wanderers">👥 방랑자</button>
        <button class="town-tab" data-tab="guild">⚔️ 길드</button>
        <button class="town-tab" data-tab="storage">📦 창고</button>
        <button class="town-tab" data-tab="shop">🛍️ 상점</button>
        <button class="town-tab" data-tab="mailbox">✉️ 우편함</button>
        <button class="town-tab" data-tab="dungeon">🗺️ 던전</button>
      </nav>

      <!-- Currency bar -->
      <div class="town-currency-bar" id="townCurrencyBar"></div>

      <!-- Tab content area -->
      <main class="town-main" id="townContent"></main>
    </div>
  `;

  // Tab switching
  container.querySelectorAll('.town-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.town-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      renderTab(tab.dataset.tab);
    });
  });

  // Real-time timer update
  if (townTimerInterval) clearInterval(townTimerInterval);
  townTimerInterval = setInterval(() => {
    const activeTab = container.querySelector('.town-tab.active');
    if (activeTab && (['guild', 'shop', 'mailbox'].includes(activeTab.dataset.tab))) {
      renderTab(activeTab.dataset.tab, true); // true = silent update (no fade-in)
    }
  }, 1000);

  renderTab('castle');
  renderCurrencyBar(container.querySelector('#townCurrencyBar'));
}

export function unmount() {
  if (townTimerInterval) {
    clearInterval(townTimerInterval);
    townTimerInterval = null;
  }
}

/* ───────── Shared UI Helpers ───────── */
function renderCurrencyBar(el) {
  if (!el) return;
  const state = getState();
  el.innerHTML = `
    <div class="currency-item gold">
      <span class="currency-icon">💰</span>
      <span class="currency-value">${state.gold.toLocaleString()}</span>
    </div>
    <!-- Future currencies can be added here -->
  `;
}

/* ───────── Tab renderers ───────── */
function renderTab(tabName, isRefresh = false) {
  const content = document.getElementById('townContent');
  const currencyBar = document.getElementById('townCurrencyBar');

  if (tabName === 'castle') renderCastle(content);
  else if (tabName === 'wanderers') renderWanderers(content);
  else if (tabName === 'guild') renderGuild(content, isRefresh);
  else if (tabName === 'storage') renderStorage(content);
  else if (tabName === 'shop') renderShop(content, isRefresh);
  else if (tabName === 'mailbox') renderMailbox(content, isRefresh);
  else if (tabName === 'dungeon') renderDungeon(content);

  // Always refresh currency bar on tab change or refresh
  renderCurrencyBar(currencyBar);
}

/* ─── Castle ─── */
function renderCastle(el) {
  el.innerHTML = `
    <div class="tab-panel castle-panel fade-in">
      <div class="castle-banner">
        <div class="castle-icon">🏰</div>
        <h2>영주의 성</h2>
      </div>
      <div class="castle-message">
        <p class="castle-welcome">"용감한 방랑자여, 환영하오.</p>
        <p>이 마을은 던전 근처에 세워진 전초기지이오.
        길드에서 동료를 찾고, 던전에 도전하시오."</p>
        <p class="castle-tip">💡 <strong>Tip</strong>: 먼저 <em>길드</em>에서 방랑자를 영입한 뒤, <em>던전</em>에서 모험을 시작하세요.</p>
      </div>
      <div class="castle-stats">
        <div class="stat-card"><span class="stat-value">${getState().recruitedWanderers.length}</span><span class="stat-label">영입 방랑자</span></div>
        <div class="stat-card"><span class="stat-value">${MAPS.length}</span><span class="stat-label">발견된 던전</span></div>
        <div class="stat-card"><span class="stat-value">0</span><span class="stat-label">클리어 횟수</span></div>
      </div>
    </div>
  `;
}

/* ─── Wanderers ─── */
function renderWanderers(el) {
  const state = getState();

  el.innerHTML = `
    <div class="tab-panel wanderers-panel fade-in">
      <div class="wanderers-header">
        <h2>👥 영입한 방랑자</h2>
        <p>현재 영입하여 함께하고 있는 방랑자들입니다.</p>
      </div>
      <div class="char-grid">
        ${state.recruitedWanderers.length === 0
      ? '<p class="placeholder-text">아직 영입한 방랑자가 없습니다. 길드에서 방랑자를 영입하세요.</p>'
      : state.recruitedWanderers.map((ch) => {
        const traits = ch.traits || [];
        const tierClass = `tier-${ch.tier}`;
        return `
              <div class="char-card" data-id="${ch.id}">
                <div class="char-tier ${tierClass}">${ch.tier}</div>

                <div class="char-card-header">
                  <div class="char-portrait-small">${ch.portrait}</div>
                  <div class="char-header-text">
                    <div class="char-name">${ch.name}</div>
                    <div class="char-class-hp">
                      <span class="char-class-label">${ch.classIcon} ${ch.className}</span>
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
                  ${traits.map((t) =>
          `<span class="trait-badge ${t.type}" title="${t.desc}">${t.icon || ''} ${t.name}</span>`
        ).join('')}
                </div>

                <p class="char-desc">${ch.desc}</p>

                <button class="btn-dismiss btn-town-secondary" data-id="${ch.id}">
                  방랑자 해고
                </button>
              </div>
            `;
      }).join('')
    }
      </div>
    </div>
  `;

  el.querySelectorAll('.btn-dismiss').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if (confirm('정말로 이 방랑자를 해고하시겠습니까? 해고된 방랑자는 다시 영입할 수 없습니다.')) {
        dismissWanderer(id);
        renderWanderers(el);
      }
    });
  });
}

/* ─── Guild ─── */
function renderGuild(el, isRefresh = false) {
  checkAndRefreshAll();
  const state = getState();

  // Calculate next refresh time
  const now = new Date();
  const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0);
  const timeText = formatTimeRemaining(nextHour.getTime());

  el.innerHTML = `
    <div class="tab-panel guild-panel ${isRefresh ? '' : 'fade-in'}">
      <div class="refresh-banner">
        <div class="refresh-info-main">
          <span class="refresh-icon">🕒</span>
          <span class="refresh-label">길드 목록 갱신까지:</span>
          <span class="refresh-timer">${timeText}</span>
        </div>
        <div class="refresh-hint">(매시간 정각에 새로운 방랑자가 방문합니다)</div>
      </div>
      <div class="char-grid">
         ${state.availableWanderers.map((ch) => {
    // Check if THIS SPECIFIC INSTANCE is recruited
    const isThisInstanceRecruited = state.recruitedWanderers.some(w => w === ch) || ch.isRecruited;
    const traits = ch.traits || [];
    const tierClass = `tier-${ch.tier}`;

    return `
            <div class="char-card ${isThisInstanceRecruited ? 'recruited' : ''}" data-id="${ch.id}">
              <div class="char-tier ${tierClass}">${ch.tier}</div>

              <div class="char-card-header">
                <div class="char-portrait-small">${ch.portrait}</div>
                <div class="char-header-text">
                  <div class="char-name">${ch.name}</div>
                  <div class="char-class-hp">
                    <span class="char-class-label">${ch.classIcon} ${ch.className}</span>
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
                ${traits.map((t) =>
      `<span class="trait-badge ${t.type}" title="${t.desc}">${t.icon || ''} ${t.name}</span>`
    ).join('')}
              </div>

              <p class="char-desc">${ch.desc}</p>

              <button class="btn-recruit btn-town-primary ${isThisInstanceRecruited ? 'btn-dismiss' : ''}" data-id="${ch.id}" ${isThisInstanceRecruited ? 'disabled' : ''}>
                ${isThisInstanceRecruited ? '영입됨' : '방랑자 영입'}
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
}

/* ─── Storage ─── */
function renderStorage(el) {
  const state = getState();
  const upgradeCost = state.storageMaxSlots * 50;

  el.innerHTML = `
    <div class="tab-panel storage-panel fade-in">
      <div class="storage-header">
        <div class="storage-title-group">
          <h2>📦 마을 창고</h2>
          <span class="storage-count">${state.storage.filter(s => s !== null).length} / ${state.storageMaxSlots}</span>
        </div>
        <div class="storage-actions">
          ${state.storageMaxSlots < 100
      ? `<button class="btn-upgrade btn-town-primary" id="btnUpgradeStorage">⚙️ 확장 (+10칸 / ${upgradeCost}G)</button>`
      : '<span class="max-badge">MAX</span>'
    }
        </div>
      </div>

      <div class="storage-grid">
        ${state.storage.map((slot, i) => `
          <div class="storage-slot ${slot ? '' : 'empty'}" data-index="${i}">
            ${slot ? `
              <span class="slot-emoji">${slot.emoji}</span>
              ${slot.qty > 1 ? `<span class="slot-qty">${slot.qty}</span>` : ''}
              <div class="slot-tooltip">${slot.name}<br><small>${slot.desc}</small></div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;

  const upgradeBtn = el.querySelector('#btnUpgradeStorage');
  if (upgradeBtn) {
    upgradeBtn.addEventListener('click', () => {
      if (upgradeStorage()) renderStorage(el);
    });
  }
}

/* ─── Shop ─── */
function renderShop(el, isRefresh = false) {
  checkAndRefreshAll();
  const state = getState();

  const now = new Date();
  const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0);
  const timeText = formatTimeRemaining(nextHour.getTime());

  el.innerHTML = `
    <div class="tab-panel shop-panel ${isRefresh ? '' : 'fade-in'}">
      <div class="refresh-banner">
        <div class="refresh-info-main">
          <span class="refresh-icon">🔄</span>
          <span class="refresh-label">상점 물품 갱신까지:</span>
          <span class="refresh-timer">${timeText}</span>
        </div>
        <div class="refresh-hint">(매시간 정각에 비밀 상점의 품목이 변경됩니다)</div>
      </div>

      <div class="shop-grid">
        ${state.shopInv.map((item, i) => {
    if (item === null) {
      return `<div class="shop-slot locked">
              <span class="lock-icon">🔒</span>
              <span class="lock-msg">Castle Lv.${i >= 8 ? 5 : i >= 6 ? 4 : i >= 4 ? 3 : i >= 2 ? 2 : 1}</span>
            </div>`;
    }
    return `
            <div class="shop-item-card ${item.bought ? 'bought' : ''}">
              <div class="item-visual">${item.emoji}</div>
              <div class="item-info">
                <div class="item-name">${item.name}</div>
                <div class="item-price">${item.bought ? '판매 완료' : `💰 ${item.price}`}</div>
              </div>
              <button class="btn-buy btn-town-primary" data-index="${i}" ${item.bought || state.gold < item.price ? 'disabled' : ''}>
                ${item.bought ? '완료' : '구매'}
              </button>
            </div>
          `;
  }).join('')}
      </div>
    </div>
  `;

  el.querySelectorAll('.btn-buy').forEach(btn => {
    btn.addEventListener('click', () => {
      if (buyShopItem(parseInt(btn.dataset.index))) renderShop(el);
    });
  });
}

/* ─── Mailbox ─── */
function renderMailbox(el, isRefresh = false) {
  checkAndRefreshAll();
  const state = getState();

  el.innerHTML = `
    <div class="tab-panel mailbox-panel ${isRefresh ? '' : 'fade-in'}">
      <div class="mailbox-header">
        <div class="mailbox-title-row">
          <div class="mailbox-title-group">
            <h2>✉️ 우편함</h2>
            <p>던전에서 분실했거나 지급된 물품을 확인할 수 있습니다.</p>
          </div>
          ${state.mailbox.length > 0 ? `<button class="btn-receive-all btn-town-primary" id="btnReceiveAll">📦 모두 수취</button>` : ''}
        </div>
      </div>

      <div class="mail-list">
        ${state.mailbox.length === 0
      ? '<p class="mail-empty">수신된 우편이 없습니다.</p>'
      : state.mailbox.map(mail => `
            <div class="mail-card" data-id="${mail.id}">
              <div class="mail-body">
                <div class="mail-row-top">
                  <span class="mail-subject">${mail.subject}</span>
                  <span class="mail-expiry">${mail.expiryDays === -1 ? '만료: 무제한' : `만료: ${formatTimeRemaining(mail.expiryTimestamp)}`}</span>
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
                  <button class="btn-receive-mail" data-id="${mail.id}">수취</button>
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
      if (!res.allAdded) alert('창고가 가득 차 일부 아이템을 수취하지 못했습니다.');
      renderMailbox(el);
    });
  });

  const btnAll = el.querySelector('#btnReceiveAll');
  if (btnAll) {
    btnAll.onclick = () => {
      const res = receiveAllMail();
      if (res.storageFull) {
        alert(`일부 아이템이 창고 부족으로 수취되지 않았습니다. (${res.removedCount}개 우편 수취 완료)`);
      } else {
        alert(`${res.removedCount}개의 우편을 모두 수취했습니다.`);
      }
      renderMailbox(el);
    };
  }
}

/* ─── Dungeon ─── */
function renderDungeon(el) {
  const state = getState();

  el.innerHTML = `
    <div class="tab-panel dungeon-panel fade-in">
      <div class="dungeon-header">
        <h2>🗺️ 던전 선택</h2>
        <p class="dungeon-desc">도전할 던전을 선택하고, 출전할 방랑자를 고르세요.</p>
      </div>

      <div class="dungeon-scroll-area">
          <div class="dungeon-layout">
            <!-- Dungeon list -->
            <div class="dungeon-list">
              ${MAPS.map((m) => `
                <div class="dungeon-card ${state.selectedMap?.id === m.id ? 'selected' : ''}" data-map="${m.id}">
                  <span class="dungeon-card-icon">${m.icon}</span>
                  <div class="dungeon-card-info">
                    <div class="dungeon-card-name">${m.name}</div>
                    <div class="dungeon-card-meta">Lv.${m.mapLv} · ${m.tiles}타일</div>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Dungeon detail -->
            <div class="dungeon-detail" id="dungeonDetail">
              ${state.selectedMap
      ? renderDungeonInfo(state.selectedMap)
      : '<p class="placeholder-text">← 던전을 선택하세요</p>'
    }
            </div>
          </div>

          <!-- Wanderer selection -->
          ${state.selectedMap ? renderWandererSelect(state) : ''}
      </div>

      <!-- Enter dungeon (Fixed Footer) -->
      <div class="dungeon-action-bar">
          ${state.selectedMap && state.selectedWanderer
      ? `<button class="btn-enter-dungeon" id="btnEnterDungeon">⚔️ 던전 진입</button>`
      : '<div class="dungeon-action-placeholder">던전과 방랑자를 선택하세요</div>'
    }
      </div>
    </div>
  `;

  // Dungeon card click
  el.querySelectorAll('.dungeon-card').forEach((card) => {
    card.addEventListener('click', () => {
      const map = MAPS.find((m) => m.id === card.dataset.map);
      selectMap(map);
      renderDungeon(el);
    });
  });

  // Wanderer select
  el.querySelectorAll('.wanderer-option').forEach((opt) => {
    opt.addEventListener('click', () => {
      const w = state.recruitedWanderers.find((c) => c.id === opt.dataset.id);
      selectWanderer(w);
      renderDungeon(el);
    });
  });

  // Enter dungeon
  const enterBtn = el.querySelector('#btnEnterDungeon');
  if (enterBtn) {
    enterBtn.addEventListener('click', () => {
      changeScene('dungeon', {
        map: state.selectedMap,
        wanderer: state.selectedWanderer,
      });
    });
  }
}

function renderDungeonInfo(map) {
  return `
    <div class="dungeon-info-card fade-in">
      <div class="dungeon-info-header">
        <span class="dungeon-info-icon">${map.icon}</span>
        <h3>${map.name}</h3>
        <span class="dungeon-info-en">${map.nameEn}</span>
      </div>
      <p class="dungeon-info-desc">${map.desc}</p>
      <div class="dungeon-info-stats">
        <div class="info-stat"><span class="info-stat-label">맵 레벨</span><span class="info-stat-value">Lv.${map.mapLv}</span></div>
        <div class="info-stat"><span class="info-stat-label">타일 수</span><span class="info-stat-value">${map.tiles}</span></div>
        <div class="info-stat"><span class="info-stat-label">몬스터 주사위</span><span class="info-stat-value">${map.dice.monster[0]}~${map.dice.monster[1]}</span></div>
        <div class="info-stat"><span class="info-stat-label">보물 주사위</span><span class="info-stat-value">${map.dice.treasure[0]}~${map.dice.treasure[1]}</span></div>
        <div class="info-stat"><span class="info-stat-label">이벤트 주사위</span><span class="info-stat-value">${map.dice.event[0]}~${map.dice.event[1]}</span></div>
      </div>
      <div class="dungeon-info-monsters">
        <span class="info-stat-label">등장 몬스터</span>
        <div class="monster-tags">${map.monsterPool.map((m) => `<span class="monster-tag">${m.replace('m_', '')}</span>`).join('')}</div>
      </div>
    </div>
  `;
}

function renderWandererSelect(state) {
  if (state.recruitedWanderers.length === 0) {
    return `<div class="wanderer-select"><p class="placeholder-text">⚠️ 먼저 길드에서 방랑자를 영입하세요.</p></div>`;
  }
  return `
    <div class="wanderer-select fade-in">
      <h3>🧑 출전 방랑자 선택</h3>
      <div class="wanderer-options">
        ${state.recruitedWanderers.map((w) => `
          <div class="wanderer-option ${state.selectedWanderer?.id === w.id ? 'selected' : ''}" data-id="${w.id}">
            <span class="wanderer-portrait">${w.portrait}</span>
            <span class="wanderer-name">${w.name}</span>
            <span class="wanderer-class">${w.classIcon}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

