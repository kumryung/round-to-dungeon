import { t } from '../../i18n.js';
import { getState, getBuildingLevel, getBuildingUpgradeStatus, startBuildingUpgrade, completeBuildingUpgrade } from '../../gameState.js';
import { SETTINGS } from '../../data/settings.js';
import { refreshCurrencyDisplay, showToast, showConfirmModal, formatTimeRemaining } from './townUtils.js';

export function renderBuildingHeader(buildingId, containerElement) {
    const level = getBuildingLevel(buildingId);
    const status = getBuildingUpgradeStatus(buildingId);
    const maxLevel = SETTINGS.buildings.maxLevel;

    // Get translations
    const titleKey = `ui.town.tabs.${buildingId}`;
    const title = t(titleKey); // Assumes we have "ui.town.tabs.castle" etc.

    const html = `
        <div class="building-header" id="buildingHeader-${buildingId}">
            <div class="building-header-info">
                <h3 class="building-title">${title} <span class="building-level">Lv.${level}</span></h3>
            </div>
            <div class="building-header-action" id="buildingAction-${buildingId}">
                ${renderBuildingActionButton(buildingId, level, maxLevel, status)}
            </div>
        </div>
    `;

    // Only render the HTML initially, we'll attach handlers in a separate function
    return html;
}

function renderBuildingActionButton(buildingId, level, maxLevel, status) {
    if (level >= maxLevel) {
        return `<button class="btn-building-max" disabled>Max Level</button>`;
    }

    if (status.isUpgrading) {
        if (status.canComplete) {
            return `<button class="btn-building-complete" data-action="complete-upgrade" data-building="${buildingId}">레벨업 완료!</button>`;
        } else {
            return `
                <div class="building-upgrade-progress">
                    <span class="upgrade-timer" data-timer-type="building" data-target="${Date.now() + (status.remainingSec * 1000)}">
                        ${formatTimeRemaining(Date.now() + (status.remainingSec * 1000))}
                    </span>
                </div>
            `;
        }
    }

    // Ready to start upgrade
    const cost = SETTINGS.buildings.upgradeCosts[level - 1];
    let costText = `${cost.gold}G`;
    if (cost.materials) {
        costText += ` + 재료`;
    }
    return `<button class="btn-building-upgrade" data-action="start-upgrade" data-building="${buildingId}">레벨업 진행 (${costText})</button>`;
}

export function attachBuildingHeaderEvents(containerElement) {
    if (!containerElement) return;

    // Start Upgrade Button
    containerElement.querySelectorAll('[data-action="start-upgrade"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const buildingId = e.currentTarget.dataset.building;
            const level = getBuildingLevel(buildingId);
            const cost = SETTINGS.buildings.upgradeCosts[level - 1];

            if (!cost) return;

            // Optional: Build a more detailed confirmation message with actual material names
            let msg = `성장 비용: ${cost.gold}G\n소요 시간: ${cost.timeSec}초\n\n레벨업을 진행하시겠습니까?`;

            showConfirmModal("건물 레벨업", msg, () => {
                if (startBuildingUpgrade(buildingId)) {
                    showToast("레벨업을 시작했습니다!");
                    refreshCurrencyDisplay();
                    // Re-render the tab
                    const tabBtn = document.querySelector(`.town-tab[data-tab="${buildingId === 'lodge' ? 'wanderers' : buildingId}"]`);
                    if (tabBtn) tabBtn.click();
                    else {
                        // Fallback trigger click on active tab
                        const active = document.querySelector('.town-tab.active');
                        if (active) active.click();
                    }
                } else {
                    showToast("골드 혹은 재료가 부족합니다.");
                }
            });
        });
    });

    // Complete Upgrade Button
    containerElement.querySelectorAll('[data-action="complete-upgrade"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const buildingId = e.currentTarget.dataset.building;
            if (completeBuildingUpgrade(buildingId)) {
                showToast("건물 레벨업이 완료되었습니다!");
                // Force re-render of current tab
                const active = document.querySelector('.town-tab.active');
                if (active) active.click();
            }
        });
    });
}
