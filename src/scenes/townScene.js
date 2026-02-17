// ─── Town Scene (마을씬) ───
import { changeScene } from '../sceneManager.js';
import {
  getState, recruitWanderer, dismissWanderer, selectWanderer, selectMap,
} from '../gameState.js';
import { CHARACTERS } from '../data/characters.js';
import { MAPS } from '../data/maps.js';

/* ───────── Mount ───────── */
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
        <button class="town-tab" data-tab="guild">⚔️ 길드</button>
        <button class="town-tab" data-tab="dungeon">🗺️ 던전</button>
      </nav>

      <!-- Tab content area -->
      <main class="town-main" id="townContent"></main>

      <!-- Bottom bar: recruited wanderers -->
      <footer class="town-footer">
        <div class="footer-label">👥 영입한 방랑자</div>
        <div class="footer-wanderers" id="footerWanderers">
          <span class="footer-empty">아직 영입한 방랑자가 없습니다.</span>
        </div>
      </footer>
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

  renderTab('castle');
  renderFooter();
}

export function unmount() { }

/* ───────── Tab renderers ───────── */
function renderTab(tabName) {
  const content = document.getElementById('townContent');
  if (tabName === 'castle') renderCastle(content);
  else if (tabName === 'guild') renderGuild(content);
  else if (tabName === 'dungeon') renderDungeon(content);
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

/* ─── Guild ─── */
function renderGuild(el) {
  const state = getState();
  const recruitedIds = state.recruitedWanderers.map((w) => w.id);

  el.innerHTML = `
    <div class="tab-panel guild-panel fade-in">
      <div class="guild-header">
        <h2>⚔️ 길드 — 방랑자 영입</h2>
        <p class="guild-desc">던전에 함께 할 방랑자를 선택하세요.</p>
      </div>
      <div class="char-grid">
         ${CHARACTERS.map((ch) => {
    const recruited = recruitedIds.includes(ch.id);
    const wanderer = recruited ? state.recruitedWanderers.find(w => w.id === ch.id) : ch;
    const traits = wanderer?.traits || [];
    return `
            <div class="char-card ${recruited ? 'recruited' : ''}" data-id="${ch.id}">
              <div class="char-portrait">${ch.portrait}</div>
              <div class="char-info">
                <div class="char-name">${ch.name}</div>
                <div class="char-class">${ch.classIcon} ${ch.className}</div>
                <div class="char-stats-mini">
                  <span>HP ${ch.hp}</span>
                  <span>STR ${ch.str}</span>
                  <span>AGI ${ch.agi}</span>
                  <span>SPD ${ch.spd}</span>
                </div>
                <div class="char-traits">
                  ${traits.length > 0
        ? traits.map((t) =>
          `<span class="trait-badge ${t.type}" title="${t.desc}">${t.icon || ''} ${t.name}</span>`
        ).join('')
        : '<span class="trait-badge unknown">❓ 영입 시 특성 부여</span>'
      }
                </div>
                <p class="char-desc">${ch.desc}</p>
              </div>
              <button class="btn-recruit ${recruited ? 'btn-dismiss' : ''}" data-id="${ch.id}">
                ${recruited ? '해고' : '영입'}
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
      const ch = CHARACTERS.find((c) => c.id === id);
      if (recruitedIds.includes(id)) {
        dismissWanderer(id);
      } else {
        recruitWanderer(ch);
      }
      renderGuild(el);
      renderFooter();
    });
  });
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

      <!-- Enter dungeon -->
      ${state.selectedMap && state.selectedWanderer
      ? `<button class="btn-enter-dungeon" id="btnEnterDungeon">⚔️ 던전 진입</button>`
      : ''
    }
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

/* ─── Footer (recruited wanderers bar) ─── */
function renderFooter() {
  const el = document.getElementById('footerWanderers');
  if (!el) return;
  const state = getState();
  if (state.recruitedWanderers.length === 0) {
    el.innerHTML = '<span class="footer-empty">아직 영입한 방랑자가 없습니다.</span>';
    return;
  }
  el.innerHTML = state.recruitedWanderers.map((w) => `
    <div class="footer-char">
      <span class="footer-char-portrait">${w.portrait}</span>
      <span class="footer-char-name">${w.name}</span>
      <span class="footer-char-class">${w.classIcon} ${w.className}</span>
    </div>
  `).join('');
}
