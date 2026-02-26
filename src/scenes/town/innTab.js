import { t } from '../../i18n.js';
import { getState, getInnSlotStatus, startInnRest, completeInnRest, calculateRestCost, getMaxInnSlots } from '../../gameState.js';
import { SETTINGS } from '../../data/settings.js';
import { renderBuildingHeader, attachBuildingHeaderEvents } from './buildingHeader.js';
import { showToast, formatTimeRemaining, refreshCurrencyDisplay, showConfirmModal } from './townUtils.js';

export function renderInn(container) {
    const html = `
        <div class="tab-panel inn-panel fade-in">
            ${renderBuildingHeader('inn')}
            
            <div class="inn-description">
                <p>여관에서 방랑자를 휴식시켜 잃어버린 체력과 정신력을 회복할 수 있습니다.</p>
                <p class="inn-cost-note">치료 비용: 체력 1당 <strong>${SETTINGS.inn.goldPerHp}G</strong>, 정신력 1당 <strong>${SETTINGS.inn.goldPerSanity}G</strong></p>
            </div>

            <div class="inn-slots-container" id="innSlotsContainer">
                ${renderSlots()}
            </div>
        </div>

        <!-- Wanderer Select Modal for Resting -->
        <div id="innWandererSelectModal" class="modal-overlay hidden">
            <div class="modal-content fade-in">
                <div class="modal-header">
                    <h3>휴식할 방랑자 선택</h3>
                    <button class="btn-close" id="btnInnCloseModal">×</button>
                </div>
                <div class="roster-grid" id="innWandererList"></div>
            </div>
        </div>
    `;

    container.innerHTML = html;

    attachBuildingHeaderEvents(container);
    attachInnEvents(container);
}

function renderSlots() {
    const state = getState();
    const maxSlots = getMaxInnSlots();
    // Ensure innSlots array matches current max
    while (state.innSlots.length < maxSlots) state.innSlots.push(null);
    const slots = state.innSlots.slice(0, maxSlots);
    let html = '';

    slots.forEach((slot, index) => {
        if (!slot) {
            html += `
                <div class="inn-slot empty" data-slot="${index}">
                    <div class="inn-slot-icon">🛏️</div>
                    <p>클릭하여 방랑자 배치</p>
                </div>
            `;
            return;
        }

        const status = getInnSlotStatus(index);
        if (!status || !status.wanderer) {
            // Fallback for corrupted state
            html += `<div class="inn-slot empty" data-slot="${index}"><p>데이터 오류</p></div>`;
            return;
        }

        const w = status.wanderer;
        const wName = w.nameKey ? t(w.nameKey) : (w.name || '방랑자');

        if (status.canComplete) {
            html += `
                <div class="inn-slot occupied">
                    <img src="${w.portrait}" alt="portrait" class="wanderer-portrait">
                    <div class="inn-slot-name">${wName}</div>
                    <p>치료 완료!</p>
                    <button class="btn-inn-complete" data-slot="${index}">회복 완료</button>
                </div>
            `;
        } else {
            const targetTime = Date.now() + (status.remainingSec * 1000);
            html += `
                <div class="inn-slot occupied">
                    <img src="${w.portrait}" alt="portrait" class="wanderer-portrait">
                    <div class="inn-slot-name">${wName}</div>
                    <p>치료중...</p>
                    <div class="inn-rest-timer" data-timer-type="inn" data-target="${targetTime}">
                        ${formatTimeRemaining(targetTime)}
                    </div>
                </div>
            `;
        }
    });

    return html;
}

function attachInnEvents(container) {
    const state = getState();
    const slotsContainer = document.getElementById('innSlotsContainer');
    const modal = document.getElementById('innWandererSelectModal');
    const listDiv = document.getElementById('innWandererList');
    const btnClose = document.getElementById('btnInnCloseModal');
    let activeSlotIndex = null;

    // slot click (open select modal)
    slotsContainer.querySelectorAll('.inn-slot.empty').forEach(slotEl => {
        slotEl.addEventListener('click', () => {
            activeSlotIndex = parseInt(slotEl.dataset.slot);
            openWandererSelectModal();
        });
    });

    // complete rest button
    slotsContainer.querySelectorAll('.btn-inn-complete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.dataset.slot);
            if (completeInnRest(index)) {
                showToast("방랑자가 기력을 모두 회복했습니다!");
                // Force re-render of Inn tab
                const tabBtn = document.querySelector(`.town-tab[data-tab="inn"]`);
                if (tabBtn) tabBtn.click();
            }
        });
    });

    if (btnClose) {
        btnClose.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }

    function openWandererSelectModal() {
        listDiv.innerHTML = '';

        let availableCount = 0;

        state.recruitedWanderers.forEach(w => {
            // Cannot rest if dead, exploring, or already resting
            if (w.status === 'dead' || w.status === 'exploring' || w.status === 'resting') return;

            const costInfo = calculateRestCost(w.id);
            if (!costInfo) return; // Full HP/Sanity

            availableCount++;

            const wName = w.nameKey ? t(w.nameKey) : (w.name || '방랑자');
            const card = document.createElement('div');
            card.className = 'wanderer-card';

            card.innerHTML = `
                <div class="roster-portrait-header">
                    <span class="class-icon">${w.classIcon}</span>
                    <span class="roster-level">Lv.${w.level || 1}</span>
                </div>
                <img src="${w.portrait}" alt="portrait" class="roster-portrait">
                <div class="roster-name">${wName}</div>
                <div class="roster-stats">
                    <div class="stat-hp">❤️ ${w.curHp} / ${50 + ((w.vit || 0) * 5)}</div>
                    <div class="stat-sp">🧠 ${w.curSanity} / ${SETTINGS.maxSanity}</div>
                </div>
                <div class="rest-estimate" style="margin-top:8px; font-size:12px; color:#e74c3c;">
                    비용: ${costInfo.goldCost}G<br/>
                    시간: ${Math.ceil(costInfo.durationSec / 60)}분 ${costInfo.durationSec % 60}초
                </div>
            `;

            card.addEventListener('click', () => {
                if (state.gold < costInfo.goldCost) {
                    showToast("골드가 부족하여 치료할 수 없습니다.");
                    return;
                }

                showConfirmModal("방랑자 휴식", `${wName}의 치료를 시작하시겠습니까?\n\n비용: ${costInfo.goldCost}G\n시간: ${Math.ceil(costInfo.durationSec / 60)}분 ${costInfo.durationSec % 60}초`, () => {
                    if (startInnRest(activeSlotIndex, w.id)) {
                        showToast(`${wName}의 치료를 시작합니다.`);
                        refreshCurrencyDisplay();
                        modal.classList.add('hidden');
                        // re-render Tab
                        const tabBtn = document.querySelector(`.town-tab[data-tab="inn"]`);
                        if (tabBtn) tabBtn.click();
                    }
                });
            });

            listDiv.appendChild(card);
        });

        if (availableCount === 0) {
            listDiv.innerHTML = `<p style="text-align:center; padding:20px; color:#aaa;">치료가 필요한 방랑자가 없습니다.</p>`;
        }

        modal.classList.remove('hidden');
    }
}
