// ─── Global Game State ───

const state = {
    /** @type {Array<object>} 영입한 방랑자 목록 */
    recruitedWanderers: [],

    /** @type {object|null} 던전에 출전할 캐릭터 */
    selectedWanderer: null,

    /** @type {object|null} 선택한 던전 맵 */
    selectedMap: null,
};

export function getState() {
    return state;
}

export function recruitWanderer(character) {
    if (!state.recruitedWanderers.find((w) => w.id === character.id)) {
        state.recruitedWanderers.push({ ...character });
    }
}

export function dismissWanderer(characterId) {
    state.recruitedWanderers = state.recruitedWanderers.filter(
        (w) => w.id !== characterId
    );
    if (state.selectedWanderer?.id === characterId) {
        state.selectedWanderer = null;
    }
}

export function selectWanderer(character) {
    state.selectedWanderer = character;
}

export function selectMap(map) {
    state.selectedMap = map;
}
