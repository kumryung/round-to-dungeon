// ─── Dungeon Events Data ───
// type: 'immediate' | 'interactive'
// outcome fields: hpDmg, hpHeal, sanityDmg, sanityHeal, loot(fn), status, log
// status: { id, icon, label, duration (turns, Infinity=permanent), hpTick, sanityTick, statMod:{} }

// ── Status Blueprints ──
export const STATUS = {
    burn: { id: 'burn', icon: '🔥', labelKey: 'status.burn', duration: 10, hpTick: -2, sanityTick: 0, statMod: {} },
    poison: { id: 'poison', icon: '☠️', labelKey: 'status.poison', duration: 15, hpTick: -1, sanityTick: -1, statMod: {} },
    bleed: { id: 'bleed', icon: '🩸', labelKey: 'status.bleed', duration: 5, hpTick: -3, sanityTick: 0, statMod: {} },
    regen: { id: 'regen', icon: '💚', labelKey: 'status.regen', duration: 20, hpTick: 2, sanityTick: 0, statMod: {} },
    cursed: { id: 'cursed', icon: '💀', labelKey: 'status.cursed', duration: Infinity, hpTick: 0, sanityTick: 0, statMod: { atkMul: -0.1, maxHpMul: -0.1 } },
    blessed: { id: 'blessed', icon: '✨', labelKey: 'status.blessed', duration: Infinity, hpTick: 0, sanityTick: 0, statMod: { hitMod: 10, evadeMod: 10 } },
    crippled: { id: 'crippled', icon: '🐌', labelKey: 'status.crippled', duration: 10, hpTick: 0, sanityTick: 0, statMod: { spdMul: -0.4 } },
    doom: { id: 'doom', icon: '🌑', labelKey: 'status.doom', duration: Infinity, hpTick: 0, sanityTick: -1, statMod: {} },
    daze: { id: 'daze', icon: '💫', labelKey: 'status.daze', duration: 5, hpTick: 0, sanityTick: 0, statMod: { evadeMul: -1.0 } },
};

function s(id, overrides = {}) { return { ...STATUS[id], ...overrides }; }

// ── Helper: random from weighted array ──
function weightedPick(outcomes) {
    const total = outcomes.reduce((a, o) => a + o.weight, 0);
    let r = Math.random() * total;
    for (const o of outcomes) { r -= o.weight; if (r <= 0) return o; }
    return outcomes[outcomes.length - 1];
}

