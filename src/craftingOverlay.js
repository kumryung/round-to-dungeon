// ─── Crafting Overlay ───
// In-dungeon crafting UI: shows available recipes, checks materials, crafts weapons

import { RECIPES } from './data/recipes.js';
import { WEAPONS, getWeapon, gradeColor } from './data/weapons.js';
import { ITEMS } from './data/items.js';
import { getInventory, hasMaterials, consumeMaterials, addItem, countItem } from './inventory.js';
import { refreshInlineInventory, showItemToast } from './inventoryOverlay.js';
import { t } from './i18n.js';

let overlayEl = null;

function getLocalGrade(g) {
    const map = { '일반': 'common', '영웅': 'epic', '전설': 'legendary' };
    return map[g] ? t(`grades.${map[g]}`) : g;
}

/**
 * Open the crafting panel overlay.
 */
export function openCraftingOverlay() {
    if (overlayEl) return; // Already open

    overlayEl = document.createElement('div');
    overlayEl.className = 'crafting-overlay';
    overlayEl.innerHTML = buildCraftingHTML();
    document.body.appendChild(overlayEl);

    // Fade in
    requestAnimationFrame(() => overlayEl.classList.add('crafting-visible'));

    // Event delegation
    overlayEl.addEventListener('click', handleCraftingClick);
}

/**
 * Close the crafting panel.
 */
export function closeCraftingOverlay() {
    if (!overlayEl) return;
    overlayEl.classList.remove('crafting-visible');
    setTimeout(() => {
        overlayEl?.remove();
        overlayEl = null;
    }, 300);
}

function buildCraftingHTML() {
    const gradeOrder = ['일반', '영웅', '전설'];

    const recipeCards = gradeOrder.map(grade => {
        const recipes = RECIPES.filter(r => r.grade === grade);
        if (recipes.length === 0) return '';

        return `
            <div class="craft-grade-section">
                <h3 class="craft-grade-title" style="color:${gradeColor(grade)}">${getLocalGrade(grade)}</h3>
                <div class="craft-recipe-list">
                    ${recipes.map(r => buildRecipeCard(r)).join('')}
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="crafting-panel">
            <div class="crafting-header">
                <h2>⚒️ ${t('ui.blacksmith.craft_weapon')}</h2>
                <button class="craft-close-btn" id="craftCloseBtn">✕</button>
            </div>
            <div class="crafting-body">
                ${recipeCards}
            </div>
        </div>
    `;
}

function buildRecipeCard(recipe) {
    const weapon = WEAPONS[recipe.result];
    if (!weapon) return '';

    const canCraft = hasMaterials(recipe.ingredients);

    const ingredientList = recipe.ingredients.map(ing => {
        const item = ITEMS[ing.id] || WEAPONS[ing.id];
        const have = countItem(ing.id);
        const enough = have >= ing.qty;
        return `
            <span class="craft-ingredient ${enough ? 'enough' : 'missing'}">
                ${item?.emoji || '?'} ${item?.nameKey ? t(item.nameKey) : (item?.name || ing.id)} 
                <span class="craft-ing-count">${have}/${ing.qty}</span>
            </span>
        `;
    }).join('');

    return `
        <div class="craft-recipe-card ${canCraft ? 'craftable' : 'locked'}">
            <div class="craft-result">
                <span class="craft-result-emoji">${weapon.emoji}</span>
                <div class="craft-result-info">
                    <span class="craft-result-name" style="color:${gradeColor(weapon.grade)}">${weapon.nameKey ? t(weapon.nameKey) : weapon.name}</span>
                    <span class="craft-result-stats">DMG ${weapon.dmgMin}–${weapon.dmgMax} · ${t('ui.equip.durability')} ${weapon.maxDurability}</span>
                </div>
            </div>
            <div class="craft-ingredients">${ingredientList}</div>
            <button class="craft-btn ${canCraft ? '' : 'disabled'}" 
                    data-recipe="${recipe.result}" 
                    ${canCraft ? '' : 'disabled'}>
                ${canCraft ? '⚒️ ' + t('ui.blacksmith.craft') : '🔒 ' + t('ui.blacksmith.not_enough_materials')}
            </button>
        </div>
    `;
}

function handleCraftingClick(e) {
    // Close button
    if (e.target.id === 'craftCloseBtn' || e.target.closest('#craftCloseBtn')) {
        closeCraftingOverlay();
        return;
    }

    // Craft button
    const craftBtn = e.target.closest('.craft-btn');
    if (craftBtn && !craftBtn.disabled) {
        const weaponId = craftBtn.dataset.recipe;
        craftWeapon(weaponId);
    }
}

function craftWeapon(weaponId) {
    const recipe = RECIPES.find(r => r.result === weaponId);
    if (!recipe) return;

    if (!consumeMaterials(recipe.ingredients)) return;

    const newWeapon = getWeapon(weaponId);
    const added = addItem(newWeapon);

    if (!added) {
        // Inventory full — show toast
        showItemToast('❌ ' + t('ui.blacksmith.inventory_full'));
        return;
    }

    showItemToast('⚒️ ' + t('ui.blacksmith.craft_complete', { name: newWeapon.nameKey ? t(newWeapon.nameKey) : newWeapon.name }));

    // Refresh crafting UI
    if (overlayEl) {
        const body = overlayEl.querySelector('.crafting-body');
        if (body) {
            const gradeOrder = ['일반', '영웅', '전설'];
            body.innerHTML = gradeOrder.map(grade => {
                const recipes = RECIPES.filter(r => r.grade === grade);
                if (recipes.length === 0) return '';
                return `
                    <div class="craft-grade-section">
                        <h3 class="craft-grade-title" style="color:${gradeColor(grade)}">${getLocalGrade(grade)}</h3>
                        <div class="craft-recipe-list">
                            ${recipes.map(r => buildRecipeCard(r)).join('')}
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // Refresh inventory panel
    refreshInlineInventory();
}