// ── GENERAL EVENTS (immediate & interactive) ──
export const EVENTS_GENERAL = [
    // ─ Immediate positives ─
    {
        id: 'heal_spring', type: 'immediate', emoji: '⛲', nameKey: 'events.heal_spring.name', descKey: 'events.heal_spring.desc',
        outcomes: [
            { weight: 60, hpHeal: 30, logKey: 'events.heal_spring.great' },
            { weight: 30, hpHeal: 15, sanityHeal: 10, logKey: 'events.heal_spring.good' },
            { weight: 10, status: s('poison'), logKey: 'events.heal_spring.poison' }
        ]
    },
    {
        id: 'sanity_shrine', type: 'immediate', emoji: '🕯️', nameKey: 'events.sanity_shrine.name', descKey: 'events.sanity_shrine.desc',
        outcomes: [
            { weight: 70, sanityHeal: 20, logKey: 'events.sanity_shrine.good' },
            { weight: 20, sanityHeal: 10, status: s('blessed'), logKey: 'events.sanity_shrine.blessed' },
            { weight: 10, sanityDmg: 10, status: s('cursed'), logKey: 'events.sanity_shrine.cursed' }
        ]
    },
    {
        id: 'rest_spot', type: 'immediate', emoji: '🏕️', nameKey: 'events.rest_spot.name', descKey: 'events.rest_spot.desc',
        outcomes: [
            { weight: 80, hpHeal: 15, sanityHeal: 10, logKey: 'events.rest_spot.rest' },
            { weight: 20, forceEncounter: true, logKey: 'events.rest_spot.ambush' }
        ]
    },
    {
        id: 'treasure_stash', type: 'immediate', emoji: '🎁', nameKey: 'events.treasure_stash.name', descKey: 'events.treasure_stash.desc',
        outcomes: [
            { weight: 50, lootChest: true, logKey: 'events.treasure_stash.chest' },
            { weight: 30, lootMaterial: true, logKey: 'events.treasure_stash.material' },
            { weight: 20, hpDmg: 10, logKey: 'events.treasure_stash.trap' }
        ]
    },
    // ─ Immediate negatives ─
    {
        id: 'trap_pit', type: 'immediate', emoji: '🕳️', nameKey: 'events.trap_pit.name', descKey: 'events.trap_pit.desc',
        outcomes: [
            { weight: 60, hpDmg: 10, logKey: 'events.trap_pit.fall' },
            { weight: 30, hpDmg: 5, status: s('crippled', { icon: '🦴', labelKey: 'status.fracture' }), logKey: 'events.trap_pit.fracture' },
            { weight: 10, hpDmg: 20, logKey: 'events.trap_pit.deep' }
        ]
    },
    {
        id: 'dark_corner', type: 'immediate', emoji: '🌑', nameKey: 'events.dark_corner.name', descKey: 'events.dark_corner.desc',
        outcomes: [
            { weight: 50, sanityDmg: 5, logKey: 'events.dark_corner.spooky' },
            { weight: 30, sanityDmg: 10, logKey: 'events.dark_corner.terror' },
            { weight: 20, logKey: 'events.dark_corner.nothing' }
        ]
    },
    // ─ Interactive: Grave ─
    {
        id: 'e_grave', type: 'interactive', emoji: '🪦', nameKey: 'events.grave.name', descKey: 'events.grave.desc',
        choices: [
            {
                labelKey: 'events.grave.choice_shovel', reqItem: 't_shovel', consumeItem: true,
                outcomes: [
                    { weight: 40, lootEpic: true, logKey: 'events.grave.shovel_epic' },
                    { weight: 40, lootChest: true, logKey: 'events.grave.shovel_good' },
                    { weight: 20, lootMaterial: true, logKey: 'events.grave.shovel_dust' }
                ]
            },
            {
                labelKey: 'events.grave.choice_dig',
                outcomes: [
                    { weight: 20, lootChest: true, logKey: 'events.grave.dig_ok' },
                    { weight: 30, hpDmg: 5, lootMaterial: true, logKey: 'events.grave.dig_scratch' },
                    { weight: 30, hpDmg: 10, sanityDmg: 5, logKey: 'events.grave.dig_curse' },
                    { weight: 20, status: s('cursed'), logKey: 'events.grave.dig_haunt' }
                ]
            },
            {
                labelKey: 'events.grave.choice_skip',
                outcomes: [
                    { weight: 90, logKey: 'events.grave.skip_ok' },
                    { weight: 10, sanityDmg: 3, logKey: 'events.grave.skip_chill' }
                ]
            },
        ]
    },
    // ─ Interactive: Eldritch Altar ─
    {
        id: 'e_altar', type: 'interactive', emoji: '🗿', nameKey: 'events.altar.name', descKey: 'events.altar.desc',
        choices: [
            {
                labelKey: 'events.altar.choice_holy', reqItem: 't_holywater', consumeItem: true,
                outcomes: [
                    { weight: 70, sanityHeal: 30, status: s('blessed'), logKey: 'events.altar.holy_great' },
                    { weight: 30, sanityHeal: 15, logKey: 'events.altar.holy_good' }
                ]
            },
            {
                labelKey: 'events.altar.choice_blood', reqHp: { min: 20, cost: 15 },
                outcomes: [
                    { weight: 40, lootEpic: true, status: s('regen'), logKey: 'events.altar.blood_epic' },
                    { weight: 40, lootChest: true, logKey: 'events.altar.blood_good' },
                    { weight: 20, status: s('cursed'), logKey: 'events.altar.blood_curse' }
                ]
            },
            {
                labelKey: 'events.altar.choice_skip',
                outcomes: [
                    { weight: 80, logKey: 'events.altar.skip_ok' },
                    { weight: 20, sanityDmg: 5, logKey: 'events.altar.skip_whisper' }
                ]
            },
        ]
    },
    // ─ Interactive: Mushroom Patch ─
    {
        id: 'e_mushroom', type: 'interactive', emoji: '🍄', nameKey: 'events.mushroom.name', descKey: 'events.mushroom.desc',
        choices: [
            {
                labelKey: 'events.mushroom.identify', reqTrait: 't_pos_survivalist',
                outcomes: [
                    { weight: 80, lootItem: 'c_herb', hpHeal: 20, logKey: 'events.mushroom.identify_good' },
                    { weight: 20, lootMultiple: 2, logKey: 'events.mushroom.identify_great' }
                ]
            },
            {
                labelKey: 'events.mushroom.eat',
                outcomes: [
                    { weight: 30, hpHeal: 40, logKey: 'events.mushroom.eat_heal' },
                    { weight: 30, sanityHeal: 30, logKey: 'events.mushroom.eat_trip' },
                    { weight: 20, hpDmg: 15, status: s('poison'), logKey: 'events.mushroom.eat_poison' },
                    { weight: 20, sanityDmg: 20, status: s('daze'), logKey: 'events.mushroom.eat_badtrip' }
                ]
            },
            {
                labelKey: 'events.mushroom.skip',
                outcomes: [
                    { weight: 100, logKey: 'events.mushroom.skip' }
                ]
            },
        ]
    },
    // ─ Interactive: Anvil ─
    {
        id: 'e_anvil', type: 'interactive', emoji: '⚒️', nameKey: 'events.anvil.name', descKey: 'events.anvil.desc',
        choices: [
            {
                labelKey: 'events.anvil.tool', reqItemType: 'material_ore', consumeItem: true, repairWeapon: true,
                outcomes: [
                    { weight: 70, hpHeal: 10, logKey: 'events.anvil.tool_great' },
                    { weight: 30, logKey: 'events.anvil.tool_good' }
                ]
            },
            {
                labelKey: 'events.anvil.repair', repairWeapon: true,
                outcomes: [
                    { weight: 50, sanityDmg: 10, hpDmg: 5, logKey: 'events.anvil.repair_ok' },
                    { weight: 30, sanityDmg: 15, status: s('bleed'), logKey: 'events.anvil.repair_hurt' },
                    { weight: 20, sanityDmg: 20, logKey: 'events.anvil.repair_tired' }
                ]
            },
            {
                labelKey: 'events.anvil.skip',
                outcomes: [
                    { weight: 100, logKey: 'events.anvil.skip' }
                ]
            },
        ]
    },
    // ─ Interactive: Corpse ─
    {
        id: 'e_corpse', type: 'interactive', emoji: '💀', nameKey: 'events.corpse.name', descKey: 'events.corpse.desc',
        choices: [
            {
                labelKey: 'events.corpse.bury', reqItem: 't_shovel', consumeItem: true,
                outcomes: [
                    { weight: 80, sanityHeal: 20, status: s('blessed'), logKey: 'events.corpse.bury_good' },
                    { weight: 20, lootEpic: true, logKey: 'events.corpse.bury_reward' }
                ]
            },
            {
                labelKey: 'events.corpse.search',
                outcomes: [
                    { weight: 40, lootChest: true, logKey: 'events.corpse.search_ok' },
                    { weight: 20, lootMaterial: true, logKey: 'events.corpse.search_poor' },
                    { weight: 30, hpDmg: 15, sanityDmg: 8, logKey: 'events.corpse.search_trap' },
                    { weight: 10, status: s('cursed'), logKey: 'events.corpse.search_curse' }
                ]
            },
            {
                labelKey: 'events.corpse.skip',
                outcomes: [
                    { weight: 90, logKey: 'events.corpse.skip_ok' },
                    { weight: 10, sanityDmg: 5, logKey: 'events.corpse.skip_stench' }
                ]
            },
        ]
    },
    // ─ Interactive: Goblin Peddler ─
    {
        id: 'e_goblin_peddler', type: 'interactive', emoji: '🧌', nameKey: 'events.goblin_peddler.name', descKey: 'events.goblin_peddler.desc',
        choices: [
            {
                labelKey: 'events.goblin_peddler.trade', reqItemType: 'material', consumeItem: true,
                outcomes: [
                    { weight: 60, lootChest: true, logKey: 'events.goblin_peddler.trade_ok' },
                    { weight: 30, lootGold: 150, logKey: 'events.goblin_peddler.trade_gold' },
                    { weight: 10, lootEpic: true, logKey: 'events.goblin_peddler.trade_epic' }
                ]
            },
            {
                labelKey: 'events.goblin_peddler.attack',
                outcomes: [
                    { weight: 30, lootMultiple: 3, status: s('cursed'), logKey: 'events.goblin_peddler.attack_ok' },
                    { weight: 40, hpDmg: 20, status: s('bleed'), logKey: 'events.goblin_peddler.attack_fail' },
                    { weight: 30, forceEncounter: true, logKey: 'events.goblin_peddler.attack_ambush' }
                ]
            },
            {
                labelKey: 'events.goblin_peddler.skip',
                outcomes: [
                    { weight: 100, logKey: 'events.goblin_peddler.skip' }
                ]
            },
        ]
    },
    // ─ Interactive: Weeping Statue ─
    {
        id: 'e_weeping_statue', type: 'interactive', emoji: '😢', nameKey: 'events.weeping_statue.name', descKey: 'events.weeping_statue.desc',
        choices: [
            {
                labelKey: 'events.weeping_statue.tend', reqItem: 'c_bandage', consumeItem: true,
                outcomes: [
                    { weight: 70, status: s('regen', { duration: Infinity }), logKey: 'events.weeping_statue.tend_ok' },
                    { weight: 30, status: s('blessed', { duration: Infinity }), sanityHeal: 20, logKey: 'events.weeping_statue.tend_great' }
                ]
            },
            {
                labelKey: 'events.weeping_statue.comfort', reqSanity: { min: 30, cost: 20 },
                outcomes: [
                    { weight: 50, lootEpic: true, logKey: 'events.weeping_statue.comfort_ok' },
                    { weight: 30, hpHealPct: 1.0, logKey: 'events.weeping_statue.comfort_heal' },
                    { weight: 20, status: s('cursed'), logKey: 'events.weeping_statue.comfort_curse' }
                ]
            },
            {
                labelKey: 'events.weeping_statue.skip',
                outcomes: [
                    { weight: 80, logKey: 'events.weeping_statue.skip_ok' },
                    { weight: 20, sanityDmg: 10, logKey: 'events.weeping_statue.skip_sad' }
                ]
            },
        ]
    },
    // ─ Interactive: Cauldron ─
    {
        id: 'e_cauldron', type: 'interactive', emoji: '🫕', nameKey: 'events.cauldron.name', descKey: 'events.cauldron.desc',
        choices: [
            {
                labelKey: 'events.cauldron.add_material', reqItemType: 'material', consumeItem: true,
                outcomes: [
                    { weight: 40, lootChest: true, logKey: 'events.cauldron.brew_ok' },
                    { weight: 30, lootEpic: true, logKey: 'events.cauldron.brew_great' },
                    { weight: 20, hpDmg: 15, sanityDmg: 10, status: s('burn'), logKey: 'events.cauldron.explode' },
                    { weight: 10, status: s('poison'), logKey: 'events.cauldron.toxic' }
                ]
            },
            {
                labelKey: 'events.cauldron.drink',
                outcomes: [
                    { weight: 30, hpHealPct: 1.0, sanityHealPct: 1.0, logKey: 'events.cauldron.drink_heal' },
                    { weight: 30, status: s('regen'), logKey: 'events.cauldron.drink_regen' },
                    { weight: 20, status: s('poison', { duration: 20 }), hpDmg: 10, logKey: 'events.cauldron.drink_poison' },
                    { weight: 20, status: s('daze'), sanityDmg: 20, logKey: 'events.cauldron.drink_daze' }
                ]
            },
            {
                labelKey: 'events.cauldron.skip',
                outcomes: [
                    { weight: 100, logKey: 'events.cauldron.skip' }
                ]
            },
        ]
    },
    // ─ Interactive: Enchanted Mirror ─
    {
        id: 'e_mirror', type: 'interactive', emoji: '🪞', nameKey: 'events.mirror.name', descKey: 'events.mirror.desc',
        choices: [
            {
                labelKey: 'events.mirror.gaze',
                outcomes: [
                    { weight: 40, xpGain: 200, sanityDmg: 30, logKey: 'events.mirror.gaze_wisdom' },
                    { weight: 30, status: s('blessed'), sanityDmg: 15, logKey: 'events.mirror.gaze_bless' },
                    { weight: 30, status: s('cursed'), sanityDmg: 40, logKey: 'events.mirror.gaze_curse' }
                ]
            },
            {
                labelKey: 'events.mirror.smash', repairWeaponDmg: 10,
                outcomes: [
                    { weight: 50, lootMaterial: true, logKey: 'events.mirror.smash_ok' },
                    { weight: 30, lootEpic: true, hpDmg: 10, status: s('bleed'), logKey: 'events.mirror.smash_shard' },
                    { weight: 20, status: s('doom'), logKey: 'events.mirror.smash_doom' }
                ]
            },
            {
                labelKey: 'events.mirror.skip',
                outcomes: [
                    { weight: 90, logKey: 'events.mirror.skip_ok' },
                    { weight: 10, sanityDmg: 5, logKey: 'events.mirror.skip_glance' }
                ]
            },
        ]
    },
    // ─ Interactive: Slime Pool ─
    {
        id: 'e_slime_pool', type: 'interactive', emoji: '🟢', nameKey: 'events.slime_pool.name', descKey: 'events.slime_pool.desc',
        choices: [
            {
                labelKey: 'events.slime_pool.tool', reqItemType: 'material_wood', consumeItem: true,
                outcomes: [
                    { weight: 80, lootGold: 120, logKey: 'events.slime_pool.tool_ok' },
                    { weight: 20, lootChest: true, logKey: 'events.slime_pool.tool_great' }
                ]
            },
            {
                labelKey: 'events.slime_pool.reach_in',
                outcomes: [
                    { weight: 40, hpDmg: 15, lootGold: 100, logKey: 'events.slime_pool.reach_ok' },
                    { weight: 30, hpDmg: 10, status: s('crippled'), logKey: 'events.slime_pool.reach_sink' },
                    { weight: 20, status: s('poison'), logKey: 'events.slime_pool.reach_toxic' },
                    { weight: 10, forceEncounter: true, logKey: 'events.slime_pool.reach_ambush' }
                ]
            },
            {
                labelKey: 'events.slime_pool.skip',
                outcomes: [
                    { weight: 100, logKey: 'events.slime_pool.skip' }
                ]
            },
        ]
    },
    // ─ Interactive: Bandit Cache ─
    {
        id: 'e_bandit_cache', type: 'interactive', emoji: '🗝️', nameKey: 'events.bandit_cache.name', descKey: 'events.bandit_cache.desc',
        choices: [
            {
                labelKey: 'events.bandit_cache.key', reqItem: 't_key', consumeItem: true,
                outcomes: [
                    { weight: 60, lootGold: 250, logKey: 'events.bandit_cache.key_ok' },
                    { weight: 40, lootGold: 100, lootChest: true, logKey: 'events.bandit_cache.key_great' }
                ]
            },
            {
                labelKey: 'events.bandit_cache.force',
                outcomes: [
                    { weight: 30, lootGold: 150, logKey: 'events.bandit_cache.force_ok' },
                    { weight: 30, status: s('poison'), hpDmg: 15, logKey: 'events.bandit_cache.trap_poison' },
                    { weight: 20, hpDmg: 20, status: s('bleed'), logKey: 'events.bandit_cache.trap_dart' },
                    { weight: 20, forceEncounter: true, logKey: 'events.bandit_cache.ambush' }
                ]
            },
            {
                labelKey: 'events.bandit_cache.skip',
                outcomes: [
                    { weight: 100, logKey: 'events.bandit_cache.skip' }
                ]
            },
        ]
    },
    // ─ Interactive: Injured Adventurer ─
    {
        id: 'e_injured_adv', type: 'interactive', emoji: '🤕', nameKey: 'events.injured_adv.name', descKey: 'events.injured_adv.desc',
        choices: [
            {
                labelKey: 'events.injured_adv.heal', reqItem: 'c_bandage', consumeItem: true,
                outcomes: [
                    { weight: 60, lootGold: 150, lootChest: true, logKey: 'events.injured_adv.heal_ok' },
                    { weight: 20, lootEpic: true, logKey: 'events.injured_adv.heal_epic' },
                    { weight: 20, status: s('blessed'), sanityHeal: 20, logKey: 'events.injured_adv.heal_bless' }
                ]
            },
            {
                labelKey: 'events.injured_adv.rob',
                outcomes: [
                    { weight: 40, lootGold: 80, sanityDmg: 20, logKey: 'events.injured_adv.rob_ok' },
                    { weight: 30, hpDmg: 15, sanityDmg: 15, status: s('cursed'), logKey: 'events.injured_adv.rob_curse' },
                    { weight: 30, forceEncounter: true, logKey: 'events.injured_adv.rob_ambush' }
                ]
            },
            {
                labelKey: 'events.injured_adv.ignore',
                outcomes: [
                    { weight: 80, sanityDmg: 10, logKey: 'events.injured_adv.ignore_guilt' },
                    { weight: 20, logKey: 'events.injured_adv.ignore_cold' }
                ]
            },
        ]
    },
    // ─ Interactive: Campfire ─
    {
        id: 'e_campfire', type: 'interactive', emoji: '🔥', nameKey: 'events.campfire.name', descKey: 'events.campfire.desc',
        choices: [
            {
                labelKey: 'events.campfire.rest', reqItemType: 'material_wood', consumeItem: true,
                outcomes: [
                    { weight: 70, hpHealPct: 0.5, sanityHeal: 20, logKey: 'events.campfire.rest_ok' },
                    { weight: 30, hpHealPct: 0.8, sanityHeal: 40, status: s('regen'), logKey: 'events.campfire.rest_great' }
                ]
            },
            {
                labelKey: 'events.campfire.search',
                outcomes: [
                    { weight: 40, lootChest: true, logKey: 'events.campfire.scavenge_ok' },
                    { weight: 30, lootMaterial: true, logKey: 'events.campfire.scavenge_poor' },
                    { weight: 20, status: s('burn'), hpDmg: 5, logKey: 'events.campfire.scavenge_burn' },
                    { weight: 10, logKey: 'events.campfire.empty' }
                ]
            },
            {
                labelKey: 'events.campfire.skip',
                outcomes: [
                    { weight: 100, logKey: 'events.campfire.skip' }
                ]
            },
        ]
    },
    // ─ Interactive: Cursed Armament ─
    {
        id: 'e_cursed_arm', type: 'interactive', emoji: '⚔️', nameKey: 'events.cursed_arm.name', descKey: 'events.cursed_arm.desc',
        choices: [
            {
                labelKey: 'events.cursed_arm.purify', reqItem: 't_holywater', consumeItem: true,
                outcomes: [
                    { weight: 60, lootEpic: true, logKey: 'events.cursed_arm.purify_ok' },
                    { weight: 40, lootChest: true, logKey: 'events.cursed_arm.purify_good' }
                ]
            },
            {
                labelKey: 'events.cursed_arm.touch', reqHp: { min: 20, cost: 10 },
                outcomes: [
                    { weight: 40, status: s('doom'), xpGain: 100, logKey: 'events.cursed_arm.touch_doom' },
                    { weight: 30, status: s('cursed'), xpGain: 50, logKey: 'events.cursed_arm.touch_curse' },
                    { weight: 30, forceEncounter: true, logKey: 'events.cursed_arm.touch_ambush' }
                ]
            },
            {
                labelKey: 'events.cursed_arm.skip',
                outcomes: [
                    { weight: 100, logKey: 'events.cursed_arm.skip' }
                ]
            },
        ]
    },
    // ─ Interactive: Tome ─
    {
        id: 'e_tome', type: 'interactive', emoji: '📕', nameKey: 'events.tome.name', descKey: 'events.tome.desc',
        choices: [
            {
                labelKey: 'events.tome.read_careful', reqTrait: 't_pos_calm_mind',
                outcomes: [
                    { weight: 70, xpGain: 300, logKey: 'events.tome.read_careful_ok' },
                    { weight: 30, xpGain: 150, sanityDmg: 10, logKey: 'events.tome.read_careful_good' }
                ]
            },
            {
                labelKey: 'events.tome.read',
                outcomes: [
                    { weight: 40, xpGain: 200, logKey: 'events.tome.read_ok' },
                    { weight: 30, sanityDmg: 25, logKey: 'events.tome.read_fail' },
                    { weight: 20, sanityDmg: 40, status: s('daze'), logKey: 'events.tome.read_madness' },
                    { weight: 10, xpGain: 400, sanityDmg: 50, logKey: 'events.tome.read_enlighten' }
                ]
            },
            {
                labelKey: 'events.tome.skip',
                outcomes: [
                    { weight: 100, logKey: 'events.tome.skip' }
                ]
            },
        ]
    },
    // ─ Interactive: Mystic Well ─
    {
        id: 'e_well', type: 'interactive', emoji: '🪣', nameKey: 'events.well.name', descKey: 'events.well.desc',
        choices: [
            {
                labelKey: 'events.well.purify', reqItem: 't_holywater', consumeItem: true,
                outcomes: [
                    { weight: 100, hpHealPct: 1.0, sanityHealPct: 1.0, status: s('blessed'), logKey: 'events.well.purify_ok' }
                ]
            },
            {
                labelKey: 'events.well.drink',
                outcomes: [
                    { weight: 30, hpHealPct: 1.0, sanityHeal: 30, logKey: 'events.well.drink_ok' },
                    { weight: 30, status: s('regen'), logKey: 'events.well.drink_regen' },
                    { weight: 20, hpDmgPct: 0.3, status: s('poison'), logKey: 'events.well.drink_bad' },
                    { weight: 20, sanityDmg: 20, status: s('cursed'), logKey: 'events.well.drink_curse' }
                ]
            },
            {
                labelKey: 'events.well.skip',
                outcomes: [
                    { weight: 100, logKey: 'events.well.skip' }
                ]
            },
        ]
    },
    // ─ Interactive: Idol ─
    {
        id: 'e_idol', type: 'interactive', emoji: '🗿', nameKey: 'events.idol.name', descKey: 'events.idol.desc',
        choices: [
            {
                labelKey: 'events.idol.offer', reqItemType: 'material_mana', consumeItem: true,
                outcomes: [
                    { weight: 60, lootEpic: true, logKey: 'events.idol.offer_epic' },
                    { weight: 40, lootChest: true, logKey: 'events.idol.offer_ok' }
                ]
            },
            {
                labelKey: 'events.idol.pray',
                outcomes: [
                    { weight: 40, xpGain: 150, sanityDmg: 10, logKey: 'events.idol.pray_ok' },
                    { weight: 30, status: s('blessed'), sanityDmg: 20, logKey: 'events.idol.pray_bless' },
                    { weight: 20, xpGain: 300, sanityDmg: 40, logKey: 'events.idol.pray_great' },
                    { weight: 10, status: s('doom'), logKey: 'events.idol.pray_doom' }
                ]
            },
            {
                labelKey: 'events.idol.skip',
                outcomes: [
                    { weight: 100, logKey: 'events.idol.skip' }
                ]
            },
        ]
    },
    // ─ Interactive: Cobweb ─
    {
        id: 'e_cobweb', type: 'interactive', emoji: '🕸️', nameKey: 'events.cobweb.name', descKey: 'events.cobweb.desc',
        choices: [
            {
                labelKey: 'events.cobweb.torch', reqItem: 't_torch', consumeItem: true,
                outcomes: [
                    { weight: 60, lootChest: true, logKey: 'events.cobweb.torch_ok' },
                    { weight: 40, lootMaterial: true, logKey: 'events.cobweb.torch_dust' }
                ]
            },
            {
                labelKey: 'events.cobweb.slash', repairWeaponDmg: 5,
                outcomes: [
                    { weight: 30, lootMaterial: true, logKey: 'events.cobweb.slash_ok' },
                    { weight: 40, status: s('poison'), hpDmg: 10, logKey: 'events.cobweb.slash_spider' },
                    { weight: 30, status: s('crippled'), logKey: 'events.cobweb.slash_stuck' }
                ]
            },
            {
                labelKey: 'events.cobweb.skip',
                outcomes: [
                    { weight: 100, logKey: 'events.cobweb.skip' }
                ]
            },
        ]
    },
    // ─ Interactive: Wandering Soul ─
    {
        id: 'e_soul', type: 'interactive', emoji: '👻', nameKey: 'events.soul.name', descKey: 'events.soul.desc',
        choices: [
            {
                labelKey: 'events.soul.holy', reqItem: 't_holywater', consumeItem: true,
                outcomes: [
                    { weight: 60, sanityHeal: 30, status: s('blessed'), logKey: 'events.soul.holy_ok' },
                    { weight: 40, lootEpic: true, logKey: 'events.soul.holy_thanks' }
                ]
            },
            {
                labelKey: 'events.soul.commune', reqSanity: { min: 20, cost: 15 },
                outcomes: [
                    { weight: 40, xpGain: 250, logKey: 'events.soul.commune_wisdom' },
                    { weight: 30, sanityDmg: 20, status: s('cursed'), logKey: 'events.soul.commune_torment' },
                    { weight: 30, status: s('doom'), logKey: 'events.soul.commune_doom' }
                ]
            },
            {
                labelKey: 'events.soul.ignore',
                outcomes: [
                    { weight: 70, logKey: 'events.soul.ignore_fade' },
                    { weight: 30, sanityDmg: 15, status: s('cursed'), logKey: 'events.soul.ignore_curse' }
                ]
            },
        ]
    },
    // ─ Interactive: Broken Wagon ─
    {
        id: 'e_wagon', type: 'interactive', emoji: '🛒', nameKey: 'events.wagon.name', descKey: 'events.wagon.desc',
        choices: [
            {
                labelKey: 'events.wagon.salvage', reqItem: 't_shovel', consumeItem: true,
                outcomes: [
                    { weight: 70, lootChest: true, logKey: 'events.wagon.salvage_ok' },
                    { weight: 30, lootMaterial: true, logKey: 'events.wagon.salvage_poor' }
                ]
            },
            {
                labelKey: 'events.wagon.search',
                outcomes: [
                    { weight: 40, lootMaterial: true, logKey: 'events.wagon.search_ok' },
                    { weight: 30, forceEncounter: true, logKey: 'events.wagon.ambush' },
                    { weight: 30, hpDmg: 15, logKey: 'events.wagon.collapse' }
                ]
            },
            {
                labelKey: 'events.wagon.skip',
                outcomes: [
                    { weight: 100, logKey: 'events.wagon.skip' }
                ]
            },
        ]
    },
    // ─ Interactive: Merchant ─
    {
        id: 'e_merchant', type: 'interactive', emoji: '💰', nameKey: 'events.merchant.name', descKey: 'events.merchant.desc',
        choices: [
            {
                labelKey: 'events.merchant.buy_premium', lootGold: -300,
                outcomes: [
                    { weight: 50, lootEpic: true, logKey: 'events.merchant.buy_premium_ok' },
                    { weight: 50, lootMultiple: 4, logKey: 'events.merchant.buy_premium_bulk' }
                ]
            },
            {
                labelKey: 'events.merchant.buy', lootGold: -100,
                outcomes: [
                    { weight: 60, lootMultiple: 2, logKey: 'events.merchant.buy_ok' },
                    { weight: 30, lootMaterial: true, logKey: 'events.merchant.buy_scam' },
                    { weight: 10, lootEpic: true, logKey: 'events.merchant.buy_lucky' }
                ]
            },
            {
                labelKey: 'events.merchant.skip',
                outcomes: [
                    { weight: 100, logKey: 'events.merchant.skip' }
                ]
            },
        ]
    },
    // ─ Interactive: Barrel Pile ─
    {
        id: 'e_barrels', type: 'interactive', emoji: '🛢️', nameKey: 'events.barrels.name', descKey: 'events.barrels.desc',
        choices: [
            {
                labelKey: 'events.barrels.search', reqTrait: 't_pos_eagle_eye',
                outcomes: [
                    { weight: 80, lootChest: true, logKey: 'events.barrels.search_ok' },
                    { weight: 20, lootGold: 150, logKey: 'events.barrels.search_gold' }
                ]
            },
            {
                labelKey: 'events.barrels.smash', repairWeaponDmg: 2,
                outcomes: [
                    { weight: 40, lootMaterial: true, logKey: 'events.barrels.smash_ok' },
                    { weight: 30, hpDmg: 10, status: s('poison'), logKey: 'events.barrels.smash_gas' },
                    { weight: 20, forceEncounter: true, logKey: 'events.barrels.smash_rats' },
                    { weight: 10, logKey: 'events.barrels.empty' }
                ]
            },
            {
                labelKey: 'events.barrels.skip',
                outcomes: [
                    { weight: 100, logKey: 'events.barrels.skip' }
                ]
            },
        ]
    },
    // ─ Interactive: Old Desk ─
    {
        id: 'e_desk', type: 'interactive', emoji: '📖', nameKey: 'events.desk.name', descKey: 'events.desk.desc',
        choices: [
            {
                labelKey: 'events.desk.read', reqStat: { stat: 'int', min: 10 },
                outcomes: [
                    { weight: 70, xpGain: 300, logKey: 'events.desk.read_smart' },
                    { weight: 30, hpHealPct: 1.0, sanityHealPct: 1.0, logKey: 'events.desk.read_secret' }
                ]
            },
            {
                labelKey: 'events.desk.search',
                outcomes: [
                    { weight: 40, xpGain: 100, logKey: 'events.desk.search_ok' },
                    { weight: 30, lootMaterial: true, logKey: 'events.desk.search_loot' },
                    { weight: 30, sanityDmg: 15, logKey: 'events.desk.search_bad' }
                ]
            },
            {
                labelKey: 'events.desk.skip',
                outcomes: [
                    { weight: 100, logKey: 'events.desk.skip' }
                ]
            },
        ]
    },
    // ─ Interactive: Caged Treasure ─
    {
        id: 'e_cage', type: 'interactive', emoji: '⛓️', nameKey: 'events.cage.name', descKey: 'events.cage.desc',
        choices: [
            {
                labelKey: 'events.cage.key', reqItem: 't_key', consumeItem: true,
                outcomes: [
                    { weight: 70, lootEpic: true, logKey: 'events.cage.key_ok' },
                    { weight: 30, lootMultiple: 3, logKey: 'events.cage.key_hoard' }
                ]
            },
            {
                labelKey: 'events.cage.force', repairWeaponDmg: 8,
                outcomes: [
                    { weight: 30, lootChest: true, logKey: 'events.cage.force_ok' },
                    { weight: 40, status: s('bleed'), hpDmg: 15, logKey: 'events.cage.force_fail' },
                    { weight: 30, forceEncounter: true, logKey: 'events.cage.force_ambush' }
                ]
            },
            {
                labelKey: 'events.cage.skip',
                outcomes: [
                    { weight: 100, logKey: 'events.cage.skip' }
                ]
            },
        ]
    },
    // ─ Interactive: Mural ─
    {
        id: 'e_mural', type: 'interactive', emoji: '🎨', nameKey: 'events.mural.name', descKey: 'events.mural.desc',
        choices: [
            {
                labelKey: 'events.mural.transcribe', reqItemType: 'consumable_food', consumeItem: true,
                outcomes: [
                    { weight: 100, xpGain: 350, logKey: 'events.mural.transcribe_ok' }
                ]
            },
            {
                labelKey: 'events.mural.study',
                outcomes: [
                    { weight: 40, xpGain: 150, logKey: 'events.mural.study_ok' },
                    { weight: 30, xpGain: 50, sanityDmg: 15, logKey: 'events.mural.study_confuse' },
                    { weight: 30, status: s('cursed'), logKey: 'events.mural.study_madness' }
                ]
            },
            {
                labelKey: 'events.mural.skip',
                outcomes: [
                    { weight: 100, logKey: 'events.mural.skip' }
                ]
            },
        ]
    },
    // ─ Interactive: Glowing Mushroom ─
    {
        id: 'e_glow_mush', type: 'interactive', emoji: '🍄', nameKey: 'events.glow_mush.name', descKey: 'events.glow_mush.desc',
        choices: [
            {
                labelKey: 'events.glow_mush.harvest', reqTrait: 't_pos_survivalist',
                outcomes: [
                    { weight: 70, lootItem: 'c_herb', sanityHeal: 15, logKey: 'events.glow_mush.harvest_ok' },
                    { weight: 30, lootMultiple: 2, logKey: 'events.glow_mush.harvest_great' }
                ]
            },
            {
                labelKey: 'events.glow_mush.pick',
                outcomes: [
                    { weight: 50, lootMaterial: true, sanityHeal: 5, logKey: 'events.glow_mush.pick_ok' },
                    { weight: 30, status: s('poison'), hpDmg: 8, logKey: 'events.glow_mush.pick_spores' },
                    { weight: 20, status: s('daze'), logKey: 'events.glow_mush.pick_daze' }
                ]
            },
            {
                labelKey: 'events.glow_mush.skip',
                outcomes: [
                    { weight: 100, logKey: 'events.glow_mush.skip' }
                ]
            },
        ]
    },
    // ─ Interactive: Tainted Pool ─
    {
        id: 'e_pool', type: 'interactive', emoji: '🫧', nameKey: 'events.pool.name', descKey: 'events.pool.desc',
        choices: [
            {
                labelKey: 'events.pool.filter', reqItem: 'c_bandage', consumeItem: true,
                outcomes: [
                    { weight: 80, hpHealPct: 0.8, sanityHeal: 20, logKey: 'events.pool.filter_ok' },
                    { weight: 20, status: s('regen'), logKey: 'events.pool.filter_pure' }
                ]
            },
            {
                labelKey: 'events.pool.wash',
                outcomes: [
                    { weight: 40, hpDmg: 10, status: s('poison'), logKey: 'events.pool.wash_bad' },
                    { weight: 30, hpHeal: 20, logKey: 'events.pool.wash_ok' },
                    { weight: 30, forceEncounter: true, logKey: 'events.pool.wash_ambush' }
                ]
            },
            {
                labelKey: 'events.pool.skip',
                outcomes: [
                    { weight: 100, logKey: 'events.pool.skip' }
                ]
            },
        ]
    },
    // ─ Interactive: Thorn Bush ─
    {
        id: 'e_thorns', type: 'interactive', emoji: '🌿', nameKey: 'events.thorns.name', descKey: 'events.thorns.desc',
        choices: [
            {
                labelKey: 'events.thorns.cut', reqItemType: 'material_ore', consumeItem: true, repairWeapon: true,
                outcomes: [
                    { weight: 80, lootChest: true, logKey: 'events.thorns.cut_ok' },
                    { weight: 20, lootEpic: true, logKey: 'events.thorns.cut_great' }
                ]
            },
            {
                labelKey: 'events.thorns.push',
                outcomes: [
                    { weight: 40, hpDmg: 5, lootMaterial: true, logKey: 'events.thorns.push_ok' },
                    { weight: 40, hpDmg: 15, status: s('bleed'), logKey: 'events.thorns.push_bleed' },
                    { weight: 20, logKey: 'events.thorns.push_stuck' }
                ]
            },
            {
                labelKey: 'events.thorns.skip',
                outcomes: [
                    { weight: 100, logKey: 'events.thorns.skip' }
                ]
            },
        ]
    },
    // ─ Interactive: Abandoned Bag ─
    {
        id: 'e_bag', type: 'interactive', emoji: '🎒', nameKey: 'events.bag.name', descKey: 'events.bag.desc',
        choices: [
            {
                labelKey: 'events.bag.careful', reqTrait: 't_pos_eagle_eye',
                outcomes: [
                    { weight: 60, lootChest: true, logKey: 'events.bag.careful_ok' },
                    { weight: 40, lootGold: 200, logKey: 'events.bag.careful_gold' }
                ]
            },
            {
                labelKey: 'events.bag.open',
                outcomes: [
                    { weight: 40, lootChest: true, logKey: 'events.bag.open_ok' },
                    { weight: 30, status: s('poison'), hpDmg: 10, logKey: 'events.bag.snake' },
                    { weight: 30, forceEncounter: true, logKey: 'events.bag.trap' }
                ]
            },
            {
                labelKey: 'events.bag.skip',
                outcomes: [
                    { weight: 100, logKey: 'events.bag.skip' }
                ]
            },
        ]
    },
    // ─ Interactive: Madman's Scrawlings ─
    {
        id: 'e_scrawl', type: 'interactive', emoji: '✍️', nameKey: 'events.scrawl.name', descKey: 'events.scrawl.desc',
        choices: [
            {
                labelKey: 'events.scrawl.decipher', reqStat: { stat: 'int', min: 12 },
                outcomes: [
                    { weight: 70, xpGain: 350, logKey: 'events.scrawl.decipher_ok' },
                    { weight: 30, status: s('blessed'), logKey: 'events.scrawl.decipher_bless' }
                ]
            },
            {
                labelKey: 'events.scrawl.read',
                outcomes: [
                    { weight: 30, xpGain: 200, logKey: 'events.scrawl.read_ok' },
                    { weight: 40, sanityDmg: 20, logKey: 'events.scrawl.read_confuse' },
                    { weight: 30, sanityDmg: 35, status: s('daze'), logKey: 'events.scrawl.read_madness' }
                ]
            },
            {
                labelKey: 'events.scrawl.skip',
                outcomes: [
                    { weight: 100, logKey: 'events.scrawl.skip' }
                ]
            },
        ]
    },
    // ─ Interactive: Illusionary Butterflies ─
    {
        id: 'e_butterflies', type: 'interactive', emoji: '🦋', nameKey: 'events.butterflies.name', descKey: 'events.butterflies.desc',
        choices: [
            {
                labelKey: 'events.butterflies.follow',
                outcomes: [
                    { weight: 60, sanityHeal: 30, logKey: 'events.butterflies.follow_ok' },
                    { weight: 20, status: s('blessed'), logKey: 'events.butterflies.follow_bless' },
                    { weight: 20, sanityDmg: 15, hpDmg: 10, logKey: 'events.butterflies.follow_lost' }
                ]
            },
            {
                labelKey: 'events.butterflies.catch', reqTrait: 't_pos_agile',
                outcomes: [
                    { weight: 70, lootItem: 'mat_mana_stone', logKey: 'events.butterflies.catch_ok' },
                    { weight: 30, lootMultiple: 2, logKey: 'events.butterflies.catch_great' }
                ]
            },
            {
                labelKey: 'events.butterflies.skip',
                outcomes: [
                    { weight: 100, logKey: 'events.butterflies.skip' }
                ]
            },
        ]
    },
    // ─ Interactive: Old Instrument ─
    {
        id: 'e_instrument', type: 'interactive', emoji: '🪕', nameKey: 'events.instrument.name', descKey: 'events.instrument.desc',
        choices: [
            {
                labelKey: 'events.instrument.play', reqStat: { stat: 'int', min: 10 },
                outcomes: [
                    { weight: 60, sanityHeal: 25, status: s('blessed'), logKey: 'events.instrument.play_good' },
                    { weight: 40, sanityHeal: 40, xpGain: 150, logKey: 'events.instrument.play_great' }
                ]
            },
            {
                labelKey: 'events.instrument.strum',
                outcomes: [
                    { weight: 40, sanityHeal: 15, logKey: 'events.instrument.strum_ok' },
                    { weight: 30, forceEncounter: true, logKey: 'events.instrument.strum_ambush' },
                    { weight: 30, sanityDmg: 20, status: s('cursed'), logKey: 'events.instrument.strum_curse' }
                ]
            },
            {
                labelKey: 'events.instrument.skip',
                outcomes: [
                    { weight: 100, logKey: 'events.instrument.skip' }
                ]
            },
        ]
    },
    // ─ Interactive: Mysterious Tapestry ─
    {
        id: 'e_tapestry', type: 'interactive', emoji: '🖼️', nameKey: 'events.tapestry.name', descKey: 'events.tapestry.desc',
        choices: [
            {
                labelKey: 'events.tapestry.cut', reqItemType: 'material_ore', consumeItem: true, repairWeapon: true,
                outcomes: [
                    { weight: 70, lootChest: true, logKey: 'events.tapestry.cut_ok' },
                    { weight: 30, lootEpic: true, logKey: 'events.tapestry.cut_great' }
                ]
            },
            {
                labelKey: 'events.tapestry.look_behind',
                outcomes: [
                    { weight: 40, lootChest: true, logKey: 'events.tapestry.look_ok' },
                    { weight: 30, forceEncounter: true, logKey: 'events.tapestry.look_ambush' },
                    { weight: 30, hpDmg: 15, status: s('poison'), logKey: 'events.tapestry.look_spider' }
                ]
            },
            {
                labelKey: 'events.tapestry.skip',
                outcomes: [
                    { weight: 100, logKey: 'events.tapestry.skip' }
                ]
            },
        ]
    },
];

// ── THEME-SPECIFIC EVENTS ──
export const EVENTS_THEME = {
    ruins: [
        {
            id: 'th_ruins_pillar', type: 'interactive', emoji: '🏛️', nameKey: 'events.ruins_pillar.name', descKey: 'events.ruins_pillar.desc',
            choices: [
                {
                    labelKey: 'events.ruins_pillar.support', reqItemType: 'material_wood', consumeItem: true,
                    outcomes: [
                        { weight: 70, lootChest: true, logKey: 'events.ruins_pillar.support_ok' },
                        { weight: 30, lootEpic: true, logKey: 'events.ruins_pillar.support_great' }
                    ]
                },
                {
                    labelKey: 'events.ruins_pillar.dodge',
                    outcomes: [
                        { weight: 40, lootChest: true, logKey: 'events.ruins_pillar.ok' },
                        { weight: 40, hpDmg: 15, status: s('crippled', { duration: 5 }), logKey: 'events.ruins_pillar.fail' },
                        { weight: 20, forceEncounter: true, logKey: 'events.ruins_pillar.ambush' }
                    ]
                },
                {
                    labelKey: 'events.ruins_pillar.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.ruins_pillar.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_ruins_mural', type: 'interactive', emoji: '🖼️', nameKey: 'events.ruins_mural.name', descKey: 'events.ruins_mural.desc',
            choices: [
                {
                    labelKey: 'events.ruins_mural.translate', reqStat: { stat: 'int', min: 10 },
                    outcomes: [
                        { weight: 70, xpGain: 350, logKey: 'events.ruins_mural.translate_ok' },
                        { weight: 30, xpGain: 150, sanityHeal: 20, logKey: 'events.ruins_mural.translate_insight' }
                    ]
                },
                {
                    labelKey: 'events.ruins_mural.study',
                    outcomes: [
                        { weight: 40, xpGain: 180, sanityDmg: 10, logKey: 'events.ruins_mural.ok' },
                        { weight: 40, sanityDmg: 20, status: s('cursed'), logKey: 'events.ruins_mural.curse' },
                        { weight: 20, xpGain: 50, logKey: 'events.ruins_mural.confuse' }
                    ]
                },
                {
                    labelKey: 'events.ruins_mural.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.ruins_mural.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_ruins_gear', type: 'interactive', emoji: '⚙️', nameKey: 'events.ruins_gear.name', descKey: 'events.ruins_gear.desc',
            choices: [
                {
                    labelKey: 'events.ruins_gear.oil', reqItemType: 'consumable_food', consumeItem: true,
                    outcomes: [
                        { weight: 80, lootChest: true, logKey: 'events.ruins_gear.oil_ok' },
                        { weight: 20, lootEpic: true, logKey: 'events.ruins_gear.oil_great' }
                    ]
                },
                {
                    labelKey: 'events.ruins_gear.turn',
                    outcomes: [
                        { weight: 40, lootChest: true, logKey: 'events.ruins_gear.ok' },
                        { weight: 40, hpDmg: 12, status: s('bleed'), logKey: 'events.ruins_gear.fail' },
                        { weight: 20, repairWeaponDmg: 5, logKey: 'events.ruins_gear.break' }
                    ]
                },
                {
                    labelKey: 'events.ruins_gear.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.ruins_gear.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_ruins_pool', type: 'interactive', emoji: '💧', nameKey: 'events.ruins_pool.name', descKey: 'events.ruins_pool.desc',
            choices: [
                {
                    labelKey: 'events.ruins_pool.purify', reqItem: 't_holywater', consumeItem: true,
                    outcomes: [
                        { weight: 70, hpHealPct: 1.0, sanityHealPct: 1.0, status: s('blessed'), logKey: 'events.ruins_pool.purify_ok' },
                        { weight: 30, xpGain: 200, logKey: 'events.ruins_pool.purify_wisdom' }
                    ]
                },
                {
                    labelKey: 'events.ruins_pool.drink',
                    outcomes: [
                        { weight: 30, status: s('regen', { duration: 20 }), hpHeal: 30, logKey: 'events.ruins_pool.ok' },
                        { weight: 40, status: s('crippled'), hpDmg: 15, logKey: 'events.ruins_pool.bad' },
                        { weight: 30, sanityDmg: 20, status: s('poison'), logKey: 'events.ruins_pool.toxic' }
                    ]
                },
                {
                    labelKey: 'events.ruins_pool.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.ruins_pool.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_ruins_stone', type: 'interactive', emoji: '💎', nameKey: 'events.ruins_stone.name', descKey: 'events.ruins_stone.desc',
            choices: [
                {
                    labelKey: 'events.ruins_stone.offer', reqItemType: 'material_mana', consumeItem: true,
                    outcomes: [
                        { weight: 60, status: s('blessed', { duration: Infinity }), logKey: 'events.ruins_stone.ok' },
                        { weight: 40, lootEpic: true, logKey: 'events.ruins_stone.offer_reward' }
                    ]
                },
                {
                    labelKey: 'events.ruins_stone.grab',
                    outcomes: [
                        { weight: 30, hpDmg: 20, lootChest: true, logKey: 'events.ruins_stone.grab' },
                        { weight: 40, hpDmg: 30, status: s('cursed'), logKey: 'events.ruins_stone.grab_curse' },
                        { weight: 30, forceEncounter: true, logKey: 'events.ruins_stone.grab_ambush' }
                    ]
                },
                {
                    labelKey: 'events.ruins_stone.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.ruins_stone.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_ruins_trap', type: 'interactive', emoji: '🎯', nameKey: 'events.ruins_trap.name', descKey: 'events.ruins_trap.desc',
            choices: [
                {
                    labelKey: 'events.ruins_trap.disarm', reqTrait: 't_pos_agile',
                    outcomes: [
                        { weight: 80, lootMaterial: true, logKey: 'events.ruins_trap.disarm_ok' },
                        { weight: 20, lootChest: true, logKey: 'events.ruins_trap.disarm_great' }
                    ]
                },
                {
                    labelKey: 'events.ruins_trap.dash',
                    outcomes: [
                        { weight: 40, logKey: 'events.ruins_trap.dash_ok' },
                        { weight: 40, hpDmg: 15, status: s('bleed'), logKey: 'events.ruins_trap.dash_fail' },
                        { weight: 20, hpDmg: 25, status: s('crippled'), logKey: 'events.ruins_trap.dash_bad' }
                    ]
                },
                {
                    labelKey: 'events.ruins_trap.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.ruins_trap.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_ruins_library', type: 'interactive', emoji: '📚', nameKey: 'events.ruins_library.name', descKey: 'events.ruins_library.desc',
            choices: [
                {
                    labelKey: 'events.ruins_library.search', reqItemType: 'material_mana', consumeItem: true,
                    outcomes: [
                        { weight: 60, xpGain: 300, logKey: 'events.ruins_library.search_ok' },
                        { weight: 40, lootEpic: true, logKey: 'events.ruins_library.search_scroll' }
                    ]
                },
                {
                    labelKey: 'events.ruins_library.browse',
                    outcomes: [
                        { weight: 40, xpGain: 150, logKey: 'events.ruins_library.browse_ok' },
                        { weight: 30, sanityDmg: 20, status: s('daze'), logKey: 'events.ruins_library.browse_dust' },
                        { weight: 30, sanityDmg: 35, status: s('cursed'), logKey: 'events.ruins_library.browse_madness' }
                    ]
                },
                {
                    labelKey: 'events.ruins_library.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.ruins_library.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_ruins_statue', type: 'interactive', emoji: '🗽', nameKey: 'events.ruins_statue.name', descKey: 'events.ruins_statue.desc',
            choices: [
                {
                    labelKey: 'events.ruins_statue.restore', reqItemType: 'material_ore', consumeItem: true,
                    outcomes: [
                        { weight: 70, status: s('blessed'), sanityHeal: 30, logKey: 'events.ruins_statue.restore_ok' },
                        { weight: 30, lootChest: true, logKey: 'events.ruins_statue.restore_gift' }
                    ]
                },
                {
                    labelKey: 'events.ruins_statue.loot',
                    outcomes: [
                        { weight: 30, lootGold: 200, logKey: 'events.ruins_statue.loot_ok' },
                        { weight: 40, hpDmg: 20, status: s('doom'), logKey: 'events.ruins_statue.loot_curse' },
                        { weight: 30, forceEncounter: true, logKey: 'events.ruins_statue.loot_animate' }
                    ]
                },
                {
                    labelKey: 'events.ruins_statue.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.ruins_statue.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_ruins_corpse', type: 'interactive', emoji: '🦴', nameKey: 'events.ruins_corpse.name', descKey: 'events.ruins_corpse.desc',
            choices: [
                {
                    labelKey: 'events.ruins_corpse.bury', reqItem: 't_shovel', consumeItem: true,
                    outcomes: [
                        { weight: 70, sanityHeal: 25, logKey: 'events.ruins_corpse.bury_ok' },
                        { weight: 30, xpGain: 200, logKey: 'events.ruins_corpse.bury_respect' }
                    ]
                },
                {
                    labelKey: 'events.ruins_corpse.search',
                    outcomes: [
                        { weight: 40, lootGold: 100, logKey: 'events.ruins_corpse.search_ok' },
                        { weight: 30, sanityDmg: 15, logKey: 'events.ruins_corpse.search_guilt' },
                        { weight: 30, forceEncounter: true, logKey: 'events.ruins_corpse.search_undead' }
                    ]
                },
                {
                    labelKey: 'events.ruins_corpse.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.ruins_corpse.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_ruins_rubble', type: 'interactive', emoji: '🧱', nameKey: 'events.ruins_rubble.name', descKey: 'events.ruins_rubble.desc',
            choices: [
                {
                    labelKey: 'events.ruins_rubble.clear', reqStat: { stat: 'str', min: 10 },
                    outcomes: [
                        { weight: 70, lootChest: true, logKey: 'events.ruins_rubble.clear_ok' },
                        { weight: 30, lootMaterial: true, logKey: 'events.ruins_rubble.clear_poor' }
                    ]
                },
                {
                    labelKey: 'events.ruins_rubble.dig',
                    outcomes: [
                        { weight: 30, lootChest: true, hpDmg: 5, logKey: 'events.ruins_rubble.dig_ok' },
                        { weight: 40, hpDmg: 15, status: s('crippled'), logKey: 'events.ruins_rubble.dig_cavein' },
                        { weight: 30, sanityDmg: 10, logKey: 'events.ruins_rubble.dig_tired' }
                    ]
                },
                {
                    labelKey: 'events.ruins_rubble.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.ruins_rubble.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_ruins_altar_fire', type: 'interactive', emoji: '🔥', nameKey: 'events.ruins_altar_fire.name', descKey: 'events.ruins_altar_fire.desc',
            choices: [
                {
                    labelKey: 'events.ruins_altar_fire.extinguish', reqItem: 't_holywater', consumeItem: true,
                    outcomes: [
                        { weight: 80, lootEpic: true, logKey: 'events.ruins_altar_fire.ext_ok' },
                        { weight: 20, xpGain: 500, logKey: 'events.ruins_altar_fire.ext_great' }
                    ]
                },
                {
                    labelKey: 'events.ruins_altar_fire.touch', reqHp: { min: 25, cost: 15 },
                    outcomes: [
                        { weight: 40, status: s('regen'), lootMultiple: 2, logKey: 'events.ruins_altar_fire.touch_ok' },
                        { weight: 40, status: s('burn'), hpDmg: 10, logKey: 'events.ruins_altar_fire.touch_burn' },
                        { weight: 20, forceEncounter: true, logKey: 'events.ruins_altar_fire.touch_fire_elem' }
                    ]
                },
                {
                    labelKey: 'events.ruins_altar_fire.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.ruins_altar_fire.skip' }
                    ]
                }
            ]
        }
    ],
    swamp: [
        {
            id: 'th_swamp_mud', type: 'interactive', emoji: '🪸', nameKey: 'events.swamp_mud.name', descKey: 'events.swamp_mud.desc',
            choices: [
                {
                    labelKey: 'events.swamp_mud.drain', reqItem: 't_shovel', consumeItem: true,
                    outcomes: [
                        { weight: 80, lootChest: true, logKey: 'events.swamp_mud.drain_ok' },
                        { weight: 20, lootEpic: true, logKey: 'events.swamp_mud.drain_great' }
                    ]
                },
                {
                    labelKey: 'events.swamp_mud.wade',
                    outcomes: [
                        { weight: 40, repairWeaponDmg: 5, lootGold: 60, logKey: 'events.swamp_mud.ok' },
                        { weight: 40, hpDmg: 15, status: s('poison'), logKey: 'events.swamp_mud.leech' },
                        { weight: 20, status: s('crippled'), logKey: 'events.swamp_mud.stuck' }
                    ]
                },
                {
                    labelKey: 'events.swamp_mud.bypass',
                    outcomes: [
                        { weight: 100, logKey: 'events.swamp_mud.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_swamp_gas', type: 'interactive', emoji: '🌫️', nameKey: 'events.swamp_gas.name', descKey: 'events.swamp_gas.desc',
            choices: [
                {
                    labelKey: 'events.swamp_gas.antidote', reqItem: 'c_antidote', consumeItem: true,
                    outcomes: [
                        { weight: 70, logKey: 'events.swamp_gas.safe' },
                        { weight: 30, lootMaterial: true, logKey: 'events.swamp_gas.harvest' }
                    ]
                },
                {
                    labelKey: 'events.swamp_gas.rush',
                    outcomes: [
                        { weight: 30, logKey: 'events.swamp_gas.rush_ok' },
                        { weight: 50, status: s('poison', { duration: 15 }), logKey: 'events.swamp_gas.fail' },
                        { weight: 20, sanityDmg: 20, status: s('daze'), logKey: 'events.swamp_gas.hallucinate' }
                    ]
                },
                {
                    labelKey: 'events.swamp_gas.wait', reqHp: { min: 20, cost: 10 },
                    outcomes: [
                        { weight: 100, logKey: 'events.swamp_gas.wait_clear' }
                    ]
                }
            ]
        },
        {
            id: 'th_swamp_lady', type: 'interactive', emoji: '🧜', nameKey: 'events.swamp_lady.name', descKey: 'events.swamp_lady.desc',
            choices: [
                {
                    labelKey: 'events.swamp_lady.gift', reqItemType: 'material_mana', consumeItem: true,
                    outcomes: [
                        { weight: 70, status: s('blessed'), sanityHeal: 40, logKey: 'events.swamp_lady.gift_ok' },
                        { weight: 30, lootEpic: true, logKey: 'events.swamp_lady.gift_great' }
                    ]
                },
                {
                    labelKey: 'events.swamp_lady.follow',
                    outcomes: [
                        { weight: 30, sanityDmg: 20, lootChest: true, logKey: 'events.swamp_lady.follow' },
                        { weight: 40, sanityDmg: 40, status: s('cursed'), logKey: 'events.swamp_lady.follow_trap' },
                        { weight: 30, forceEncounter: true, logKey: 'events.swamp_lady.follow_ambush' }
                    ]
                },
                {
                    labelKey: 'events.swamp_lady.ignore',
                    outcomes: [
                        { weight: 100, logKey: 'events.swamp_lady.ignore' }
                    ]
                }
            ]
        },
        {
            id: 'th_swamp_raft', type: 'interactive', emoji: '🛶', nameKey: 'events.swamp_raft.name', descKey: 'events.swamp_raft.desc',
            choices: [
                {
                    labelKey: 'events.swamp_raft.rope', reqItemType: 'material_rope', consumeItem: true,
                    outcomes: [
                        { weight: 70, lootMultiple: 2, logKey: 'events.swamp_raft.rope_ok' },
                        { weight: 30, lootChest: true, logKey: 'events.swamp_raft.rope_chest' }
                    ]
                },
                {
                    labelKey: 'events.swamp_raft.dive',
                    outcomes: [
                        { weight: 40, lootChest: true, logKey: 'events.swamp_raft.dive_ok' },
                        { weight: 40, forceEncounter: true, logKey: 'events.swamp_raft.dive' },
                        { weight: 20, hpDmg: 20, status: s('poison'), logKey: 'events.swamp_raft.dive_toxic' }
                    ]
                },
                {
                    labelKey: 'events.swamp_raft.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.swamp_raft.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_swamp_tree', type: 'interactive', emoji: '🌳', nameKey: 'events.swamp_tree.name', descKey: 'events.swamp_tree.desc',
            choices: [
                {
                    labelKey: 'events.swamp_tree.chop', reqItemType: 'material_ore', consumeItem: true, repairWeapon: true,
                    outcomes: [
                        { weight: 80, lootChest: true, logKey: 'events.swamp_tree.chop_ok' },
                        { weight: 20, lootEpic: true, logKey: 'events.swamp_tree.chop_rare' }
                    ]
                },
                {
                    labelKey: 'events.swamp_tree.harvest',
                    outcomes: [
                        { weight: 40, lootMaterial: true, logKey: 'events.swamp_tree.ok' },
                        { weight: 40, status: s('poison', { duration: 15 }), logKey: 'events.swamp_tree.bad' },
                        { weight: 20, hpDmg: 15, logKey: 'events.swamp_tree.thorn' }
                    ]
                },
                {
                    labelKey: 'events.swamp_tree.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.swamp_tree.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_swamp_shrine', type: 'interactive', emoji: '🪦', nameKey: 'events.swamp_shrine.name', descKey: 'events.swamp_shrine.desc',
            choices: [
                {
                    labelKey: 'events.swamp_shrine.cleanse', reqItem: 't_holywater', consumeItem: true,
                    outcomes: [
                        { weight: 70, status: s('blessed'), sanityHeal: 30, logKey: 'events.swamp_shrine.cleanse_ok' },
                        { weight: 30, xpGain: 250, logKey: 'events.swamp_shrine.cleanse_wisdom' }
                    ]
                },
                {
                    labelKey: 'events.swamp_shrine.pray',
                    outcomes: [
                        { weight: 30, sanityHeal: 20, logKey: 'events.swamp_shrine.pray_ok' },
                        { weight: 40, sanityDmg: 20, status: s('cursed'), logKey: 'events.swamp_shrine.pray_curse' },
                        { weight: 30, xpGain: 100, sanityDmg: 15, logKey: 'events.swamp_shrine.pray_vision' }
                    ]
                },
                {
                    labelKey: 'events.swamp_shrine.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.swamp_shrine.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_swamp_corpse', type: 'interactive', emoji: '💀', nameKey: 'events.swamp_corpse.name', descKey: 'events.swamp_corpse.desc',
            choices: [
                {
                    labelKey: 'events.swamp_corpse.burn', reqItem: 't_torch', consumeItem: true,
                    outcomes: [
                        { weight: 80, sanityHeal: 25, logKey: 'events.swamp_corpse.burn_ok' },
                        { weight: 20, lootMaterial: true, logKey: 'events.swamp_corpse.burn_ash' }
                    ]
                },
                {
                    labelKey: 'events.swamp_corpse.search',
                    outcomes: [
                        { weight: 40, lootGold: 120, logKey: 'events.swamp_corpse.search_ok' },
                        { weight: 30, status: s('disease'), hpDmg: 10, logKey: 'events.swamp_corpse.search_sick' },
                        { weight: 30, forceEncounter: true, logKey: 'events.swamp_corpse.search_zombie' }
                    ]
                },
                {
                    labelKey: 'events.swamp_corpse.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.swamp_corpse.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_swamp_flora', type: 'interactive', emoji: '🌺', nameKey: 'events.swamp_flora.name', descKey: 'events.swamp_flora.desc',
            choices: [
                {
                    labelKey: 'events.swamp_flora.study', reqTrait: 't_pos_forest_expert',
                    outcomes: [
                        { weight: 70, xpGain: 300, logKey: 'events.swamp_flora.study_ok' },
                        { weight: 30, lootItem: 'c_herb', logKey: 'events.swamp_flora.study_herb' }
                    ]
                },
                {
                    labelKey: 'events.swamp_flora.pick',
                    outcomes: [
                        { weight: 40, lootMaterial: true, logKey: 'events.swamp_flora.pick_ok' },
                        { weight: 40, status: s('daze'), sanityDmg: 15, logKey: 'events.swamp_flora.pick_spore' },
                        { weight: 20, hpDmg: 15, status: s('poison'), logKey: 'events.swamp_flora.pick_bite' }
                    ]
                },
                {
                    labelKey: 'events.swamp_flora.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.swamp_flora.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_swamp_hut', type: 'interactive', emoji: '🛖', nameKey: 'events.swamp_hut.name', descKey: 'events.swamp_hut.desc',
            choices: [
                {
                    labelKey: 'events.swamp_hut.knock', reqTrait: 't_pos_charismatic',
                    outcomes: [
                        { weight: 70, hpHealPct: 0.5, logKey: 'events.swamp_hut.knock_welcome' },
                        { weight: 30, lootChest: true, logKey: 'events.swamp_hut.knock_gift' }
                    ]
                },
                {
                    labelKey: 'events.swamp_hut.sneak',
                    outcomes: [
                        { weight: 40, lootChest: true, logKey: 'events.swamp_hut.sneak_ok' },
                        { weight: 30, sanityDmg: 20, logKey: 'events.swamp_hut.sneak_caught' },
                        { weight: 30, forceEncounter: true, logKey: 'events.swamp_hut.sneak_hag' }
                    ]
                },
                {
                    labelKey: 'events.swamp_hut.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.swamp_hut.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_swamp_wisp', type: 'interactive', emoji: '☄️', nameKey: 'events.swamp_wisp.name', descKey: 'events.swamp_wisp.desc',
            choices: [
                {
                    labelKey: 'events.swamp_wisp.bottle', reqItem: 't_bottle', consumeItem: true,
                    outcomes: [
                        { weight: 70, lootEpic: true, logKey: 'events.swamp_wisp.bottle_ok' },
                        { weight: 30, xpGain: 400, logKey: 'events.swamp_wisp.bottle_wisdom' }
                    ]
                },
                {
                    labelKey: 'events.swamp_wisp.catch',
                    outcomes: [
                        { weight: 30, lootMaterial: true, logKey: 'events.swamp_wisp.catch_ok' },
                        { weight: 40, status: s('burn'), hpDmg: 10, logKey: 'events.swamp_wisp.catch_burn' },
                        { weight: 30, sanityDmg: 25, logKey: 'events.swamp_wisp.catch_lost' }
                    ]
                },
                {
                    labelKey: 'events.swamp_wisp.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.swamp_wisp.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_swamp_totem', type: 'interactive', emoji: '👺', nameKey: 'events.swamp_totem.name', descKey: 'events.swamp_totem.desc',
            choices: [
                {
                    labelKey: 'events.swamp_totem.smash', reqStat: { stat: 'str', min: 12 },
                    outcomes: [
                        { weight: 60, lootChest: true, logKey: 'events.swamp_totem.smash_ok' },
                        { weight: 40, sanityHeal: 30, status: s('blessed'), logKey: 'events.swamp_totem.smash_curse_lifted' }
                    ]
                },
                {
                    labelKey: 'events.swamp_totem.examine',
                    outcomes: [
                        { weight: 30, xpGain: 200, logKey: 'events.swamp_totem.examine_ok' },
                        { weight: 40, sanityDmg: 20, status: s('cursed'), logKey: 'events.swamp_totem.examine_curse' },
                        { weight: 30, status: s('doom'), logKey: 'events.swamp_totem.examine_doom' }
                    ]
                },
                {
                    labelKey: 'events.swamp_totem.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.swamp_totem.skip' }
                    ]
                }
            ]
        }
    ],
    volcano: [
        {
            id: 'th_vol_obsidian', type: 'interactive', emoji: '🖤', nameKey: 'events.vol_obsidian.name', descKey: 'events.vol_obsidian.desc',
            choices: [
                { labelKey: 'events.vol_obsidian.grab', outcomes: [{ weight: 100, status: s('burn'), lootMaterial: true, logKey: 'events.vol_obsidian.ok' }] },
                { labelKey: 'events.vol_obsidian.skip', outcomes: [{ weight: 100, logKey: 'events.vol_obsidian.skip' }] },
            ]
        },
        {
            id: 'th_vol_geyser', type: 'interactive', emoji: '💨', nameKey: 'events.vol_geyser.name', descKey: 'events.vol_geyser.desc',
            choices: [
                {
                    labelKey: 'events.vol_geyser.shield', reqItemType: 'material_ore', consumeItem: true,
                    outcomes: [{ weight: 100, lootChest: true, logKey: 'events.vol_geyser.shield_ok' }]
                },
                { labelKey: 'events.vol_geyser.jump', outcomes: [{ weight: 40, lootChest: true, logKey: 'events.vol_geyser.jump_ok' }, { weight: 60, hpDmg: 15, status: s('burn'), logKey: 'events.vol_geyser.fail' }] },
            ]
        },
        {
            id: 'th_vol_altar', type: 'interactive', emoji: '🕍', nameKey: 'events.vol_altar.name', descKey: 'events.vol_altar.desc',
            choices: [
                {
                    labelKey: 'events.vol_altar.offer', reqItemType: 'consumable_food', consumeItem: true,
                    outcomes: [{ weight: 100, status: { ...s('blessed'), statMod: { atkMul: 0.15 }, duration: 10, icon: '🔥', labelKey: 'status.fire_blessing' }, logKey: 'events.vol_altar.ok' }]
                },
                { labelKey: 'events.vol_altar.skip', outcomes: [{ weight: 100, logKey: 'events.vol_altar.skip' }] },
            ]
        },
        {
            id: 'th_vol_smoke', type: 'immediate', emoji: '🌋', nameKey: 'events.vol_smoke.name', descKey: 'events.vol_smoke.desc',
            outcomes: [{ weight: 100, hpDmg: 8, sanityDmg: 5, logKey: 'events.vol_smoke.hit' }]
        },
        {
            id: 'th_vol_lava_gem', type: 'interactive', emoji: '💎', nameKey: 'events.vol_lava_gem.name', descKey: 'events.vol_lava_gem.desc',
            choices: [
                {
                    labelKey: 'events.vol_lava_gem.rope', reqItemType: 'material_rope', consumeItem: true,
                    outcomes: [{ weight: 100, lootEpic: true, logKey: 'events.vol_lava_gem.ok' }]
                },
                { labelKey: 'events.vol_lava_gem.skip', outcomes: [{ weight: 100, logKey: 'events.vol_lava_gem.skip' }] },
            ]
        },
    ],
    mine: [
        {
            id: 'th_mine_cart', type: 'interactive', emoji: '🛒', nameKey: 'events.mine_cart.name', descKey: 'events.mine_cart.desc',
            choices: [
                {
                    labelKey: 'events.mine_cart.tool', reqItemType: 'material_ore', consumeItem: true,
                    outcomes: [
                        { weight: 80, lootMultiple: 3, logKey: 'events.mine_cart.tool_ok' },
                        { weight: 20, lootEpic: true, logKey: 'events.mine_cart.tool_jackpot' }
                    ]
                },
                {
                    labelKey: 'events.mine_cart.bare',
                    outcomes: [
                        { weight: 40, lootMaterial: true, status: s('bleed'), hpDmg: 5, logKey: 'events.mine_cart.bare_ok' },
                        { weight: 40, hpDmg: 15, status: s('crippled'), logKey: 'events.mine_cart.bare_fail' },
                        { weight: 20, forceEncounter: true, logKey: 'events.mine_cart.bare_ambush' }
                    ]
                },
                {
                    labelKey: 'events.mine_cart.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.mine_cart.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_mine_gas', type: 'interactive', emoji: '☣️', nameKey: 'events.mine_gas.name', descKey: 'events.mine_gas.desc',
            choices: [
                {
                    labelKey: 'events.mine_gas.antidote', reqItem: 'c_antidote', consumeItem: true,
                    outcomes: [
                        { weight: 70, logKey: 'events.mine_gas.safe' },
                        { weight: 30, lootMaterial: true, logKey: 'events.mine_gas.safe_loot' }
                    ]
                },
                {
                    labelKey: 'events.mine_gas.run', reqTrait: 't_pos_agile',
                    outcomes: [
                        { weight: 60, logKey: 'events.mine_gas.run_ok' },
                        { weight: 40, hpDmg: 10, status: s('poison', { duration: 10 }), logKey: 'events.mine_gas.run_cough' }
                    ]
                },
                {
                    labelKey: 'events.mine_gas.wait',
                    outcomes: [
                        { weight: 30, logKey: 'events.mine_gas.wait_ok' },
                        { weight: 50, hpDmg: 20, status: s('daze'), logKey: 'events.mine_gas.wait_fail' },
                        { weight: 20, sanityDmg: 20, status: s('poison'), logKey: 'events.mine_gas.wait_toxic' }
                    ]
                }
            ]
        },
        {
            id: 'th_mine_dynamite', type: 'interactive', emoji: '💣', nameKey: 'events.mine_dynamite.name', descKey: 'events.mine_dynamite.desc',
            choices: [
                {
                    labelKey: 'events.mine_dynamite.throw', weakenNextBattle: true,
                    outcomes: [
                        { weight: 80, logKey: 'events.mine_dynamite.throw_ok' },
                        { weight: 20, lootMultiple: 2, logKey: 'events.mine_dynamite.throw_boom' }
                    ]
                },
                {
                    labelKey: 'events.mine_dynamite.keep',
                    outcomes: [
                        { weight: 40, lootItem: 't_torch', logKey: 'events.mine_dynamite.keep_ok' },
                        { weight: 40, hpDmg: 20, status: s('burn'), logKey: 'events.mine_dynamite.explode' },
                        { weight: 20, hpDmg: 30, status: s('crippled'), logKey: 'events.mine_dynamite.huge_explode' }
                    ]
                },
                {
                    labelKey: 'events.mine_dynamite.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.mine_dynamite.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_mine_eyes', type: 'interactive', emoji: '👁️', nameKey: 'events.mine_eyes.name', descKey: 'events.mine_eyes.desc',
            choices: [
                {
                    labelKey: 'events.mine_eyes.torch', reqItem: 't_torch', consumeItem: true,
                    outcomes: [
                        { weight: 70, logKey: 'events.mine_eyes.torch_ok' },
                        { weight: 30, lootMaterial: true, logKey: 'events.mine_eyes.torch_loot' }
                    ]
                },
                {
                    labelKey: 'events.mine_eyes.stare',
                    outcomes: [
                        { weight: 40, sanityHeal: 10, logKey: 'events.mine_eyes.stare_ok' },
                        { weight: 30, sanityDmg: 20, status: s('daze'), logKey: 'events.mine_eyes.stare_mad' },
                        { weight: 30, forceEncounter: true, logKey: 'events.mine_eyes.stare_ambush' }
                    ]
                },
                {
                    labelKey: 'events.mine_eyes.wait',
                    outcomes: [
                        { weight: 40, logKey: 'events.mine_eyes.wait_fade' },
                        { weight: 60, sanityDmg: 15, status: s('crippled'), logKey: 'events.mine_eyes.wait_fail' }
                    ]
                }
            ]
        },
        {
            id: 'th_mine_vein', type: 'interactive', emoji: '✨', nameKey: 'events.mine_vein.name', descKey: 'events.mine_vein.desc',
            choices: [
                {
                    labelKey: 'events.mine_vein.pickaxe', reqItem: 't_pickaxe', consumeItem: true,
                    outcomes: [
                        { weight: 70, lootEpic: true, logKey: 'events.mine_vein.pickaxe_ok' },
                        { weight: 30, lootMultiple: 3, logKey: 'events.mine_vein.pickaxe_rich' }
                    ]
                },
                {
                    labelKey: 'events.mine_vein.mine',
                    outcomes: [
                        { weight: 30, lootMaterial: true, hpDmg: 5, logKey: 'events.mine_vein.ok' },
                        { weight: 40, hpDmg: 15, status: s('bleed'), logKey: 'events.mine_vein.fail' },
                        { weight: 30, forceEncounter: true, logKey: 'events.mine_vein.ambush' }
                    ]
                },
                {
                    labelKey: 'events.mine_vein.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.mine_vein.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_mine_cavein', type: 'interactive', emoji: '🪨', nameKey: 'events.mine_cavein.name', descKey: 'events.mine_cavein.desc',
            choices: [
                {
                    labelKey: 'events.mine_cavein.shovel', reqItem: 't_shovel', consumeItem: true,
                    outcomes: [
                        { weight: 80, lootChest: true, logKey: 'events.mine_cavein.shovel_ok' },
                        { weight: 20, lootEpic: true, logKey: 'events.mine_cavein.shovel_great' }
                    ]
                },
                {
                    labelKey: 'events.mine_cavein.dig', reqStat: { stat: 'str', min: 12 },
                    outcomes: [
                        { weight: 60, lootChest: true, hpDmg: 5, logKey: 'events.mine_cavein.dig_ok' },
                        { weight: 40, hpDmg: 20, status: s('crippled'), logKey: 'events.mine_cavein.dig_fail' }
                    ]
                },
                {
                    labelKey: 'events.mine_cavein.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.mine_cavein.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_mine_drill', type: 'interactive', emoji: '🔩', nameKey: 'events.mine_drill.name', descKey: 'events.mine_drill.desc',
            choices: [
                {
                    labelKey: 'events.mine_drill.oil', reqItemType: 'consumable_food', consumeItem: true,
                    outcomes: [
                        { weight: 70, lootChest: true, logKey: 'events.mine_drill.oil_ok' },
                        { weight: 30, lootMultiple: 2, logKey: 'events.mine_drill.oil_loud' }
                    ]
                },
                {
                    labelKey: 'events.mine_drill.start',
                    outcomes: [
                        { weight: 30, lootMaterial: true, logKey: 'events.mine_drill.start_ok' },
                        { weight: 40, hpDmg: 15, status: s('bleed'), logKey: 'events.mine_drill.start_fail' },
                        { weight: 30, forceEncounter: true, logKey: 'events.mine_drill.start_ambush' }
                    ]
                },
                {
                    labelKey: 'events.mine_drill.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.mine_drill.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_mine_gem', type: 'interactive', emoji: '💎', nameKey: 'events.mine_gem.name', descKey: 'events.mine_gem.desc',
            choices: [
                {
                    labelKey: 'events.mine_gem.chisel', reqItem: 't_pickaxe', consumeItem: true,
                    outcomes: [
                        { weight: 60, lootEpic: true, logKey: 'events.mine_gem.chisel_ok' },
                        { weight: 40, lootItem: 'mat_mana_stone', logKey: 'events.mine_gem.chisel_mana' }
                    ]
                },
                {
                    labelKey: 'events.mine_gem.pry',
                    outcomes: [
                        { weight: 30, lootMaterial: true, logKey: 'events.mine_gem.pry_ok' },
                        { weight: 40, repairWeaponDmg: 8, logKey: 'events.mine_gem.pry_break' },
                        { weight: 30, hpDmg: 10, status: s('daze'), logKey: 'events.mine_gem.pry_flash' }
                    ]
                },
                {
                    labelKey: 'events.mine_gem.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.mine_gem.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_mine_ghost', type: 'interactive', emoji: '👻', nameKey: 'events.mine_ghost.name', descKey: 'events.mine_ghost.desc',
            choices: [
                {
                    labelKey: 'events.mine_ghost.peace', reqItem: 't_holywater', consumeItem: true,
                    outcomes: [
                        { weight: 70, sanityHeal: 40, status: s('blessed'), logKey: 'events.mine_ghost.peace_ok' },
                        { weight: 30, lootEpic: true, logKey: 'events.mine_ghost.peace_gift' }
                    ]
                },
                {
                    labelKey: 'events.mine_ghost.listen',
                    outcomes: [
                        { weight: 40, xpGain: 250, sanityDmg: 15, logKey: 'events.mine_ghost.listen_ok' },
                        { weight: 30, sanityDmg: 30, status: s('cursed'), logKey: 'events.mine_ghost.listen_mad' },
                        { weight: 30, forceEncounter: true, logKey: 'events.mine_ghost.listen_anger' }
                    ]
                },
                {
                    labelKey: 'events.mine_ghost.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.mine_ghost.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_mine_elevator', type: 'interactive', emoji: '🛗', nameKey: 'events.mine_elevator.name', descKey: 'events.mine_elevator.desc',
            choices: [
                {
                    labelKey: 'events.mine_elevator.repair', reqItemType: 'material_ore', consumeItem: true, repairWeapon: true,
                    outcomes: [
                        { weight: 80, lootChest: true, logKey: 'events.mine_elevator.repair_ok' },
                        { weight: 20, lootMultiple: 2, logKey: 'events.mine_elevator.repair_stash' }
                    ]
                },
                {
                    labelKey: 'events.mine_elevator.climb', reqTrait: 't_pos_agile',
                    outcomes: [
                        { weight: 60, xpGain: 150, logKey: 'events.mine_elevator.climb_ok' },
                        { weight: 40, hpDmg: 20, status: s('crippled'), logKey: 'events.mine_elevator.climb_fall' }
                    ]
                },
                {
                    labelKey: 'events.mine_elevator.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.mine_elevator.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_mine_tracks', type: 'interactive', emoji: '🛤️', nameKey: 'events.mine_tracks.name', descKey: 'events.mine_tracks.desc',
            choices: [
                {
                    labelKey: 'events.mine_tracks.follow', reqTrait: 't_pos_eagle_eye',
                    outcomes: [
                        { weight: 70, lootChest: true, logKey: 'events.mine_tracks.follow_ok' },
                        { weight: 30, xpGain: 200, logKey: 'events.mine_tracks.follow_safe' }
                    ]
                },
                {
                    labelKey: 'events.mine_tracks.walk',
                    outcomes: [
                        { weight: 40, logKey: 'events.mine_tracks.walk_ok' },
                        { weight: 30, hpDmg: 15, status: s('bleed'), logKey: 'events.mine_tracks.walk_trip' },
                        { weight: 30, forceEncounter: true, logKey: 'events.mine_tracks.walk_ambush' }
                    ]
                },
                {
                    labelKey: 'events.mine_tracks.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.mine_tracks.skip' }
                    ]
                }
            ]
        }
    ],
    citadel: [
        {
            id: 'th_cit_statue', type: 'interactive', emoji: '🗿', nameKey: 'events.cit_statue.name', descKey: 'events.cit_statue.desc',
            choices: [
                {
                    labelKey: 'events.cit_statue.honor', reqTrait: 't_pos_noble',
                    outcomes: [
                        { weight: 70, status: s('blessed', { duration: Infinity }), logKey: 'events.cit_statue.honor_ok' },
                        { weight: 30, xpGain: 300, logKey: 'events.cit_statue.honor_wisdom' }
                    ]
                },
                {
                    labelKey: 'events.cit_statue.loot',
                    outcomes: [
                        { weight: 40, lootChest: true, status: s('cursed', { duration: Infinity }), logKey: 'events.cit_statue.loot' },
                        { weight: 30, forceEncounter: true, logKey: 'events.cit_statue.loot_trap' },
                        { weight: 30, hpDmg: 20, status: s('crippled'), logKey: 'events.cit_statue.loot_fall' }
                    ]
                },
                {
                    labelKey: 'events.cit_statue.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.cit_statue.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_cit_ghost', type: 'interactive', emoji: '👻', nameKey: 'events.cit_ghost.name', descKey: 'events.cit_ghost.desc',
            choices: [
                {
                    labelKey: 'events.cit_ghost.peace', reqItem: 't_holywater', consumeItem: true,
                    outcomes: [
                        { weight: 70, sanityHeal: 40, status: s('blessed'), logKey: 'events.cit_ghost.peace_ok' },
                        { weight: 30, lootEpic: true, logKey: 'events.cit_ghost.peace_gift' }
                    ]
                },
                {
                    labelKey: 'events.cit_ghost.listen',
                    outcomes: [
                        { weight: 40, xpGain: 200, sanityDmg: 25, logKey: 'events.cit_ghost.listen_ok' },
                        { weight: 40, sanityDmg: 40, status: s('daze'), logKey: 'events.cit_ghost.listen_mad' },
                        { weight: 20, forceEncounter: true, logKey: 'events.cit_ghost.listen_anger' }
                    ]
                },
                {
                    labelKey: 'events.cit_ghost.cover',
                    outcomes: [
                        { weight: 100, sanityDmg: 5, logKey: 'events.cit_ghost.cover' }
                    ]
                }
            ]
        },
        {
            id: 'th_cit_armory', type: 'interactive', emoji: '🏹', nameKey: 'events.cit_armory.name', descKey: 'events.cit_armory.desc',
            choices: [
                {
                    labelKey: 'events.cit_armory.key', reqItem: 't_key', consumeItem: true,
                    outcomes: [
                        { weight: 80, lootEpic: true, logKey: 'events.cit_armory.key_ok' },
                        { weight: 20, lootMultiple: 2, logKey: 'events.cit_armory.key_hoard' }
                    ]
                },
                {
                    labelKey: 'events.cit_armory.break', repairWeaponDmg: 10,
                    outcomes: [
                        { weight: 40, lootChest: true, logKey: 'events.cit_armory.force_ok' },
                        { weight: 40, forceEncounter: true, logKey: 'events.cit_armory.guard' },
                        { weight: 20, hpDmg: 15, status: s('bleed'), logKey: 'events.cit_armory.force_hurt' }
                    ]
                },
                {
                    labelKey: 'events.cit_armory.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.cit_armory.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_cit_prisoner', type: 'interactive', emoji: '⛓️', nameKey: 'events.cit_prisoner.name', descKey: 'events.cit_prisoner.desc',
            choices: [
                {
                    labelKey: 'events.cit_prisoner.free', reqItem: 't_key', consumeItem: true,
                    outcomes: [
                        { weight: 70, sanityHeal: 30, lootEpic: true, logKey: 'events.cit_prisoner.free_ok' },
                        { weight: 30, xpGain: 400, logKey: 'events.cit_prisoner.free_thanks' }
                    ]
                },
                {
                    labelKey: 'events.cit_prisoner.feed', reqItemType: 'consumable_food', consumeItem: true,
                    outcomes: [
                        { weight: 60, lootItem: 't_key', logKey: 'events.cit_prisoner.feed_ok' },
                        { weight: 40, xpGain: 150, sanityHeal: 10, logKey: 'events.cit_prisoner.feed_info' }
                    ]
                },
                {
                    labelKey: 'events.cit_prisoner.ignore',
                    outcomes: [
                        { weight: 100, sanityDmg: 10, logKey: 'events.cit_prisoner.ignore' }
                    ]
                }
            ]
        },
        {
            id: 'th_cit_chandelier', type: 'interactive', emoji: '🕯️', nameKey: 'events.cit_chandelier.name', descKey: 'events.cit_chandelier.desc',
            choices: [
                {
                    labelKey: 'events.cit_chandelier.climb', reqTrait: 't_pos_agile',
                    outcomes: [
                        { weight: 70, lootEpic: true, logKey: 'events.cit_chandelier.climb_ok' },
                        { weight: 30, lootChest: true, logKey: 'events.cit_chandelier.climb_modest' }
                    ]
                },
                {
                    labelKey: 'events.cit_chandelier.jump',
                    outcomes: [
                        { weight: 30, lootEpic: true, logKey: 'events.cit_chandelier.ok' },
                        { weight: 40, hpDmg: 20, status: s('crippled', { duration: 20 }), logKey: 'events.cit_chandelier.fall' },
                        { weight: 30, forceEncounter: true, logKey: 'events.cit_chandelier.crash' }
                    ]
                },
                {
                    labelKey: 'events.cit_chandelier.cut', repairWeaponDmg: 3,
                    outcomes: [
                        { weight: 80, lootMaterial: true, logKey: 'events.cit_chandelier.cut_ok' },
                        { weight: 20, lootChest: true, logKey: 'events.cit_chandelier.cut_gems' }
                    ]
                }
            ]
        },
        {
            id: 'th_cit_throne', type: 'interactive', emoji: '💺', nameKey: 'events.cit_throne.name', descKey: 'events.cit_throne.desc',
            choices: [
                {
                    labelKey: 'events.cit_throne.sit', reqTrait: 't_pos_noble',
                    outcomes: [
                        { weight: 70, status: s('blessed'), sanityHeal: 40, logKey: 'events.cit_throne.sit_ok' },
                        { weight: 30, lootEpic: true, logKey: 'events.cit_throne.sit_gift' }
                    ]
                },
                {
                    labelKey: 'events.cit_throne.search',
                    outcomes: [
                        { weight: 40, lootGold: 200, logKey: 'events.cit_throne.search_ok' },
                        { weight: 30, status: s('cursed'), sanityDmg: 20, logKey: 'events.cit_throne.search_curse' },
                        { weight: 30, forceEncounter: true, logKey: 'events.cit_throne.search_guard' }
                    ]
                },
                {
                    labelKey: 'events.cit_throne.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.cit_throne.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_cit_tapestry', type: 'interactive', emoji: '🧶', nameKey: 'events.cit_tapestry.name', descKey: 'events.cit_tapestry.desc',
            choices: [
                {
                    labelKey: 'events.cit_tapestry.study', reqTrait: 't_pos_scholar',
                    outcomes: [
                        { weight: 80, xpGain: 350, logKey: 'events.cit_tapestry.study_ok' },
                        { weight: 20, lootMultiple: 2, logKey: 'events.cit_tapestry.study_secret' }
                    ]
                },
                {
                    labelKey: 'events.cit_tapestry.tear', repairWeaponDmg: 5,
                    outcomes: [
                        { weight: 40, lootMaterial: true, logKey: 'events.cit_tapestry.tear_ok' },
                        { weight: 30, lootChest: true, logKey: 'events.cit_tapestry.tear_hide' },
                        { weight: 30, hpDmg: 15, sanityDmg: 15, status: s('poison'), logKey: 'events.cit_tapestry.tear_trap' }
                    ]
                },
                {
                    labelKey: 'events.cit_tapestry.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.cit_tapestry.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_cit_painting', type: 'interactive', emoji: '🖼️', nameKey: 'events.cit_painting.name', descKey: 'events.cit_painting.desc',
            choices: [
                {
                    labelKey: 'events.cit_painting.stare', reqSanity: { min: 40, cost: 20 },
                    outcomes: [
                        { weight: 70, xpGain: 300, logKey: 'events.cit_painting.stare_ok' },
                        { weight: 30, status: s('blessed'), logKey: 'events.cit_painting.stare_vision' }
                    ]
                },
                {
                    labelKey: 'events.cit_painting.burn', reqItem: 't_torch', consumeItem: true,
                    outcomes: [
                        { weight: 60, sanityHeal: 30, logKey: 'events.cit_painting.burn_ok' },
                        { weight: 40, status: s('cursed'), logKey: 'events.cit_painting.burn_curse' }
                    ]
                },
                {
                    labelKey: 'events.cit_painting.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.cit_painting.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_cit_guard', type: 'interactive', emoji: '🪖', nameKey: 'events.cit_guard.name', descKey: 'events.cit_guard.desc',
            choices: [
                {
                    labelKey: 'events.cit_guard.bribe', reqItemType: 'consumable_food', consumeItem: true,
                    outcomes: [
                        { weight: 70, lootChest: true, logKey: 'events.cit_guard.bribe_ok' },
                        { weight: 30, xpGain: 200, logKey: 'events.cit_guard.bribe_info' }
                    ]
                },
                {
                    labelKey: 'events.cit_guard.sneak', reqTrait: 't_pos_agile',
                    outcomes: [
                        { weight: 60, lootChest: true, logKey: 'events.cit_guard.sneak_ok' },
                        { weight: 20, forceEncounter: true, logKey: 'events.cit_guard.sneak_caught' },
                        { weight: 20, lootEpic: true, logKey: 'events.cit_guard.sneak_great' }
                    ]
                },
                {
                    labelKey: 'events.cit_guard.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.cit_guard.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_cit_vault', type: 'interactive', emoji: '🛡️', nameKey: 'events.cit_vault.name', descKey: 'events.cit_vault.desc',
            choices: [
                {
                    labelKey: 'events.cit_vault.pick', reqItem: 't_lockpick', consumeItem: true,
                    outcomes: [
                        { weight: 70, lootEpic: true, logKey: 'events.cit_vault.pick_ok' },
                        { weight: 30, lootMultiple: 3, logKey: 'events.cit_vault.pick_jackpot' }
                    ]
                },
                {
                    labelKey: 'events.cit_vault.smash', reqStat: { stat: 'str', min: 14 },
                    outcomes: [
                        { weight: 50, lootChest: true, hpDmg: 10, logKey: 'events.cit_vault.smash_ok' },
                        { weight: 50, hpDmg: 25, status: s('crippled'), logKey: 'events.cit_vault.smash_fail' }
                    ]
                },
                {
                    labelKey: 'events.cit_vault.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.cit_vault.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_cit_gargoyle', type: 'interactive', emoji: '🦇', nameKey: 'events.cit_gargoyle.name', descKey: 'events.cit_gargoyle.desc',
            choices: [
                {
                    labelKey: 'events.cit_gargoyle.cleanse', reqItem: 't_holywater', consumeItem: true,
                    outcomes: [
                        { weight: 60, sanityHeal: 35, logKey: 'events.cit_gargoyle.cleanse_ok' },
                        { weight: 40, lootEpic: true, logKey: 'events.cit_gargoyle.cleanse_gift' }
                    ]
                },
                {
                    labelKey: 'events.cit_gargoyle.push',
                    outcomes: [
                        { weight: 30, lootChest: true, logKey: 'events.cit_gargoyle.push_ok' },
                        { weight: 40, hpDmg: 20, forceEncounter: true, logKey: 'events.cit_gargoyle.push_alive' },
                        { weight: 30, sanityDmg: 20, status: s('cursed'), logKey: 'events.cit_gargoyle.push_curse' }
                    ]
                },
                {
                    labelKey: 'events.cit_gargoyle.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.cit_gargoyle.skip' }
                    ]
                }
            ]
        }
    ],
    forest: [
        {
            id: 'th_for_roots', type: 'interactive', emoji: '🌿', nameKey: 'events.for_roots.name', descKey: 'events.for_roots.desc',
            choices: [
                {
                    labelKey: 'events.for_roots.cut', repairWeaponDmg: 2,
                    outcomes: [
                        { weight: 60, lootMaterial: true, logKey: 'events.for_roots.cut_ok' },
                        { weight: 20, lootChest: true, logKey: 'events.for_roots.cut_chest' },
                        { weight: 20, status: s('poison', { duration: 15 }), hpDmg: 5, logKey: 'events.for_roots.poison' }
                    ]
                },
                {
                    labelKey: 'events.for_roots.force',
                    outcomes: [
                        { weight: 40, logKey: 'events.for_roots.force_ok' },
                        { weight: 40, hpDmg: 10, status: s('bleed'), logKey: 'events.for_roots.force_fail' },
                        { weight: 20, hpDmg: 20, status: s('crippled'), logKey: 'events.for_roots.force_trap' }
                    ]
                },
                {
                    labelKey: 'events.for_roots.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.for_roots.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_for_spirit', type: 'interactive', emoji: '🌳', nameKey: 'events.for_spirit.name', descKey: 'events.for_spirit.desc',
            choices: [
                {
                    labelKey: 'events.for_spirit.offer', reqItemType: 'material_mana', consumeItem: true,
                    outcomes: [
                        { weight: 70, sanityHealPct: 1.0, status: s('regen', { duration: 20 }), logKey: 'events.for_spirit.ok' },
                        { weight: 30, lootEpic: true, logKey: 'events.for_spirit.gift' }
                    ]
                },
                {
                    labelKey: 'events.for_spirit.pray',
                    outcomes: [
                        { weight: 40, sanityHeal: 30, logKey: 'events.for_spirit.pray_ok' },
                        { weight: 40, sanityDmg: 20, status: s('cursed'), logKey: 'events.for_spirit.pray_anger' },
                        { weight: 20, hpDmg: 15, forceEncounter: true, logKey: 'events.for_spirit.pray_wrath' }
                    ]
                },
                {
                    labelKey: 'events.for_spirit.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.for_spirit.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_for_nest', type: 'interactive', emoji: '🪺', nameKey: 'events.for_nest.name', descKey: 'events.for_nest.desc',
            choices: [
                {
                    labelKey: 'events.for_nest.steal',
                    outcomes: [
                        { weight: 40, lootChest: true, forceEncounter: true, logKey: 'events.for_nest.steal' },
                        { weight: 30, lootEpic: true, forceEncounter: true, logKey: 'events.for_nest.steal_rich' },
                        { weight: 30, hpDmg: 20, status: s('bleed'), logKey: 'events.for_nest.steal_bitten' }
                    ]
                },
                {
                    labelKey: 'events.for_nest.watch', reqTrait: 't_pos_forest_expert',
                    outcomes: [
                        { weight: 70, xpGain: 350, logKey: 'events.for_nest.watch_pro' },
                        { weight: 30, sanityHeal: 25, logKey: 'events.for_nest.watch_peace' }
                    ]
                },
                {
                    labelKey: 'events.for_nest.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.for_nest.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_for_fairy', type: 'interactive', emoji: '🧚', nameKey: 'events.for_fairy.name', descKey: 'events.for_fairy.desc',
            choices: [
                {
                    labelKey: 'events.for_fairy.dance', reqTrait: 't_pos_agile',
                    outcomes: [
                        { weight: 70, sanityHeal: 40, status: s('blessed'), logKey: 'events.for_fairy.dance_great' },
                        { weight: 30, lootEpic: true, logKey: 'events.for_fairy.dance_gift' }
                    ]
                },
                {
                    labelKey: 'events.for_fairy.join',
                    outcomes: [
                        { weight: 40, sanityHeal: 25, logKey: 'events.for_fairy.join_ok' },
                        { weight: 40, hpDmg: 10, status: s('crippled'), logKey: 'events.for_fairy.join_fail' },
                        { weight: 20, sanityDmg: 30, status: s('daze'), logKey: 'events.for_fairy.join_lost' }
                    ]
                },
                {
                    labelKey: 'events.for_fairy.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.for_fairy.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_for_beast', type: 'interactive', emoji: '🐻', nameKey: 'events.for_beast.name', descKey: 'events.for_beast.desc',
            choices: [
                {
                    labelKey: 'events.for_beast.feed', reqItemType: 'consumable_food', consumeItem: true,
                    outcomes: [
                        { weight: 60, lootChest: true, logKey: 'events.for_beast.feed_ok' },
                        { weight: 40, xpGain: 300, logKey: 'events.for_beast.feed_friend' }
                    ]
                },
                {
                    labelKey: 'events.for_beast.talk',
                    outcomes: [
                        { weight: 30, lootMaterial: true, logKey: 'events.for_beast.talk_ok' },
                        { weight: 40, forceEncounter: true, logKey: 'events.for_beast.talk_fail' },
                        { weight: 30, hpDmg: 20, status: s('bleed'), forceEncounter: true, logKey: 'events.for_beast.talk_bitten' }
                    ]
                },
                {
                    labelKey: 'events.for_beast.threaten', reqStat: { stat: 'str', min: 14 },
                    outcomes: [
                        { weight: 60, logKey: 'events.for_beast.threaten_flee' },
                        { weight: 40, forceEncounter: true, logKey: 'events.for_beast.threaten_fight' }
                    ]
                }
            ]
        },
        {
            id: 'th_for_shrine', type: 'interactive', emoji: '⛩️', nameKey: 'events.for_shrine.name', descKey: 'events.for_shrine.desc',
            choices: [
                {
                    labelKey: 'events.for_shrine.cleanse', reqItem: 't_holywater', consumeItem: true,
                    outcomes: [
                        { weight: 70, sanityHeal: 40, status: s('blessed'), logKey: 'events.for_shrine.cleanse_ok' },
                        { weight: 30, xpGain: 250, logKey: 'events.for_shrine.cleanse_wisdom' }
                    ]
                },
                {
                    labelKey: 'events.for_shrine.pray',
                    outcomes: [
                        { weight: 40, sanityHeal: 20, logKey: 'events.for_shrine.pray_ok' },
                        { weight: 30, hpDmg: 10, status: s('cursed'), logKey: 'events.for_shrine.pray_curse' },
                        { weight: 30, sanityDmg: 20, logKey: 'events.for_shrine.pray_fear' }
                    ]
                },
                {
                    labelKey: 'events.for_shrine.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.for_shrine.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_for_wisps', type: 'interactive', emoji: '✨', nameKey: 'events.for_wisps.name', descKey: 'events.for_wisps.desc',
            choices: [
                {
                    labelKey: 'events.for_wisps.bottle', reqItem: 't_bottle', consumeItem: true,
                    outcomes: [
                        { weight: 70, lootEpic: true, logKey: 'events.for_wisps.bottle_ok' },
                        { weight: 30, xpGain: 400, logKey: 'events.for_wisps.bottle_wisdom' }
                    ]
                },
                {
                    labelKey: 'events.for_wisps.follow',
                    outcomes: [
                        { weight: 30, lootChest: true, logKey: 'events.for_wisps.follow_ok' },
                        { weight: 40, sanityDmg: 25, status: s('daze'), logKey: 'events.for_wisps.follow_lost' },
                        { weight: 30, forceEncounter: true, logKey: 'events.for_wisps.follow_trap' }
                    ]
                },
                {
                    labelKey: 'events.for_wisps.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.for_wisps.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_for_hunter', type: 'interactive', emoji: '🏹', nameKey: 'events.for_hunter.name', descKey: 'events.for_hunter.desc',
            choices: [
                {
                    labelKey: 'events.for_hunter.trade', reqItemType: 'material_ore', consumeItem: true,
                    outcomes: [
                        { weight: 80, lootChest: true, logKey: 'events.for_hunter.trade_ok' },
                        { weight: 20, lootMultiple: 2, logKey: 'events.for_hunter.trade_great' }
                    ]
                },
                {
                    labelKey: 'events.for_hunter.talk',
                    outcomes: [
                        { weight: 40, xpGain: 200, logKey: 'events.for_hunter.talk_ok' },
                        { weight: 30, sanityDmg: 15, logKey: 'events.for_hunter.talk_creep' },
                        { weight: 30, forceEncounter: true, logKey: 'events.for_hunter.talk_hostile' }
                    ]
                },
                {
                    labelKey: 'events.for_hunter.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.for_hunter.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_for_pool', type: 'interactive', emoji: '💧', nameKey: 'events.for_pool.name', descKey: 'events.for_pool.desc',
            choices: [
                {
                    labelKey: 'events.for_pool.drink', reqHp: { min: 20, cost: 0 },
                    outcomes: [
                        { weight: 50, hpHeal: 30, status: s('regen'), logKey: 'events.for_pool.drink_ok' },
                        { weight: 30, hpDmg: 20, status: s('poison'), logKey: 'events.for_pool.drink_sick' },
                        { weight: 20, sanityDmg: 20, logKey: 'events.for_pool.drink_vision' }
                    ]
                },
                {
                    labelKey: 'events.for_pool.bathe',
                    outcomes: [
                        { weight: 40, sanityHeal: 30, logKey: 'events.for_pool.bathe_ok' },
                        { weight: 30, hpDmg: 15, status: s('disease'), logKey: 'events.for_pool.bathe_leech' },
                        { weight: 30, forceEncounter: true, logKey: 'events.for_pool.bathe_ambush' }
                    ]
                },
                {
                    labelKey: 'events.for_pool.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.for_pool.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_for_monolith', type: 'interactive', emoji: '🪨', nameKey: 'events.for_monolith.name', descKey: 'events.for_monolith.desc',
            choices: [
                {
                    labelKey: 'events.for_monolith.study', reqTrait: 't_pos_scholar',
                    outcomes: [
                        { weight: 70, xpGain: 400, logKey: 'events.for_monolith.study_ok' },
                        { weight: 30, sanityHeal: 30, status: s('blessed'), logKey: 'events.for_monolith.study_peace' }
                    ]
                },
                {
                    labelKey: 'events.for_monolith.touch',
                    outcomes: [
                        { weight: 30, xpGain: 200, logKey: 'events.for_monolith.touch_ok' },
                        { weight: 40, sanityDmg: 30, status: s('cursed'), logKey: 'events.for_monolith.touch_mad' },
                        { weight: 30, hpDmg: 20, status: s('daze'), logKey: 'events.for_monolith.touch_shock' }
                    ]
                },
                {
                    labelKey: 'events.for_monolith.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.for_monolith.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_for_web', type: 'interactive', emoji: '🕸️', nameKey: 'events.for_web.name', descKey: 'events.for_web.desc',
            choices: [
                {
                    labelKey: 'events.for_web.burn', reqItem: 't_torch', consumeItem: true,
                    outcomes: [
                        { weight: 80, lootChest: true, logKey: 'events.for_web.burn_ok' },
                        { weight: 20, lootEpic: true, logKey: 'events.for_web.burn_great' }
                    ]
                },
                {
                    labelKey: 'events.for_web.cut', repairWeaponDmg: 3,
                    outcomes: [
                        { weight: 40, lootChest: true, logKey: 'events.for_web.cut_ok' },
                        { weight: 30, status: s('poison'), hpDmg: 15, logKey: 'events.for_web.cut_bite' },
                        { weight: 30, forceEncounter: true, logKey: 'events.for_web.cut_spider' }
                    ]
                },
                {
                    labelKey: 'events.for_web.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.for_web.skip' }
                    ]
                }
            ]
        }
    ],
    desert: [
        {
            id: 'th_des_debris', type: 'interactive', emoji: '🌪️', nameKey: 'events.des_debris.name', descKey: 'events.des_debris.desc',
            choices: [
                {
                    labelKey: 'events.des_debris.search', reqTrait: 't_pos_eagle_eye',
                    outcomes: [
                        { weight: 70, lootChest: true, logKey: 'events.des_debris.search_ok' },
                        { weight: 30, lootEpic: true, logKey: 'events.des_debris.search_great' }
                    ]
                },
                {
                    labelKey: 'events.des_debris.weather',
                    outcomes: [
                        { weight: 30, logKey: 'events.des_debris.weather_ok' },
                        { weight: 50, hpDmg: 8, sanityDmg: 5, status: s('burn', { duration: 10 }), logKey: 'events.des_debris.hit' },
                        { weight: 20, sanityDmg: 20, status: s('daze'), logKey: 'events.des_debris.lost' }
                    ]
                },
                {
                    labelKey: 'events.des_debris.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.des_debris.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_des_mirage', type: 'interactive', emoji: '🌅', nameKey: 'events.des_mirage.name', descKey: 'events.des_mirage.desc',
            choices: [
                {
                    labelKey: 'events.des_mirage.bottle', reqItem: 't_bottle', consumeItem: true,
                    outcomes: [
                        { weight: 60, lootMaterial: true, logKey: 'events.des_mirage.bottle_ok' },
                        { weight: 40, sanityHeal: 20, logKey: 'events.des_mirage.bottle_water' }
                    ]
                },
                {
                    labelKey: 'events.des_mirage.follow',
                    outcomes: [
                        { weight: 30, xpGain: 300, logKey: 'events.des_mirage.follow_ok' },
                        { weight: 40, hpDmg: 12, sanityDmg: 20, status: s('cursed'), logKey: 'events.des_mirage.fail' },
                        { weight: 30, hpDmg: 15, status: s('burn'), logKey: 'events.des_mirage.sun' }
                    ]
                },
                {
                    labelKey: 'events.des_mirage.resist',
                    outcomes: [
                        { weight: 70, sanityDmg: 5, logKey: 'events.des_mirage.ok' },
                        { weight: 30, xpGain: 150, logKey: 'events.des_mirage.resist_will' }
                    ]
                }
            ]
        },
        {
            id: 'th_des_monolith', type: 'interactive', emoji: '🗿', nameKey: 'events.des_monolith.name', descKey: 'events.des_monolith.desc',
            choices: [
                {
                    labelKey: 'events.des_monolith.transcribe', reqItemType: 'material_paper', consumeItem: true,
                    outcomes: [
                        { weight: 80, lootEpic: true, logKey: 'events.des_monolith.transcribe_ok' },
                        { weight: 20, xpGain: 500, logKey: 'events.des_monolith.transcribe_wisdom' }
                    ]
                },
                {
                    labelKey: 'events.des_monolith.read',
                    outcomes: [
                        { weight: 50, xpGain: 250, logKey: 'events.des_monolith.ok' },
                        { weight: 50, status: s('cursed', { duration: Infinity }), logKey: 'events.des_monolith.fail' }
                    ]
                },
                {
                    labelKey: 'events.des_monolith.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.des_monolith.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_des_scorpion', type: 'interactive', emoji: '🦂', nameKey: 'events.des_scorpion.name', descKey: 'events.des_scorpion.desc',
            choices: [
                {
                    labelKey: 'events.des_scorpion.crush', reqStat: { stat: 'str', min: 14 },
                    outcomes: [
                        { weight: 70, lootMaterial: true, logKey: 'events.des_scorpion.crush_ok' },
                        { weight: 30, lootChest: true, logKey: 'events.des_scorpion.crush_stash' }
                    ]
                },
                {
                    labelKey: 'events.des_scorpion.poke',
                    outcomes: [
                        { weight: 30, lootMaterial: true, forceEncounter: true, logKey: 'events.des_scorpion.ok' },
                        { weight: 70, status: s('poison', { duration: 15 }), hpDmg: 10, forceEncounter: true, logKey: 'events.des_scorpion.sting' }
                    ]
                },
                {
                    labelKey: 'events.des_scorpion.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.des_scorpion.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_des_quicksand', type: 'interactive', emoji: '🏜️', nameKey: 'events.des_quicksand.name', descKey: 'events.des_quicksand.desc',
            choices: [
                {
                    labelKey: 'events.des_quicksand.rope', reqItemType: 'material_rope', consumeItem: true,
                    outcomes: [
                        { weight: 80, logKey: 'events.des_quicksand.rope_ok' },
                        { weight: 20, lootEpic: true, logKey: 'events.des_quicksand.rope_chest' }
                    ]
                },
                {
                    labelKey: 'events.des_quicksand.struggle',
                    outcomes: [
                        { weight: 40, logKey: 'events.des_quicksand.escape' },
                        { weight: 40, lootLoss: true, logKey: 'events.des_quicksand.sink' },
                        { weight: 20, hpDmg: 20, status: s('crippled'), logKey: 'events.des_quicksand.hurt' }
                    ]
                },
                {
                    labelKey: 'events.des_quicksand.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.des_quicksand.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_des_oasis', type: 'interactive', emoji: '🌴', nameKey: 'events.des_oasis.name', descKey: 'events.des_oasis.desc',
            choices: [
                {
                    labelKey: 'events.des_oasis.drink', reqHp: { min: 20, cost: 0 },
                    outcomes: [
                        { weight: 60, hpHeal: 40, status: s('regen'), logKey: 'events.des_oasis.drink_ok' },
                        { weight: 40, hpDmg: 15, status: s('disease'), logKey: 'events.des_oasis.drink_bad' }
                    ]
                },
                {
                    labelKey: 'events.des_oasis.rest',
                    outcomes: [
                        { weight: 40, sanityHeal: 30, logKey: 'events.des_oasis.rest_ok' },
                        { weight: 30, forceEncounter: true, logKey: 'events.des_oasis.rest_ambush' },
                        { weight: 30, sanityDmg: 15, status: s('daze'), logKey: 'events.des_oasis.rest_mirage' }
                    ]
                },
                {
                    labelKey: 'events.des_oasis.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.des_oasis.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_des_tomb', type: 'interactive', emoji: '🛕', nameKey: 'events.des_tomb.name', descKey: 'events.des_tomb.desc',
            choices: [
                {
                    labelKey: 'events.des_tomb.pick', reqItem: 't_lockpick', consumeItem: true,
                    outcomes: [
                        { weight: 70, lootEpic: true, logKey: 'events.des_tomb.pick_ok' },
                        { weight: 30, lootMultiple: 2, logKey: 'events.des_tomb.pick_wealth' }
                    ]
                },
                {
                    labelKey: 'events.des_tomb.force', repairWeaponDmg: 5,
                    outcomes: [
                        { weight: 30, lootChest: true, logKey: 'events.des_tomb.force_ok' },
                        { weight: 40, status: s('cursed'), sanityDmg: 20, logKey: 'events.des_tomb.force_curse' },
                        { weight: 30, forceEncounter: true, logKey: 'events.des_tomb.force_guard' }
                    ]
                },
                {
                    labelKey: 'events.des_tomb.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.des_tomb.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_des_merchant', type: 'interactive', emoji: '🐪', nameKey: 'events.des_merchant.name', descKey: 'events.des_merchant.desc',
            choices: [
                {
                    labelKey: 'events.des_merchant.trade', reqItemType: 'consumable_food', consumeItem: true,
                    outcomes: [
                        { weight: 80, lootChest: true, logKey: 'events.des_merchant.trade_ok' },
                        { weight: 20, lootEpic: true, logKey: 'events.des_merchant.trade_great' }
                    ]
                },
                {
                    labelKey: 'events.des_merchant.rob',
                    outcomes: [
                        { weight: 30, lootMultiple: 3, logKey: 'events.des_merchant.rob_ok' },
                        { weight: 40, forceEncounter: true, logKey: 'events.des_merchant.rob_fight' },
                        { weight: 30, hpDmg: 25, status: s('bleed'), logKey: 'events.des_merchant.rob_fail' }
                    ]
                },
                {
                    labelKey: 'events.des_merchant.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.des_merchant.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_des_bones', type: 'interactive', emoji: '🦴', nameKey: 'events.des_bones.name', descKey: 'events.des_bones.desc',
            choices: [
                {
                    labelKey: 'events.des_bones.bury', reqItem: 't_shovel', consumeItem: true,
                    outcomes: [
                        { weight: 70, sanityHeal: 30, logKey: 'events.des_bones.bury_ok' },
                        { weight: 30, xpGain: 300, logKey: 'events.des_bones.bury_peace' }
                    ]
                },
                {
                    labelKey: 'events.des_bones.search',
                    outcomes: [
                        { weight: 40, lootGold: 100, logKey: 'events.des_bones.search_ok' },
                        { weight: 30, status: s('disease'), hpDmg: 10, logKey: 'events.des_bones.search_sick' },
                        { weight: 30, forceEncounter: true, logKey: 'events.des_bones.search_undead' }
                    ]
                },
                {
                    labelKey: 'events.des_bones.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.des_bones.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_des_statue', type: 'interactive', emoji: '🗽', nameKey: 'events.des_statue.name', descKey: 'events.des_statue.desc',
            choices: [
                {
                    labelKey: 'events.des_statue.cleanse', reqItem: 't_holywater', consumeItem: true,
                    outcomes: [
                        { weight: 60, status: s('blessed'), sanityHeal: 40, logKey: 'events.des_statue.cleanse_ok' },
                        { weight: 40, lootEpic: true, logKey: 'events.des_statue.cleanse_gift' }
                    ]
                },
                {
                    labelKey: 'events.des_statue.pray',
                    outcomes: [
                        { weight: 30, sanityHeal: 20, logKey: 'events.des_statue.pray_ok' },
                        { weight: 40, status: s('cursed'), sanityDmg: 15, logKey: 'events.des_statue.pray_curse' },
                        { weight: 30, hpDmg: 15, status: s('burn'), logKey: 'events.des_statue.pray_wrath' }
                    ]
                },
                {
                    labelKey: 'events.des_statue.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.des_statue.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_des_cave', type: 'interactive', emoji: '🕳️', nameKey: 'events.des_cave.name', descKey: 'events.des_cave.desc',
            choices: [
                {
                    labelKey: 'events.des_cave.torch', reqItem: 't_torch', consumeItem: true,
                    outcomes: [
                        { weight: 70, lootChest: true, logKey: 'events.des_cave.torch_ok' },
                        { weight: 30, xpGain: 350, logKey: 'events.des_cave.torch_deep' }
                    ]
                },
                {
                    labelKey: 'events.des_cave.enter',
                    outcomes: [
                        { weight: 30, lootMaterial: true, logKey: 'events.des_cave.enter_ok' },
                        { weight: 40, sanityDmg: 25, status: s('daze'), logKey: 'events.des_cave.enter_lost' },
                        { weight: 30, forceEncounter: true, logKey: 'events.des_cave.enter_beast' }
                    ]
                },
                {
                    labelKey: 'events.des_cave.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.des_cave.skip' }
                    ]
                }
            ]
        }
    ],
    snow: [
        {
            id: 'th_snow_cabin', type: 'interactive', emoji: '🏚️', nameKey: 'events.snow_cabin.name', descKey: 'events.snow_cabin.desc',
            choices: [
                {
                    labelKey: 'events.snow_cabin.fire', reqItemType: 'material_wood', consumeItem: true,
                    outcomes: [
                        { weight: 70, hpHealPct: 1.0, sanityHeal: 30, status: s('regen'), logKey: 'events.snow_cabin.fire_ok' },
                        { weight: 30, lootChest: true, logKey: 'events.snow_cabin.fire_stash' }
                    ]
                },
                {
                    labelKey: 'events.snow_cabin.rest',
                    outcomes: [
                        { weight: 40, hpHeal: 30, logKey: 'events.snow_cabin.rest_ok' },
                        { weight: 40, hpHeal: 20, status: s('crippled', { id: 'frostbite', icon: '🥶', labelKey: 'status.frostbite', duration: 15 }), logKey: 'events.snow_cabin.cold' },
                        { weight: 20, forceEncounter: true, logKey: 'events.snow_cabin.rest_hunt' }
                    ]
                },
                {
                    labelKey: 'events.snow_cabin.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.snow_cabin.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_snow_echo', type: 'interactive', emoji: '🏔️', nameKey: 'events.snow_echo.name', descKey: 'events.snow_echo.desc',
            choices: [
                {
                    labelKey: 'events.snow_echo.shout',
                    outcomes: [
                        { weight: 30, sanityHeal: 20, logKey: 'events.snow_echo.shout_free' },
                        { weight: 40, hpDmg: 20, sanityDmg: 10, logKey: 'events.snow_echo.shout_ava' },
                        { weight: 30, forceEncounter: true, logKey: 'events.snow_echo.shout_wake' }
                    ]
                },
                {
                    labelKey: 'events.snow_echo.listen',
                    outcomes: [
                        { weight: 40, xpGain: 300, logKey: 'events.snow_echo.listen_wis' },
                        { weight: 40, sanityDmg: 20, logKey: 'events.snow_echo.listen_mad' },
                        { weight: 20, lootMaterial: true, logKey: 'events.snow_echo.listen_wind' }
                    ]
                },
                {
                    labelKey: 'events.snow_echo.quiet',
                    outcomes: [
                        { weight: 80, logKey: 'events.snow_echo.ok' },
                        { weight: 20, sanityHeal: 10, logKey: 'events.snow_echo.peace' }
                    ]
                }
            ]
        },
        {
            id: 'th_snow_crystal', type: 'interactive', emoji: '❄️', nameKey: 'events.snow_crystal.name', descKey: 'events.snow_crystal.desc',
            choices: [
                {
                    labelKey: 'events.snow_crystal.tool', reqItemType: 'material_ore', consumeItem: true,
                    outcomes: [
                        { weight: 80, lootMaterial: true, logKey: 'events.snow_crystal.tool_ok' },
                        { weight: 20, lootEpic: true, logKey: 'events.snow_crystal.tool_gem' }
                    ]
                },
                {
                    labelKey: 'events.snow_crystal.bare',
                    outcomes: [
                        { weight: 40, lootMaterial: true, logKey: 'events.snow_crystal.bare_ok' },
                        { weight: 40, status: s('bleed', { duration: 5 }), hpDmg: 10, logKey: 'events.snow_crystal.bare_cut' },
                        { weight: 20, status: s('crippled', { id: 'frostbite', icon: '🥶', labelKey: 'status.frostbite' }), logKey: 'events.snow_crystal.bare_cold' }
                    ]
                },
                {
                    labelKey: 'events.snow_crystal.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.snow_crystal.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_snow_hunter', type: 'interactive', emoji: '🧊', nameKey: 'events.snow_hunter.name', descKey: 'events.snow_hunter.desc',
            choices: [
                {
                    labelKey: 'events.snow_hunter.fire', reqItem: 't_torch', consumeItem: true,
                    outcomes: [
                        { weight: 70, lootEpic: true, logKey: 'events.snow_hunter.fire_ok' },
                        { weight: 30, lootMultiple: 2, logKey: 'events.snow_hunter.fire_thaw' }
                    ]
                },
                {
                    labelKey: 'events.snow_hunter.loot',
                    outcomes: [
                        { weight: 40, lootChest: true, logKey: 'events.snow_hunter.loot_ok' },
                        { weight: 30, sanityDmg: 20, status: s('cursed'), logKey: 'events.snow_hunter.loot_curse' },
                        { weight: 30, forceEncounter: true, logKey: 'events.snow_hunter.loot_wake' }
                    ]
                },
                {
                    labelKey: 'events.snow_hunter.mourn',
                    outcomes: [
                        { weight: 70, sanityHeal: 15, logKey: 'events.snow_hunter.mourn' },
                        { weight: 30, status: s('blessed'), logKey: 'events.snow_hunter.mourn_peace' }
                    ]
                }
            ]
        },
        {
            id: 'th_snow_lake', type: 'interactive', emoji: '🌊', nameKey: 'events.snow_lake.name', descKey: 'events.snow_lake.desc',
            choices: [
                {
                    labelKey: 'events.snow_lake.fish', reqItemType: 'consumable_food', consumeItem: true,
                    outcomes: [
                        { weight: 70, lootChest: true, logKey: 'events.snow_lake.fish_ok' },
                        { weight: 30, lootEpic: true, logKey: 'events.snow_lake.fish_catch' }
                    ]
                },
                {
                    labelKey: 'events.snow_lake.skate',
                    outcomes: [
                        { weight: 50, lootChest: true, logKey: 'events.snow_lake.skate_ok' },
                        { weight: 30, hpDmgPct: 0.5, status: s('crippled', { id: 'frostbite', icon: '🥶', labelKey: 'status.frostbite' }), logKey: 'events.snow_lake.crack' },
                        { weight: 20, forceEncounter: true, logKey: 'events.snow_lake.skate_beast' }
                    ]
                },
                {
                    labelKey: 'events.snow_lake.bypass',
                    outcomes: [
                        { weight: 100, logKey: 'events.snow_lake.bypass' }
                    ]
                }
            ]
        },
        {
            id: 'th_snow_statue', type: 'interactive', emoji: '🗿', nameKey: 'events.snow_statue.name', descKey: 'events.snow_statue.desc',
            choices: [
                {
                    labelKey: 'events.snow_statue.offer', reqItemType: 'material_mana', consumeItem: true,
                    outcomes: [
                        { weight: 70, sanityHeal: 40, status: s('blessed'), logKey: 'events.snow_statue.offer_ok' },
                        { weight: 30, lootEpic: true, logKey: 'events.snow_statue.offer_gift' }
                    ]
                },
                {
                    labelKey: 'events.snow_statue.chip', repairWeaponDmg: 5,
                    outcomes: [
                        { weight: 40, lootMaterial: true, logKey: 'events.snow_statue.chip_ok' },
                        { weight: 30, status: s('cursed'), sanityDmg: 20, logKey: 'events.snow_statue.chip_curse' },
                        { weight: 30, forceEncounter: true, logKey: 'events.snow_statue.chip_wake' }
                    ]
                },
                {
                    labelKey: 'events.snow_statue.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.snow_statue.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_snow_avalanche', type: 'interactive', emoji: '🌨️', nameKey: 'events.snow_avalanche.name', descKey: 'events.snow_avalanche.desc',
            choices: [
                {
                    labelKey: 'events.snow_avalanche.dig', reqItem: 't_shovel', consumeItem: true,
                    outcomes: [
                        { weight: 70, lootChest: true, logKey: 'events.snow_avalanche.dig_ok' },
                        { weight: 30, lootEpic: true, logKey: 'events.snow_avalanche.dig_deep' }
                    ]
                },
                {
                    labelKey: 'events.snow_avalanche.search',
                    outcomes: [
                        { weight: 40, lootMaterial: true, logKey: 'events.snow_avalanche.search_ok' },
                        { weight: 30, hpDmg: 20, status: s('crippled', { id: 'frostbite', icon: '🥶', labelKey: 'status.frostbite' }), logKey: 'events.snow_avalanche.search_cold' },
                        { weight: 30, forceEncounter: true, logKey: 'events.snow_avalanche.search_ambush' }
                    ]
                },
                {
                    labelKey: 'events.snow_avalanche.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.snow_avalanche.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_snow_beast', type: 'interactive', emoji: '🐻‍❄️', nameKey: 'events.snow_beast.name', descKey: 'events.snow_beast.desc',
            choices: [
                {
                    labelKey: 'events.snow_beast.feed', reqItemType: 'consumable_food', consumeItem: true,
                    outcomes: [
                        { weight: 70, lootChest: true, logKey: 'events.snow_beast.feed_ok' },
                        { weight: 30, xpGain: 350, logKey: 'events.snow_beast.feed_friend' }
                    ]
                },
                {
                    labelKey: 'events.snow_beast.sneak', reqTrait: 't_pos_agile',
                    outcomes: [
                        { weight: 60, lootChest: true, logKey: 'events.snow_beast.sneak_ok' },
                        { weight: 20, forceEncounter: true, logKey: 'events.snow_beast.sneak_caught' },
                        { weight: 20, lootEpic: true, logKey: 'events.snow_beast.sneak_great' }
                    ]
                },
                {
                    labelKey: 'events.snow_beast.skip',
                    outcomes: [
                        { weight: 50, logKey: 'events.snow_beast.skip_ok' },
                        { weight: 50, forceEncounter: true, logKey: 'events.snow_beast.skip_chase' }
                    ]
                }
            ]
        },
        {
            id: 'th_snow_shrine', type: 'interactive', emoji: '⛩️', nameKey: 'events.snow_shrine.name', descKey: 'events.snow_shrine.desc',
            choices: [
                {
                    labelKey: 'events.snow_shrine.cleanse', reqItem: 't_holywater', consumeItem: true,
                    outcomes: [
                        { weight: 70, sanityHeal: 40, status: s('blessed'), logKey: 'events.snow_shrine.cleanse_ok' },
                        { weight: 30, xpGain: 300, logKey: 'events.snow_shrine.cleanse_wis' }
                    ]
                },
                {
                    labelKey: 'events.snow_shrine.pray',
                    outcomes: [
                        { weight: 40, sanityHeal: 20, logKey: 'events.snow_shrine.pray_ok' },
                        { weight: 40, sanityDmg: 20, status: s('cursed'), logKey: 'events.snow_shrine.pray_curse' },
                        { weight: 20, hpDmg: 15, status: s('crippled', { id: 'frostbite', icon: '🥶', labelKey: 'status.frostbite' }), logKey: 'events.snow_shrine.pray_cold' }
                    ]
                },
                {
                    labelKey: 'events.snow_shrine.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.snow_shrine.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_snow_camp', type: 'interactive', emoji: '⛺', nameKey: 'events.snow_camp.name', descKey: 'events.snow_camp.desc',
            choices: [
                {
                    labelKey: 'events.snow_camp.scout', reqTrait: 't_pos_eagle_eye',
                    outcomes: [
                        { weight: 70, lootChest: true, logKey: 'events.snow_camp.scout_ok' },
                        { weight: 30, lootEpic: true, logKey: 'events.snow_camp.scout_great' }
                    ]
                },
                {
                    labelKey: 'events.snow_camp.search',
                    outcomes: [
                        { weight: 40, lootMaterial: true, logKey: 'events.snow_camp.search_ok' },
                        { weight: 30, forceEncounter: true, logKey: 'events.snow_camp.search_fight' },
                        { weight: 30, hpDmg: 15, status: s('bleed'), logKey: 'events.snow_camp.search_trap' }
                    ]
                },
                {
                    labelKey: 'events.snow_camp.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.snow_camp.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_snow_ice', type: 'interactive', emoji: '🧊', nameKey: 'events.snow_ice.name', descKey: 'events.snow_ice.desc',
            choices: [
                {
                    labelKey: 'events.snow_ice.melt', reqItem: 't_torch', consumeItem: true,
                    outcomes: [
                        { weight: 80, lootChest: true, logKey: 'events.snow_ice.melt_ok' },
                        { weight: 20, lootEpic: true, logKey: 'events.snow_ice.melt_great' }
                    ]
                },
                {
                    labelKey: 'events.snow_ice.smash', reqStat: { stat: 'str', min: 14 },
                    outcomes: [
                        { weight: 50, lootChest: true, hpDmg: 10, logKey: 'events.snow_ice.smash_ok' },
                        { weight: 50, hpDmg: 20, status: s('bleed'), logKey: 'events.snow_ice.smash_hurt' }
                    ]
                },
                {
                    labelKey: 'events.snow_ice.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.snow_ice.skip' }
                    ]
                }
            ]
        }
    ],
    crypt: [
        {
            id: 'th_crypt_chalice', type: 'interactive', emoji: '🏺', nameKey: 'events.crypt_chalice.name', descKey: 'events.crypt_chalice.desc',
            choices: [
                {
                    labelKey: 'events.crypt_chalice.holy', reqItem: 't_holywater', consumeItem: true,
                    outcomes: [
                        { weight: 70, hpHealPct: 1.0, sanityHeal: 40, status: s('blessed'), logKey: 'events.crypt_chalice.holy_ok' },
                        { weight: 30, lootEpic: true, logKey: 'events.crypt_chalice.holy_gift' }
                    ]
                },
                {
                    labelKey: 'events.crypt_chalice.drink', reqSanity: { min: 40, cost: 30 },
                    outcomes: [
                        { weight: 40, hpHealPct: 1.0, sanityDmg: 20, logKey: 'events.crypt_chalice.drink' },
                        { weight: 30, hpDmg: 20, status: s('disease'), logKey: 'events.crypt_chalice.drink_sick' },
                        { weight: 30, status: s('cursed'), logKey: 'events.crypt_chalice.drink_curse' }
                    ]
                },
                {
                    labelKey: 'events.crypt_chalice.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.crypt_chalice.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_crypt_mummy', type: 'interactive', emoji: '🫙', nameKey: 'events.crypt_mummy.name', descKey: 'events.crypt_mummy.desc',
            choices: [
                {
                    labelKey: 'events.crypt_mummy.key', reqItem: 't_key', consumeItem: true,
                    outcomes: [
                        { weight: 80, lootEpic: true, logKey: 'events.crypt_mummy.key_ok' },
                        { weight: 20, lootMultiple: 2, logKey: 'events.crypt_mummy.key_wealth' }
                    ]
                },
                {
                    labelKey: 'events.crypt_mummy.pry', repairWeaponDmg: 10,
                    outcomes: [
                        { weight: 40, lootEpic: true, status: s('cursed'), status2: s('bleed', { duration: 20 }), logKey: 'events.crypt_mummy.pry' },
                        { weight: 30, hpDmg: 20, status: s('disease'), logKey: 'events.crypt_mummy.pry_dust' },
                        { weight: 30, forceEncounter: true, logKey: 'events.crypt_mummy.pry_wake' }
                    ]
                },
                {
                    labelKey: 'events.crypt_mummy.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.crypt_mummy.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_crypt_web', type: 'interactive', emoji: '🕸️', nameKey: 'events.crypt_web.name', descKey: 'events.crypt_web.desc',
            choices: [
                {
                    labelKey: 'events.crypt_web.torch', reqItem: 't_torch', consumeItem: true,
                    outcomes: [
                        { weight: 60, lootChest: true, logKey: 'events.crypt_web.torch_ok' },
                        { weight: 40, logKey: 'events.crypt_web.torch_burn' }
                    ]
                },
                {
                    labelKey: 'events.crypt_web.push',
                    outcomes: [
                        { weight: 40, lootMaterial: true, logKey: 'events.crypt_web.push_ok' },
                        { weight: 30, forceEncounter: true, status: s('poison'), logKey: 'events.crypt_web.spider' },
                        { weight: 30, hpDmg: 15, status: s('daze'), logKey: 'events.crypt_web.push_stuck' }
                    ]
                },
                {
                    labelKey: 'events.crypt_web.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.crypt_web.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_crypt_vision', type: 'interactive', emoji: '💀', nameKey: 'events.crypt_vision.name', descKey: 'events.crypt_vision.desc',
            choices: [
                {
                    labelKey: 'events.crypt_vision.holy', reqItem: 't_holywater', consumeItem: true,
                    outcomes: [
                        { weight: 80, sanityHeal: 40, logKey: 'events.crypt_vision.ok' },
                        { weight: 20, xpGain: 300, logKey: 'events.crypt_vision.holy_wis' }
                    ]
                },
                {
                    labelKey: 'events.crypt_vision.pray',
                    outcomes: [
                        { weight: 40, xpGain: 200, logKey: 'events.crypt_vision.pray_ok' },
                        { weight: 30, forceEncounter: true, logKey: 'events.crypt_vision.spawn' },
                        { weight: 30, sanityDmg: 30, status: s('cursed'), logKey: 'events.crypt_vision.pray_mad' }
                    ]
                },
                {
                    labelKey: 'events.crypt_vision.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.crypt_vision.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_crypt_idol', type: 'interactive', emoji: '🕍', nameKey: 'events.crypt_idol.name', descKey: 'events.crypt_idol.desc',
            choices: [
                {
                    labelKey: 'events.crypt_idol.donate', lootGold: -100,
                    outcomes: [
                        { weight: 70, status: s('blessed', { duration: Infinity }), logKey: 'events.crypt_idol.donate_ok' },
                        { weight: 30, lootEpic: true, logKey: 'events.crypt_idol.donate_gift' }
                    ]
                },
                {
                    labelKey: 'events.crypt_idol.spit', reqSanity: { min: 30, cost: 0 },
                    outcomes: [
                        { weight: 30, lootGold: 200, logKey: 'events.crypt_idol.spit_loot' },
                        { weight: 40, status: s('cursed'), status2: s('crippled'), logKey: 'events.crypt_idol.spit_bad' },
                        { weight: 30, forceEncounter: true, logKey: 'events.crypt_idol.spit_wake' }
                    ]
                },
                {
                    labelKey: 'events.crypt_idol.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.crypt_idol.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_crypt_sarcophagus', type: 'interactive', emoji: '⚰️', nameKey: 'events.crypt_sarcophagus.name', descKey: 'events.crypt_sarcophagus.desc',
            choices: [
                {
                    labelKey: 'events.crypt_sarcophagus.open', reqStat: { stat: 'str', min: 14 },
                    outcomes: [
                        { weight: 60, lootChest: true, logKey: 'events.crypt_sarcophagus.open_ok' },
                        { weight: 40, lootEpic: true, logKey: 'events.crypt_sarcophagus.open_great' }
                    ]
                },
                {
                    labelKey: 'events.crypt_sarcophagus.force', repairWeaponDmg: 8,
                    outcomes: [
                        { weight: 30, lootChest: true, logKey: 'events.crypt_sarcophagus.force_ok' },
                        { weight: 40, forceEncounter: true, logKey: 'events.crypt_sarcophagus.force_wake' },
                        { weight: 30, status: s('disease'), hpDmg: 15, logKey: 'events.crypt_sarcophagus.force_dust' }
                    ]
                },
                {
                    labelKey: 'events.crypt_sarcophagus.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.crypt_sarcophagus.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_crypt_altar', type: 'interactive', emoji: '🕎', nameKey: 'events.crypt_altar.name', descKey: 'events.crypt_altar.desc',
            choices: [
                {
                    labelKey: 'events.crypt_altar.blood', reqHp: { min: 30, cost: 20 },
                    outcomes: [
                        { weight: 70, lootEpic: true, status: s('blessed'), logKey: 'events.crypt_altar.blood_ok' },
                        { weight: 30, xpGain: 400, logKey: 'events.crypt_altar.blood_wis' }
                    ]
                },
                {
                    labelKey: 'events.crypt_altar.loot',
                    outcomes: [
                        { weight: 40, lootChest: true, logKey: 'events.crypt_altar.loot_ok' },
                        { weight: 30, sanityDmg: 30, status: s('cursed'), logKey: 'events.crypt_altar.loot_curse' },
                        { weight: 30, forceEncounter: true, logKey: 'events.crypt_altar.loot_guard' }
                    ]
                },
                {
                    labelKey: 'events.crypt_altar.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.crypt_altar.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_crypt_urn', type: 'interactive', emoji: '⚱️', nameKey: 'events.crypt_urn.name', descKey: 'events.crypt_urn.desc',
            choices: [
                {
                    labelKey: 'events.crypt_urn.respect', reqTrait: 't_pos_scholar',
                    outcomes: [
                        { weight: 80, sanityHeal: 30, logKey: 'events.crypt_urn.respect_ok' },
                        { weight: 20, xpGain: 200, logKey: 'events.crypt_urn.respect_info' }
                    ]
                },
                {
                    labelKey: 'events.crypt_urn.smash', repairWeaponDmg: 2,
                    outcomes: [
                        { weight: 40, lootGold: 150, logKey: 'events.crypt_urn.smash_ok' },
                        { weight: 30, status: s('disease'), hpDmg: 10, logKey: 'events.crypt_urn.smash_ash' },
                        { weight: 30, forceEncounter: true, logKey: 'events.crypt_urn.smash_spirit' }
                    ]
                },
                {
                    labelKey: 'events.crypt_urn.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.crypt_urn.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_crypt_fresco', type: 'interactive', emoji: '🖼️', nameKey: 'events.crypt_fresco.name', descKey: 'events.crypt_fresco.desc',
            choices: [
                {
                    labelKey: 'events.crypt_fresco.copy', reqItemType: 'material_paper', consumeItem: true,
                    outcomes: [
                        { weight: 70, xpGain: 400, logKey: 'events.crypt_fresco.copy_ok' },
                        { weight: 30, lootEpic: true, logKey: 'events.crypt_fresco.copy_map' }
                    ]
                },
                {
                    labelKey: 'events.crypt_fresco.study',
                    outcomes: [
                        { weight: 40, xpGain: 250, logKey: 'events.crypt_fresco.study_ok' },
                        { weight: 30, sanityDmg: 25, status: s('daze'), logKey: 'events.crypt_fresco.study_mad' },
                        { weight: 30, status: s('cursed'), logKey: 'events.crypt_fresco.study_curse' }
                    ]
                },
                {
                    labelKey: 'events.crypt_fresco.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.crypt_fresco.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_crypt_statue', type: 'interactive', emoji: '🗽', nameKey: 'events.crypt_statue.name', descKey: 'events.crypt_statue.desc',
            choices: [
                {
                    labelKey: 'events.crypt_statue.cleanse', reqItem: 't_holywater', consumeItem: true,
                    outcomes: [
                        { weight: 70, sanityHeal: 40, status: s('blessed'), logKey: 'events.crypt_statue.cleanse_ok' },
                        { weight: 30, lootChest: true, logKey: 'events.crypt_statue.cleanse_gift' }
                    ]
                },
                {
                    labelKey: 'events.crypt_statue.loot',
                    outcomes: [
                        { weight: 30, lootChest: true, logKey: 'events.crypt_statue.loot_ok' },
                        { weight: 40, forceEncounter: true, logKey: 'events.crypt_statue.loot_guard' },
                        { weight: 30, hpDmg: 20, status: s('crippled'), logKey: 'events.crypt_statue.loot_trap' }
                    ]
                },
                {
                    labelKey: 'events.crypt_statue.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.crypt_statue.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_crypt_chasm', type: 'interactive', emoji: '🕳️', nameKey: 'events.crypt_chasm.name', descKey: 'events.crypt_chasm.desc',
            choices: [
                {
                    labelKey: 'events.crypt_chasm.rope', reqItemType: 'material_rope', consumeItem: true,
                    outcomes: [
                        { weight: 70, lootChest: true, logKey: 'events.crypt_chasm.rope_ok' },
                        { weight: 30, lootEpic: true, logKey: 'events.crypt_chasm.rope_deep' }
                    ]
                },
                {
                    labelKey: 'events.crypt_chasm.jump', reqTrait: 't_pos_agile',
                    outcomes: [
                        { weight: 60, xpGain: 300, logKey: 'events.crypt_chasm.jump_ok' },
                        { weight: 20, hpDmg: 30, status: s('crippled'), logKey: 'events.crypt_chasm.jump_fall' },
                        { weight: 20, lootChest: true, logKey: 'events.crypt_chasm.jump_lucky' }
                    ]
                },
                {
                    labelKey: 'events.crypt_chasm.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.crypt_chasm.skip' }
                    ]
                }
            ]
        }
    ],
    abyss: [
        {
            id: 'th_aby_rift', type: 'interactive', emoji: '🌌', nameKey: 'events.aby_rift.name', descKey: 'events.aby_rift.desc',
            choices: [
                {
                    labelKey: 'events.aby_rift.reach', reqSanity: { min: 50, cost: 20 },
                    outcomes: [
                        { weight: 60, xpGain: 500, logKey: 'events.aby_rift.reach_wis' },
                        { weight: 40, lootEpic: true, logKey: 'events.aby_rift.reach_gift' }
                    ]
                },
                {
                    labelKey: 'events.aby_rift.stare',
                    outcomes: [
                        { weight: 40, hpHealPct: 1.0, sanityHealPct: 1.0, logKey: 'events.aby_rift.stare_max' },
                        { weight: 30, hpDmgPct: 0.99, logKey: 'events.aby_rift.stare_min' },
                        { weight: 30, sanityDmg: 40, status: s('cursed', { duration: Infinity }), logKey: 'events.aby_rift.stare_mad' }
                    ]
                },
                {
                    labelKey: 'events.aby_rift.close',
                    outcomes: [
                        { weight: 80, sanityDmg: 5, logKey: 'events.aby_rift.close' },
                        { weight: 20, forceEncounter: true, logKey: 'events.aby_rift.close_fail' }
                    ]
                }
            ]
        },
        {
            id: 'th_aby_memory', type: 'interactive', emoji: '🫧', nameKey: 'events.aby_memory.name', descKey: 'events.aby_memory.desc',
            choices: [
                {
                    labelKey: 'events.aby_memory.touch', reqItemType: 'material_mana', consumeItem: true,
                    outcomes: [
                        { weight: 70, sanityHeal: 50, logKey: 'events.aby_memory.touch_ok' },
                        { weight: 30, xpGain: 600, logKey: 'events.aby_memory.touch_wis' }
                    ]
                },
                {
                    labelKey: 'events.aby_memory.grasp',
                    outcomes: [
                        { weight: 40, lootChest: true, logKey: 'events.aby_memory.grasp_ok' },
                        { weight: 30, sanityDmg: 30, status: s('daze'), logKey: 'events.aby_memory.grasp_fade' },
                        { weight: 30, hpDmg: 20, status: s('disease'), logKey: 'events.aby_memory.grasp_rot' }
                    ]
                },
                {
                    labelKey: 'events.aby_memory.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.aby_memory.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_aby_tome', type: 'interactive', emoji: '📖', nameKey: 'events.aby_tome.name', descKey: 'events.aby_tome.desc',
            choices: [
                {
                    labelKey: 'events.aby_tome.read', reqTrait: 't_pos_scholar',
                    outcomes: [
                        { weight: 60, xpGain: 800, logKey: 'events.aby_tome.read_ok' },
                        { weight: 40, lootEpic: true, logKey: 'events.aby_tome.read_spell' }
                    ]
                },
                {
                    labelKey: 'events.aby_tome.glance',
                    outcomes: [
                        { weight: 30, xpGain: 300, logKey: 'events.aby_tome.glance_ok' },
                        { weight: 40, xpGain: 100, status: s('doom', { duration: Infinity }), logKey: 'events.aby_tome.glance_doom' },
                        { weight: 30, sanityDmg: 50, status: s('cursed'), logKey: 'events.aby_tome.glance_mad' }
                    ]
                },
                {
                    labelKey: 'events.aby_tome.burn',
                    outcomes: [
                        { weight: 70, logKey: 'events.aby_tome.burn' },
                        { weight: 30, forceEncounter: true, logKey: 'events.aby_tome.burn_wrath' }
                    ]
                }
            ]
        },
        {
            id: 'th_aby_watcher', type: 'interactive', emoji: '👁️', nameKey: 'events.aby_watcher.name', descKey: 'events.aby_watcher.desc',
            choices: [
                {
                    labelKey: 'events.aby_watcher.mirror', reqItem: 't_torch', consumeItem: true,
                    outcomes: [
                        { weight: 80, lootEpic: true, logKey: 'events.aby_watcher.mirror_ok' },
                        { weight: 20, sanityHeal: 40, status: s('blessed'), logKey: 'events.aby_watcher.mirror_pure' }
                    ]
                },
                {
                    labelKey: 'events.aby_watcher.stare', reqSanity: { min: 60, cost: 0 },
                    outcomes: [
                        { weight: 40, xpGain: 500, logKey: 'events.aby_watcher.stare_ok' },
                        { weight: 40, sanityDmg: 40, status: s('cursed'), logKey: 'events.aby_watcher.stare_mad' },
                        { weight: 20, forceEncounter: true, logKey: 'events.aby_watcher.stare_wake' }
                    ]
                },
                {
                    labelKey: 'events.aby_watcher.flee',
                    outcomes: [
                        { weight: 60, sanityDmg: 20, status: s('daze', { duration: 5 }), logKey: 'events.aby_watcher.flee_ok' },
                        { weight: 40, hpDmg: 15, status: s('crippled'), logKey: 'events.aby_watcher.flee_fall' }
                    ]
                }
            ]
        },
        {
            id: 'th_aby_river', type: 'interactive', emoji: '🌊', nameKey: 'events.aby_river.name', descKey: 'events.aby_river.desc',
            choices: [
                {
                    labelKey: 'events.aby_river.sacrifice', reqHp: { min: 50, cost: 40 },
                    outcomes: [
                        { weight: 60, lootEpic: true, logKey: 'events.aby_river.sac_ok' },
                        { weight: 40, xpGain: 1000, logKey: 'events.aby_river.sac_wis' }
                    ]
                },
                {
                    labelKey: 'events.aby_river.drink',
                    outcomes: [
                        { weight: 30, xpLoss: true, hpHealPct: 1.0, sanityHealPct: 1.0, logKey: 'events.aby_river.drink_ok' },
                        { weight: 40, status: s('disease'), sanityDmg: 30, logKey: 'events.aby_river.drink_sick' },
                        { weight: 30, status: s('cursed', { duration: Infinity }), logKey: 'events.aby_river.drink_curse' }
                    ]
                },
                {
                    labelKey: 'events.aby_river.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.aby_river.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_aby_portal', type: 'interactive', emoji: '🚪', nameKey: 'events.aby_portal.name', descKey: 'events.aby_portal.desc',
            choices: [
                {
                    labelKey: 'events.aby_portal.key', reqItem: 't_key', consumeItem: true,
                    outcomes: [
                        { weight: 70, lootEpic: true, logKey: 'events.aby_portal.key_ok' },
                        { weight: 30, sanityHealPct: 1.0, logKey: 'events.aby_portal.key_peace' }
                    ]
                },
                {
                    labelKey: 'events.aby_portal.enter',
                    outcomes: [
                        { weight: 30, lootChest: true, logKey: 'events.aby_portal.enter_ok' },
                        { weight: 40, hpDmgPct: 0.5, sanityDmg: 20, logKey: 'events.aby_portal.enter_lost' },
                        { weight: 30, forceEncounter: true, logKey: 'events.aby_portal.enter_void' }
                    ]
                },
                {
                    labelKey: 'events.aby_portal.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.aby_portal.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_aby_shadow', type: 'interactive', emoji: '👤', nameKey: 'events.aby_shadow.name', descKey: 'events.aby_shadow.desc',
            choices: [
                {
                    labelKey: 'events.aby_shadow.light', reqItem: 't_torch', consumeItem: true,
                    outcomes: [
                        { weight: 80, sanityHeal: 30, logKey: 'events.aby_shadow.light_ok' },
                        { weight: 20, lootEpic: true, logKey: 'events.aby_shadow.light_gift' }
                    ]
                },
                {
                    labelKey: 'events.aby_shadow.embrace', reqSanity: { min: 40, cost: 0 },
                    outcomes: [
                        { weight: 40, statSpdUp: 2, logKey: 'events.aby_shadow.embrace_ok' },
                        { weight: 40, sanityDmg: 30, status: s('cursed'), logKey: 'events.aby_shadow.embrace_mad' },
                        { weight: 20, forceEncounter: true, logKey: 'events.aby_shadow.embrace_fight' }
                    ]
                },
                {
                    labelKey: 'events.aby_shadow.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.aby_shadow.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_aby_crystal', type: 'interactive', emoji: '🔮', nameKey: 'events.aby_crystal.name', descKey: 'events.aby_crystal.desc',
            choices: [
                {
                    labelKey: 'events.aby_crystal.extract', reqItemType: 'material_ore', consumeItem: true,
                    outcomes: [
                        { weight: 70, lootEpic: true, logKey: 'events.aby_crystal.extract_ok' },
                        { weight: 30, lootMultiple: 2, logKey: 'events.aby_crystal.extract_gem' }
                    ]
                },
                {
                    labelKey: 'events.aby_crystal.shatter', repairWeaponDmg: 5,
                    outcomes: [
                        { weight: 40, lootMaterial: true, logKey: 'events.aby_crystal.shatter_ok' },
                        { weight: 40, hpDmg: 20, status: s('bleed'), logKey: 'events.aby_crystal.shatter_shard' },
                        { weight: 20, sanityDmg: 40, status: s('daze'), logKey: 'events.aby_crystal.shatter_mind' }
                    ]
                },
                {
                    labelKey: 'events.aby_crystal.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.aby_crystal.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_aby_echo', type: 'interactive', emoji: '〰️', nameKey: 'events.aby_echo.name', descKey: 'events.aby_echo.desc',
            choices: [
                {
                    labelKey: 'events.aby_echo.tune', reqItemType: 'material_mana', consumeItem: true,
                    outcomes: [
                        { weight: 80, sanityHeal: 40, logKey: 'events.aby_echo.tune_ok' },
                        { weight: 20, xpGain: 500, logKey: 'events.aby_echo.tune_wis' }
                    ]
                },
                {
                    labelKey: 'events.aby_echo.listen',
                    outcomes: [
                        { weight: 40, xpGain: 300, logKey: 'events.aby_echo.listen_ok' },
                        { weight: 40, sanityDmg: 35, status: s('cursed'), logKey: 'events.aby_echo.listen_mad' },
                        { weight: 20, forceEncounter: true, logKey: 'events.aby_echo.listen_wake' }
                    ]
                },
                {
                    labelKey: 'events.aby_echo.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.aby_echo.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_aby_void', type: 'interactive', emoji: '🕳️', nameKey: 'events.aby_void.name', descKey: 'events.aby_void.desc',
            choices: [
                {
                    labelKey: 'events.aby_void.anchor', reqItemType: 'material_rope', consumeItem: true,
                    outcomes: [
                        { weight: 70, lootChest: true, logKey: 'events.aby_void.anchor_ok' },
                        { weight: 30, lootEpic: true, logKey: 'events.aby_void.anchor_deep' }
                    ]
                },
                {
                    labelKey: 'events.aby_void.jump', reqTrait: 't_pos_agile',
                    outcomes: [
                        { weight: 50, xpGain: 400, logKey: 'events.aby_void.jump_ok' },
                        { weight: 30, hpDmg: 40, status: s('crippled'), logKey: 'events.aby_void.jump_fall' },
                        { weight: 20, sanityDmg: 50, status: s('doom'), logKey: 'events.aby_void.jump_lost' }
                    ]
                },
                {
                    labelKey: 'events.aby_void.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.aby_void.skip' }
                    ]
                }
            ]
        },
        {
            id: 'th_aby_star', type: 'interactive', emoji: '✨', nameKey: 'events.aby_star.name', descKey: 'events.aby_star.desc',
            choices: [
                {
                    labelKey: 'events.aby_star.pray', reqItem: 't_holywater', consumeItem: true,
                    outcomes: [
                        { weight: 80, hpHealPct: 1.0, sanityHealPct: 1.0, status: s('blessed'), logKey: 'events.aby_star.pray_ok' },
                        { weight: 20, statStrUp: 1, statDexUp: 1, statIntUp: 1, logKey: 'events.aby_star.pray_power' }
                    ]
                },
                {
                    labelKey: 'events.aby_star.reach', reqSanity: { min: 40, cost: 20 },
                    outcomes: [
                        { weight: 30, lootEpic: true, logKey: 'events.aby_star.reach_ok' },
                        { weight: 40, hpDmg: 20, status: s('burn'), logKey: 'events.aby_star.reach_burn' },
                        { weight: 30, forceEncounter: true, logKey: 'events.aby_star.reach_guard' }
                    ]
                },
                {
                    labelKey: 'events.aby_star.skip',
                    outcomes: [
                        { weight: 100, logKey: 'events.aby_star.skip' }
                    ]
                }
            ]
        }
    ],
};

/**
 * Roll a random event from the map's event pool.
 * Theme events take first priority when available.
 * @param {object} mapData
 * @param {string[]} [mapData.eventPool] - IDs of generic events allowed in this map
 * @param {string} [mapData.theme] - Theme key for themed event pool
 * @param {boolean} [isThemeBoost=false] - If true, drastically increases the chance of themed event
 * @param {string[]} [encounteredEvents=[]] - List of event IDs already encountered to prevent duplicates
 */
export function rollEvent(mapData, isThemeBoost = false, encounteredEvents = []) {
    const theme = mapData?.theme;
    const themeEvents = (theme && EVENTS_THEME[theme]) ? EVENTS_THEME[theme] : [];
    const pool = mapData?.eventPool || [];

    // Helper to filter out already encountered events
    const filterNew = (arr) => arr.filter(e => {
        // e might be an ID string (for pool) or an event object (themeEvents, EVENTS_GENERAL)
        const id = typeof e === 'string' ? e : e.id;
        return !encounteredEvents.includes(id);
    });

    const newThemeEvents = filterNew(themeEvents);
    const newPool = filterNew(pool);
    const newGeneral = filterNew(EVENTS_GENERAL);

    // 40% chance to pick themed event if available (or 80% if boosted), else general pool
    const themeChance = isThemeBoost ? 0.8 : 0.4;

    // Try theme events first
    if (newThemeEvents.length > 0 && Math.random() < themeChance) {
        return newThemeEvents[Math.floor(Math.random() * newThemeEvents.length)];
    } else if (themeEvents.length > 0 && Math.random() < themeChance) {
        // Fallback to duplicates if all new ones are exhausted
        return themeEvents[Math.floor(Math.random() * themeEvents.length)];
    }

    // Try map specific pool
    if (newPool.length > 0) {
        const id = newPool[Math.floor(Math.random() * newPool.length)];
        const found = EVENTS_GENERAL.find(e => e.id === id);
        if (found) return found;
    } else if (pool.length > 0) {
        const id = pool[Math.floor(Math.random() * pool.length)];
        const found = EVENTS_GENERAL.find(e => e.id === id);
        if (found) return found;
    }

    // Fallback to general pool
    if (newGeneral.length > 0) {
        return newGeneral[Math.floor(Math.random() * newGeneral.length)];
    }

    // Absolute fallback if everything is used up
    return EVENTS_GENERAL[Math.floor(Math.random() * EVENTS_GENERAL.length)];
}

export { weightedPick };
