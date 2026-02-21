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
        outcomes: [{ weight: 100, hpHeal: 20 }]
    },
    {
        id: 'sanity_shrine', type: 'immediate', emoji: '🕯️', nameKey: 'events.sanity_shrine.name', descKey: 'events.sanity_shrine.desc',
        outcomes: [{ weight: 100, sanityHeal: 15 }]
    },
    {
        id: 'rest_spot', type: 'immediate', emoji: '🏕️', nameKey: 'events.rest_spot.name', descKey: 'events.rest_spot.desc',
        outcomes: [{ weight: 100, hpHeal: 10, sanityHeal: 10 }]
    },
    {
        id: 'treasure_stash', type: 'immediate', emoji: '🎁', nameKey: 'events.treasure_stash.name', descKey: 'events.treasure_stash.desc',
        outcomes: [{ weight: 100, lootChest: true }]
    },
    // ─ Immediate negatives ─
    {
        id: 'trap_pit', type: 'immediate', emoji: '🕳️', nameKey: 'events.trap_pit.name', descKey: 'events.trap_pit.desc',
        outcomes: [{ weight: 100, hpDmg: 10, sanityDmg: 5 }]
    },
    {
        id: 'dark_corner', type: 'immediate', emoji: '🌑', nameKey: 'events.dark_corner.name', descKey: 'events.dark_corner.desc',
        outcomes: [{ weight: 100, sanityDmg: 5 }]
    },
    // ─ Interactive: Grave ─
    {
        id: 'e_grave', type: 'interactive', emoji: '🪦', nameKey: 'events.grave.name', descKey: 'events.grave.desc',
        choices: [
            {
                labelKey: 'events.grave.choice_shovel', reqItem: 't_shovel', consumeItem: true,
                outcomes: [{ weight: 100, lootChest: true, logKey: 'events.grave.ok' }]
            },
            {
                labelKey: 'events.grave.choice_dig',
                outcomes: [{ weight: 60, hpDmg: 8, sanityDmg: 10, logKey: 'events.grave.fail' }, { weight: 40, lootChest: true, logKey: 'events.grave.partial' }]
            },
            { labelKey: 'events.grave.choice_skip', outcomes: [{ weight: 100, logKey: 'events.grave.skip' }] },
        ]
    },
    // ─ Interactive: Eldritch Altar ─
    {
        id: 'e_altar', type: 'interactive', emoji: '🗿', nameKey: 'events.altar.name', descKey: 'events.altar.desc',
        choices: [
            {
                labelKey: 'events.altar.choice_holy', reqItem: 't_holywater', consumeItem: true,
                outcomes: [{ weight: 100, sanityHeal: 30, status: s('blessed'), logKey: 'events.altar.holy_ok' }]
            },
            {
                labelKey: 'events.altar.choice_blood',
                outcomes: [{ weight: 100, hpDmgPct: 0.25, lootChest: true, logKey: 'events.altar.blood' }]
            },
            { labelKey: 'events.altar.choice_skip', outcomes: [{ weight: 100, logKey: 'events.altar.skip' }] },
        ]
    },
    // ─ Interactive: Mushroom Patch ─
    {
        id: 'e_mushroom', type: 'interactive', emoji: '🍄', nameKey: 'events.mushroom.name', descKey: 'events.mushroom.desc',
        choices: [
            {
                labelKey: 'events.mushroom.eat',
                outcomes: [{ weight: 50, hpHeal: 40, logKey: 'events.mushroom.heal' }, { weight: 50, status: s('poison'), logKey: 'events.mushroom.poison' }]
            },
            { labelKey: 'events.mushroom.skip', outcomes: [{ weight: 100, logKey: 'events.mushroom.skip' }] },
        ]
    },
    // ─ Interactive: Anvil ─
    {
        id: 'e_anvil', type: 'interactive', emoji: '⚒️', nameKey: 'events.anvil.name', descKey: 'events.anvil.desc',
        choices: [
            {
                labelKey: 'events.anvil.repair', repairWeapon: true,
                outcomes: [{ weight: 100, sanityDmg: 12, logKey: 'events.anvil.ok' }]
            },
            { labelKey: 'events.anvil.skip', outcomes: [{ weight: 100, logKey: 'events.anvil.skip' }] },
        ]
    },
    // ─ Interactive: Corpse ─
    {
        id: 'e_corpse', type: 'interactive', emoji: '💀', nameKey: 'events.corpse.name', descKey: 'events.corpse.desc',
        choices: [
            {
                labelKey: 'events.corpse.search',
                outcomes: [{ weight: 60, lootChest: true, logKey: 'events.corpse.ok' }, { weight: 40, hpDmg: 15, sanityDmg: 8, logKey: 'events.corpse.trap' }]
            },
            { labelKey: 'events.corpse.skip', outcomes: [{ weight: 100, logKey: 'events.corpse.skip' }] },
        ]
    },
    // ─ Interactive: Goblin Peddler ─
    {
        id: 'e_goblin_peddler', type: 'interactive', emoji: '🧌', nameKey: 'events.goblin_peddler.name', descKey: 'events.goblin_peddler.desc',
        choices: [
            {
                labelKey: 'events.goblin_peddler.trade', reqItem: null,
                outcomes: [{ weight: 100, lootChest: true, logKey: 'events.goblin_peddler.trade_ok' }]
            },
            {
                labelKey: 'events.goblin_peddler.attack',
                outcomes: [{ weight: 100, lootMultiple: 3, status: s('cursed'), logKey: 'events.goblin_peddler.attack_ok' }]
            },
        ]
    },
    // ─ Interactive: Weeping Statue ─
    {
        id: 'e_weeping_statue', type: 'interactive', emoji: '😢', nameKey: 'events.weeping_statue.name', descKey: 'events.weeping_statue.desc',
        choices: [
            {
                labelKey: 'events.weeping_statue.tend', reqItem: 'c_bandage', consumeItem: true,
                outcomes: [{ weight: 100, status: s('regen', { duration: Infinity }), logKey: 'events.weeping_statue.ok' }]
            },
            {
                labelKey: 'events.weeping_statue.skip',
                outcomes: [{ weight: 100, sanityDmg: 5, logKey: 'events.weeping_statue.skip' }]
            },
        ]
    },
    // ─ Interactive: Cauldron ─
    {
        id: 'e_cauldron', type: 'interactive', emoji: '🫕', nameKey: 'events.cauldron.name', descKey: 'events.cauldron.desc',
        choices: [
            {
                labelKey: 'events.cauldron.add_material', reqItemType: 'material', consumeItem: true,
                outcomes: [{ weight: 60, lootChest: true, logKey: 'events.cauldron.brew_ok' }, { weight: 40, hpDmg: 12, sanityDmg: 8, logKey: 'events.cauldron.explode' }]
            },
            { labelKey: 'events.cauldron.skip', outcomes: [{ weight: 100, logKey: 'events.cauldron.skip' }] },
        ]
    },
    // ─ Interactive: Enchanted Mirror ─
    {
        id: 'e_mirror', type: 'interactive', emoji: '🪞', nameKey: 'events.mirror.name', descKey: 'events.mirror.desc',
        choices: [
            {
                labelKey: 'events.mirror.gaze',
                outcomes: [{ weight: 100, xpGain: 150, sanityDmg: 20, logKey: 'events.mirror.gaze_ok' }]
            },
            {
                labelKey: 'events.mirror.smash', repairWeaponDmg: 5,
                outcomes: [{ weight: 100, lootMaterial: true, logKey: 'events.mirror.smash_ok' }]
            },
        ]
    },
    // ─ Interactive: Slime Pool ─
    {
        id: 'e_slime_pool', type: 'interactive', emoji: '🟢', nameKey: 'events.slime_pool.name', descKey: 'events.slime_pool.desc',
        choices: [
            {
                labelKey: 'events.slime_pool.reach_in',
                outcomes: [{ weight: 100, hpDmg: 12, lootGold: 80, logKey: 'events.slime_pool.ok' }]
            },
            { labelKey: 'events.slime_pool.skip', outcomes: [{ weight: 100, logKey: 'events.slime_pool.skip' }] },
        ]
    },
    // ─ Interactive: Bandit Cache ─
    {
        id: 'e_bandit_cache', type: 'interactive', emoji: '🗝️', nameKey: 'events.bandit_cache.name', descKey: 'events.bandit_cache.desc',
        choices: [
            {
                labelKey: 'events.bandit_cache.key', reqItem: 't_key', consumeItem: true,
                outcomes: [{ weight: 100, lootGold: 200, logKey: 'events.bandit_cache.key_ok' }]
            },
            {
                labelKey: 'events.bandit_cache.force',
                outcomes: [{ weight: 50, lootGold: 100, logKey: 'events.bandit_cache.force_ok' }, { weight: 50, status: s('poison'), hpDmg: 13, logKey: 'events.bandit_cache.trap' }]
            },
        ]
    },
    // ─ Interactive: Injured Adventurer ─
    {
        id: 'e_injured_adv', type: 'interactive', emoji: '🤕', nameKey: 'events.injured_adv.name', descKey: 'events.injured_adv.desc',
        choices: [
            {
                labelKey: 'events.injured_adv.heal', reqItem: 'c_bandage', consumeItem: true,
                outcomes: [{ weight: 100, lootGold: 150, lootChest: true, logKey: 'events.injured_adv.heal_ok' }]
            },
            {
                labelKey: 'events.injured_adv.ignore',
                outcomes: [{ weight: 100, sanityDmg: 8, logKey: 'events.injured_adv.ignore' }]
            },
        ]
    },
    // ─ Interactive: Campfire ─
    {
        id: 'e_campfire', type: 'interactive', emoji: '🔥', nameKey: 'events.campfire.name', descKey: 'events.campfire.desc',
        choices: [
            {
                labelKey: 'events.campfire.rest', reqItemType: 'material_wood', consumeItem: true,
                outcomes: [{ weight: 100, hpHealPct: 0.5, sanityHeal: 20, logKey: 'events.campfire.rest_ok' }]
            },
            {
                labelKey: 'events.campfire.search',
                outcomes: [{ weight: 70, lootChest: true, logKey: 'events.campfire.scavenge_ok' }, { weight: 30, logKey: 'events.campfire.empty' }]
            },
        ]
    },
    // ─ Interactive: Cursed Armament ─
    {
        id: 'e_cursed_arm', type: 'interactive', emoji: '⚔️', nameKey: 'events.cursed_arm.name', descKey: 'events.cursed_arm.desc',
        choices: [
            {
                labelKey: 'events.cursed_arm.touch',
                outcomes: [{ weight: 100, status: s('doom'), xpGain: 50, logKey: 'events.cursed_arm.touch_ok' }]
            },
            { labelKey: 'events.cursed_arm.skip', outcomes: [{ weight: 100, logKey: 'events.cursed_arm.skip' }] },
        ]
    },
    // ─ Interactive: Tome ─
    {
        id: 'e_tome', type: 'interactive', emoji: '📕', nameKey: 'events.tome.name', descKey: 'events.tome.desc',
        choices: [
            {
                labelKey: 'events.tome.read',
                outcomes: [{ weight: 50, xpGain: 200, logKey: 'events.tome.read_ok' }, { weight: 50, sanityDmg: 25, logKey: 'events.tome.read_fail' }]
            },
            { labelKey: 'events.tome.skip', outcomes: [{ weight: 100, logKey: 'events.tome.skip' }] },
        ]
    },
    // ─ Interactive: Mystic Well ─
    {
        id: 'e_well', type: 'interactive', emoji: '🪣', nameKey: 'events.well.name', descKey: 'events.well.desc',
        choices: [
            {
                labelKey: 'events.well.drink',
                outcomes: [{ weight: 40, hpHealPct: 1.0, sanityHeal: 30, logKey: 'events.well.drink_ok' }, { weight: 60, hpDmgPct: 0.3, logKey: 'events.well.drink_bad' }]
            },
            { labelKey: 'events.well.skip', outcomes: [{ weight: 100, logKey: 'events.well.skip' }] },
        ]
    },
    // ─ Interactive: Idol ─
    {
        id: 'e_idol', type: 'interactive', emoji: '🗿', nameKey: 'events.idol.name', descKey: 'events.idol.desc',
        choices: [
            {
                labelKey: 'events.idol.offer', reqItemType: 'material_mana',
                outcomes: [{ weight: 100, lootChest: true, logKey: 'events.idol.offer_ok' }]
            },
            {
                labelKey: 'events.idol.pray',
                outcomes: [{ weight: 100, xpGain: 80, sanityDmg: 15, logKey: 'events.idol.pray' }]
            },
        ]
    },
    // ─ Interactive: Cobweb ─
    {
        id: 'e_cobweb', type: 'interactive', emoji: '🕸️', nameKey: 'events.cobweb.name', descKey: 'events.cobweb.desc',
        choices: [
            {
                labelKey: 'events.cobweb.torch', reqItem: 't_torch', consumeItem: true,
                outcomes: [{ weight: 100, lootMaterial: true, logKey: 'events.cobweb.torch_ok' }]
            },
            {
                labelKey: 'events.cobweb.slash', repairWeaponDmg: 5,
                outcomes: [{ weight: 100, status: s('crippled'), logKey: 'events.cobweb.slash_ok' }]
            },
        ]
    },
    // ─ Interactive: Wandering Soul ─
    {
        id: 'e_soul', type: 'interactive', emoji: '👻', nameKey: 'events.soul.name', descKey: 'events.soul.desc',
        choices: [
            {
                labelKey: 'events.soul.holy', reqItem: 't_holywater', consumeItem: true,
                outcomes: [{ weight: 100, sanityHeal: 25, status: s('blessed'), logKey: 'events.soul.holy_ok' }]
            },
            {
                labelKey: 'events.soul.ignore',
                outcomes: [{ weight: 100, status: s('cursed'), logKey: 'events.soul.ignore' }]
            },
        ]
    },
    // ─ Interactive: Forsaken Altar ─
    {
        id: 'e_forsaken_altar', type: 'interactive', emoji: '🩸', nameKey: 'events.forsaken_altar.name', descKey: 'events.forsaken_altar.desc',
        choices: [
            {
                labelKey: 'events.forsaken_altar.sacrifice',
                outcomes: [{ weight: 100, hpDmgPct: 0.5, sanityDmgPct: 0.5, lootEpic: true, logKey: 'events.forsaken_altar.ok' }]
            },
            { labelKey: 'events.forsaken_altar.skip', outcomes: [{ weight: 100, logKey: 'events.forsaken_altar.skip' }] },
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
                    labelKey: 'events.ruins_pillar.dodge',
                    outcomes: [{ weight: 60, lootChest: true, logKey: 'events.ruins_pillar.ok' }, { weight: 40, status: s('crippled', { duration: 5 }), logKey: 'events.ruins_pillar.fail' }]
                },
            ]
        },
        {
            id: 'th_ruins_mural', type: 'interactive', emoji: '🖼️', nameKey: 'events.ruins_mural.name', descKey: 'events.ruins_mural.desc',
            choices: [
                { labelKey: 'events.ruins_mural.study', outcomes: [{ weight: 100, xpGain: 180, sanityDmg: 10, logKey: 'events.ruins_mural.ok' }] },
                { labelKey: 'events.ruins_mural.skip', outcomes: [{ weight: 100, logKey: 'events.ruins_mural.skip' }] },
            ]
        },
        {
            id: 'th_ruins_gear', type: 'interactive', emoji: '⚙️', nameKey: 'events.ruins_gear.name', descKey: 'events.ruins_gear.desc',
            choices: [
                {
                    labelKey: 'events.ruins_gear.turn',
                    outcomes: [{ weight: 55, lootChest: true, logKey: 'events.ruins_gear.ok' }, { weight: 45, status: s('bleed'), logKey: 'events.ruins_gear.fail' }]
                },
                { labelKey: 'events.ruins_gear.skip', outcomes: [{ weight: 100, logKey: 'events.ruins_gear.skip' }] },
            ]
        },
        {
            id: 'th_ruins_pool', type: 'immediate', emoji: '💧', nameKey: 'events.ruins_pool.name', descKey: 'events.ruins_pool.desc',
            outcomes: [{ weight: 40, status: s('regen', { duration: 20 }), logKey: 'events.ruins_pool.ok' }, { weight: 60, status: s('crippled'), logKey: 'events.ruins_pool.bad' }]
        },
        {
            id: 'th_ruins_stone', type: 'interactive', emoji: '💎', nameKey: 'events.ruins_stone.name', descKey: 'events.ruins_stone.desc',
            choices: [
                {
                    labelKey: 'events.ruins_stone.offer', reqItemType: 'material_mana', consumeItem: true,
                    outcomes: [{ weight: 100, status: s('blessed', { duration: Infinity }), logKey: 'events.ruins_stone.ok' }]
                },
                { labelKey: 'events.ruins_stone.grab', outcomes: [{ weight: 100, hpDmg: 20, lootChest: true, logKey: 'events.ruins_stone.grab' }] },
            ]
        },
    ],
    swamp: [
        {
            id: 'th_swamp_mud', type: 'interactive', emoji: '🪸', nameKey: 'events.swamp_mud.name', descKey: 'events.swamp_mud.desc',
            choices: [
                { labelKey: 'events.swamp_mud.wade', outcomes: [{ weight: 100, repairWeaponDmg: 5, lootGold: 60, logKey: 'events.swamp_mud.ok' }] },
                { labelKey: 'events.swamp_mud.bypass', outcomes: [{ weight: 100, logKey: 'events.swamp_mud.skip' }] },
            ]
        },
        {
            id: 'th_swamp_gas', type: 'interactive', emoji: '🌫️', nameKey: 'events.swamp_gas.name', descKey: 'events.swamp_gas.desc',
            choices: [
                {
                    labelKey: 'events.swamp_gas.antidote', reqItem: 'c_antidote', consumeItem: true,
                    outcomes: [{ weight: 100, logKey: 'events.swamp_gas.safe' }]
                },
                { labelKey: 'events.swamp_gas.rush', outcomes: [{ weight: 100, status: s('poison', { duration: 15 }), logKey: 'events.swamp_gas.fail' }] },
            ]
        },
        {
            id: 'th_swamp_lady', type: 'interactive', emoji: '🧜', nameKey: 'events.swamp_lady.name', descKey: 'events.swamp_lady.desc',
            choices: [
                { labelKey: 'events.swamp_lady.follow', outcomes: [{ weight: 100, sanityDmg: 20, lootChest: true, logKey: 'events.swamp_lady.follow' }] },
                { labelKey: 'events.swamp_lady.ignore', outcomes: [{ weight: 100, logKey: 'events.swamp_lady.ignore' }] },
            ]
        },
        {
            id: 'th_swamp_raft', type: 'interactive', emoji: '🛶', nameKey: 'events.swamp_raft.name', descKey: 'events.swamp_raft.desc',
            choices: [
                {
                    labelKey: 'events.swamp_raft.rope', reqItemType: 'material_rope', consumeItem: true,
                    outcomes: [{ weight: 100, lootMultiple: 2, logKey: 'events.swamp_raft.rope_ok' }]
                },
                { labelKey: 'events.swamp_raft.dive', outcomes: [{ weight: 100, forceEncounter: true, logKey: 'events.swamp_raft.dive' }] },
            ]
        },
        {
            id: 'th_swamp_tree', type: 'immediate', emoji: '🌳', nameKey: 'events.swamp_tree.name', descKey: 'events.swamp_tree.desc',
            outcomes: [{ weight: 40, lootMaterial: true, logKey: 'events.swamp_tree.ok' }, { weight: 60, status: s('poison', { duration: 15 }), logKey: 'events.swamp_tree.bad' }]
        },
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
                    outcomes: [{ weight: 100, lootMultiple: 3, logKey: 'events.mine_cart.tool_ok' }]
                },
                { labelKey: 'events.mine_cart.bare', outcomes: [{ weight: 100, lootMaterial: true, status: s('bleed'), logKey: 'events.mine_cart.bare' }] },
            ]
        },
        {
            id: 'th_mine_gas', type: 'interactive', emoji: '☣️', nameKey: 'events.mine_gas.name', descKey: 'events.mine_gas.desc',
            choices: [
                { labelKey: 'events.mine_gas.run', outcomes: [{ weight: 50, logKey: 'events.mine_gas.run_ok' }, { weight: 50, hpDmg: 15, status: s('daze'), logKey: 'events.mine_gas.run_fail' }] },
            ]
        },
        {
            id: 'th_mine_dynamite', type: 'interactive', emoji: '💣', nameKey: 'events.mine_dynamite.name', descKey: 'events.mine_dynamite.desc',
            choices: [
                {
                    labelKey: 'events.mine_dynamite.throw', weakenNextBattle: true,
                    outcomes: [{ weight: 100, logKey: 'events.mine_dynamite.throw_ok' }]
                },
                { labelKey: 'events.mine_dynamite.keep', outcomes: [{ weight: 60, lootItem: 't_torch', logKey: 'events.mine_dynamite.keep_ok' }, { weight: 40, hpDmg: 20, status: s('burn'), logKey: 'events.mine_dynamite.explode' }] },
            ]
        },
        {
            id: 'th_mine_eyes', type: 'interactive', emoji: '👁️', nameKey: 'events.mine_eyes.name', descKey: 'events.mine_eyes.desc',
            choices: [
                {
                    labelKey: 'events.mine_eyes.torch', reqItem: 't_torch', consumeItem: true,
                    outcomes: [{ weight: 100, logKey: 'events.mine_eyes.torch_ok' }]
                },
                { labelKey: 'events.mine_eyes.wait', outcomes: [{ weight: 100, sanityDmg: 15, status: s('crippled'), logKey: 'events.mine_eyes.wait_fail' }] },
            ]
        },
        {
            id: 'th_mine_vein', type: 'interactive', emoji: '✨', nameKey: 'events.mine_vein.name', descKey: 'events.mine_vein.desc',
            choices: [
                { labelKey: 'events.mine_vein.mine', outcomes: [{ weight: 50, lootMaterial: true, logKey: 'events.mine_vein.ok' }, { weight: 50, forceEncounter: true, logKey: 'events.mine_vein.ambush' }] },
                { labelKey: 'events.mine_vein.skip', outcomes: [{ weight: 100, logKey: 'events.mine_vein.skip' }] },
            ]
        },
    ],
    citadel: [
        {
            id: 'th_cit_statue', type: 'interactive', emoji: '🗿', nameKey: 'events.cit_statue.name', descKey: 'events.cit_statue.desc',
            choices: [
                { labelKey: 'events.cit_statue.honor', outcomes: [{ weight: 100, status: s('blessed', { duration: Infinity }), logKey: 'events.cit_statue.honor_ok' }] },
                { labelKey: 'events.cit_statue.loot', outcomes: [{ weight: 100, lootChest: true, status: s('cursed', { duration: Infinity }), logKey: 'events.cit_statue.loot' }] },
            ]
        },
        {
            id: 'th_cit_ghost', type: 'interactive', emoji: '👻', nameKey: 'events.cit_ghost.name', descKey: 'events.cit_ghost.desc',
            choices: [
                { labelKey: 'events.cit_ghost.listen', outcomes: [{ weight: 100, xpGain: 200, sanityDmg: 25, logKey: 'events.cit_ghost.listen_ok' }] },
                { labelKey: 'events.cit_ghost.cover', outcomes: [{ weight: 100, sanityDmg: 5, logKey: 'events.cit_ghost.cover' }] },
            ]
        },
        {
            id: 'th_cit_armory', type: 'interactive', emoji: '🏹', nameKey: 'events.cit_armory.name', descKey: 'events.cit_armory.desc',
            choices: [
                {
                    labelKey: 'events.cit_armory.key', reqItem: 't_key', consumeItem: true,
                    outcomes: [{ weight: 100, lootEpic: true, logKey: 'events.cit_armory.key_ok' }]
                },
                {
                    labelKey: 'events.cit_armory.break', repairWeaponDmg: 10,
                    outcomes: [{ weight: 40, lootChest: true, logKey: 'events.cit_armory.force_ok' }, { weight: 60, forceEncounter: true, logKey: 'events.cit_armory.guard' }]
                },
            ]
        },
        {
            id: 'th_cit_prisoner', type: 'interactive', emoji: '⛓️', nameKey: 'events.cit_prisoner.name', descKey: 'events.cit_prisoner.desc',
            choices: [
                {
                    labelKey: 'events.cit_prisoner.feed', reqItemType: 'consumable_food', consumeItem: true,
                    outcomes: [{ weight: 100, lootItem: 't_key', logKey: 'events.cit_prisoner.feed_ok' }]
                },
                { labelKey: 'events.cit_prisoner.ignore', outcomes: [{ weight: 100, sanityDmg: 6, logKey: 'events.cit_prisoner.ignore' }] },
            ]
        },
        {
            id: 'th_cit_chandelier', type: 'interactive', emoji: '🕯️', nameKey: 'events.cit_chandelier.name', descKey: 'events.cit_chandelier.desc',
            choices: [
                {
                    labelKey: 'events.cit_chandelier.climb',
                    outcomes: [{ weight: 50, lootEpic: true, logKey: 'events.cit_chandelier.ok' }, { weight: 50, hpDmg: 20, status: s('crippled', { duration: 20 }), logKey: 'events.cit_chandelier.fall' }]
                },
                {
                    labelKey: 'events.cit_chandelier.cut', repairWeaponDmg: 3,
                    outcomes: [{ weight: 100, lootMaterial: true, logKey: 'events.cit_chandelier.cut_ok' }]
                },
            ]
        },
    ],
    forest: [
        {
            id: 'th_for_roots', type: 'interactive', emoji: '🌿', nameKey: 'events.for_roots.name', descKey: 'events.for_roots.desc',
            choices: [
                {
                    labelKey: 'events.for_roots.cut', repairWeaponDmg: 2,
                    outcomes: [{ weight: 60, lootMaterial: true, logKey: 'events.for_roots.cut_ok' }, { weight: 40, status: s('poison', { duration: 15 }), logKey: 'events.for_roots.poison' }]
                },
                { labelKey: 'events.for_roots.force', outcomes: [{ weight: 50, logKey: 'events.for_roots.force_ok' }, { weight: 50, hpDmg: 10, logKey: 'events.for_roots.force_fail' }] },
            ]
        },
        {
            id: 'th_for_spirit', type: 'interactive', emoji: '🌳', nameKey: 'events.for_spirit.name', descKey: 'events.for_spirit.desc',
            choices: [
                {
                    labelKey: 'events.for_spirit.offer', reqItemType: 'material_mana', consumeItem: true,
                    outcomes: [{ weight: 100, sanityHealPct: 1.0, status: s('regen', { duration: 20 }), logKey: 'events.for_spirit.ok' }]
                },
                { labelKey: 'events.for_spirit.skip', outcomes: [{ weight: 100, logKey: 'events.for_spirit.skip' }] },
            ]
        },
        {
            id: 'th_for_nest', type: 'interactive', emoji: '🪺', nameKey: 'events.for_nest.name', descKey: 'events.for_nest.desc',
            choices: [
                { labelKey: 'events.for_nest.steal', outcomes: [{ weight: 100, lootChest: true, forceEncounterNext: true, logKey: 'events.for_nest.steal' }] },
                { labelKey: 'events.for_nest.watch', outcomes: [{ weight: 100, xpGain: 50, logKey: 'events.for_nest.watch' }] },
            ]
        },
        {
            id: 'th_for_fairy', type: 'interactive', emoji: '🧚', nameKey: 'events.for_fairy.name', descKey: 'events.for_fairy.desc',
            choices: [
                { labelKey: 'events.for_fairy.dance', outcomes: [{ weight: 50, sanityHeal: 25, logKey: 'events.for_fairy.dance_ok' }, { weight: 50, hpDmg: 10, status: s('crippled'), logKey: 'events.for_fairy.dance_fail' }] },
                { labelKey: 'events.for_fairy.skip', outcomes: [{ weight: 100, logKey: 'events.for_fairy.skip' }] },
            ]
        },
        {
            id: 'th_for_beast', type: 'interactive', emoji: '🐻', nameKey: 'events.for_beast.name', descKey: 'events.for_beast.desc',
            choices: [
                {
                    labelKey: 'events.for_beast.talk',
                    outcomes: [{ weight: 50, lootChest: true, logKey: 'events.for_beast.talk_ok' }, { weight: 50, forceEncounter: true, logKey: 'events.for_beast.talk_fail' }]
                },
                { labelKey: 'events.for_beast.threaten', outcomes: [{ weight: 100, forceEncounter: true, logKey: 'events.for_beast.threaten' }] },
            ]
        },
    ],
    desert: [
        {
            id: 'th_des_debris', type: 'immediate', emoji: '🌪️', nameKey: 'events.des_debris.name', descKey: 'events.des_debris.desc',
            outcomes: [{ weight: 100, hpDmg: 8, sanityDmg: 5, status: s('burn', { duration: 10 }), logKey: 'events.des_debris.hit' }]
        },
        {
            id: 'th_des_mirage', type: 'interactive', emoji: '🌅', nameKey: 'events.des_mirage.name', descKey: 'events.des_mirage.desc',
            choices: [
                { labelKey: 'events.des_mirage.follow', outcomes: [{ weight: 100, hpDmg: 12, sanityDmg: 20, status: s('cursed'), logKey: 'events.des_mirage.fail' }] },
                { labelKey: 'events.des_mirage.resist', outcomes: [{ weight: 100, sanityDmg: 5, logKey: 'events.des_mirage.ok' }] },
            ]
        },
        {
            id: 'th_des_monolith', type: 'interactive', emoji: '🗿', nameKey: 'events.des_monolith.name', descKey: 'events.des_monolith.desc',
            choices: [
                { labelKey: 'events.des_monolith.read', outcomes: [{ weight: 50, xpGain: 250, logKey: 'events.des_monolith.ok' }, { weight: 50, status: s('cursed', { duration: Infinity }), logKey: 'events.des_monolith.fail' }] },
                { labelKey: 'events.des_monolith.skip', outcomes: [{ weight: 100, logKey: 'events.des_monolith.skip' }] },
            ]
        },
        {
            id: 'th_des_scorpion', type: 'interactive', emoji: '🦂', nameKey: 'events.des_scorpion.name', descKey: 'events.des_scorpion.desc',
            choices: [
                { labelKey: 'events.des_scorpion.poke', outcomes: [{ weight: 20, lootMaterial: true, forceEncounter: true, logKey: 'events.des_scorpion.ok' }, { weight: 80, status: s('poison', { duration: 15 }), forceEncounter: true, logKey: 'events.des_scorpion.sting' }] },
                { labelKey: 'events.des_scorpion.skip', outcomes: [{ weight: 100, logKey: 'events.des_scorpion.skip' }] },
            ]
        },
        {
            id: 'th_des_quicksand', type: 'interactive', emoji: '🏜️', nameKey: 'events.des_quicksand.name', descKey: 'events.des_quicksand.desc',
            choices: [
                {
                    labelKey: 'events.des_quicksand.rope', reqItemType: 'material_rope', consumeItem: true,
                    outcomes: [{ weight: 100, logKey: 'events.des_quicksand.rope_ok' }]
                },
                { labelKey: 'events.des_quicksand.struggle', outcomes: [{ weight: 50, logKey: 'events.des_quicksand.escape' }, { weight: 50, lootLoss: true, logKey: 'events.des_quicksand.sink' }] },
            ]
        },
    ],
    snow: [
        {
            id: 'th_snow_cabin', type: 'interactive', emoji: '🏚️', nameKey: 'events.snow_cabin.name', descKey: 'events.snow_cabin.desc',
            choices: [
                {
                    labelKey: 'events.snow_cabin.rest', reqItemType: 'material_wood', consumeItem: true,
                    outcomes: [{ weight: 100, hpHealPct: 1.0, logKey: 'events.snow_cabin.rest_ok' }]
                },
                { labelKey: 'events.snow_cabin.sleep', outcomes: [{ weight: 100, hpHeal: 20, status: s('crippled', { id: 'frostbite', icon: '🥶', labelKey: 'status.frostbite', duration: 15 }), logKey: 'events.snow_cabin.cold' }] },
            ]
        },
        {
            id: 'th_snow_echo', type: 'interactive', emoji: '🏔️', nameKey: 'events.snow_echo.name', descKey: 'events.snow_echo.desc',
            choices: [
                { labelKey: 'events.snow_echo.shout', outcomes: [{ weight: 100, hpDmg: 20, sanityDmg: 10, logKey: 'events.snow_echo.avalanche' }] },
                { labelKey: 'events.snow_echo.quiet', outcomes: [{ weight: 100, logKey: 'events.snow_echo.ok' }] },
            ]
        },
        {
            id: 'th_snow_crystal', type: 'interactive', emoji: '❄️', nameKey: 'events.snow_crystal.name', descKey: 'events.snow_crystal.desc',
            choices: [
                { labelKey: 'events.snow_crystal.bare', outcomes: [{ weight: 100, status: s('bleed', { duration: 5 }), lootMaterial: true, logKey: 'events.snow_crystal.ok' }] },
                {
                    labelKey: 'events.snow_crystal.tool', reqItemType: 'material_ore', consumeItem: true,
                    outcomes: [{ weight: 100, lootMaterial: true, logKey: 'events.snow_crystal.tool_ok' }]
                },
            ]
        },
        {
            id: 'th_snow_hunter', type: 'interactive', emoji: '🧊', nameKey: 'events.snow_hunter.name', descKey: 'events.snow_hunter.desc',
            choices: [
                { labelKey: 'events.snow_hunter.loot', outcomes: [{ weight: 100, lootChest: true, sanityDmg: 10, status: s('cursed'), logKey: 'events.snow_hunter.loot' }] },
                { labelKey: 'events.snow_hunter.mourn', outcomes: [{ weight: 100, sanityHeal: 5, logKey: 'events.snow_hunter.mourn' }] },
            ]
        },
        {
            id: 'th_snow_lake', type: 'interactive', emoji: '🌊', nameKey: 'events.snow_lake.name', descKey: 'events.snow_lake.desc',
            choices: [
                { labelKey: 'events.snow_lake.skate', outcomes: [{ weight: 50, lootChest: true, logKey: 'events.snow_lake.ok' }, { weight: 50, hpDmgPct: 0.9, logKey: 'events.snow_lake.crack' }] },
                { labelKey: 'events.snow_lake.bypass', outcomes: [{ weight: 100, logKey: 'events.snow_lake.bypass' }] },
            ]
        },
    ],
    crypt: [
        {
            id: 'th_crypt_chalice', type: 'interactive', emoji: '🏺', nameKey: 'events.crypt_chalice.name', descKey: 'events.crypt_chalice.desc',
            choices: [
                { labelKey: 'events.crypt_chalice.drink', outcomes: [{ weight: 100, hpHealPct: 1.0, sanityDmg: 30, logKey: 'events.crypt_chalice.drink' }] },
                { labelKey: 'events.crypt_chalice.skip', outcomes: [{ weight: 100, logKey: 'events.crypt_chalice.skip' }] },
            ]
        },
        {
            id: 'th_crypt_mummy', type: 'interactive', emoji: '🫙', nameKey: 'events.crypt_mummy.name', descKey: 'events.crypt_mummy.desc',
            choices: [
                {
                    labelKey: 'events.crypt_mummy.key', reqItem: 't_key', consumeItem: true,
                    outcomes: [{ weight: 100, lootEpic: true, logKey: 'events.crypt_mummy.key_ok' }]
                },
                { labelKey: 'events.crypt_mummy.pry', outcomes: [{ weight: 100, lootEpic: true, status: s('cursed'), status2: s('bleed', { duration: 20 }), logKey: 'events.crypt_mummy.pry' }] },
            ]
        },
        {
            id: 'th_crypt_web', type: 'interactive', emoji: '🕸️', nameKey: 'events.crypt_web.name', descKey: 'events.crypt_web.desc',
            choices: [
                {
                    labelKey: 'events.crypt_web.torch', reqItem: 't_torch', consumeItem: true,
                    outcomes: [{ weight: 100, logKey: 'events.crypt_web.torch_ok' }]
                },
                { labelKey: 'events.crypt_web.push', outcomes: [{ weight: 100, forceEncounter: true, status: s('poison'), logKey: 'events.crypt_web.spider' }] },
            ]
        },
        {
            id: 'th_crypt_vision', type: 'interactive', emoji: '💀', nameKey: 'events.crypt_vision.name', descKey: 'events.crypt_vision.desc',
            choices: [
                {
                    labelKey: 'events.crypt_vision.holy', reqItem: 't_holywater', consumeItem: true,
                    outcomes: [{ weight: 100, sanityHeal: 20, logKey: 'events.crypt_vision.ok' }]
                },
                { labelKey: 'events.crypt_vision.pray', outcomes: [{ weight: 50, logKey: 'events.crypt_vision.pray_ok' }, { weight: 50, forceEncounter: true, logKey: 'events.crypt_vision.spawn' }] },
            ]
        },
        {
            id: 'th_crypt_idol', type: 'interactive', emoji: '🕍', nameKey: 'events.crypt_idol.name', descKey: 'events.crypt_idol.desc',
            choices: [
                {
                    labelKey: 'events.crypt_idol.donate', lootGold: -100,
                    outcomes: [{ weight: 100, status: s('blessed', { duration: Infinity }), logKey: 'events.crypt_idol.donate_ok' }]
                },
                { labelKey: 'events.crypt_idol.spit', outcomes: [{ weight: 100, status: s('cursed'), status2: s('crippled'), logKey: 'events.crypt_idol.spit_bad' }] },
            ]
        },
    ],
    abyss: [
        {
            id: 'th_aby_rift', type: 'interactive', emoji: '🌌', nameKey: 'events.aby_rift.name', descKey: 'events.aby_rift.desc',
            choices: [
                { labelKey: 'events.aby_rift.reach', outcomes: [{ weight: 50, hpHealPct: 1.0, logKey: 'events.aby_rift.max' }, { weight: 50, hpDmgPct: 0.99, logKey: 'events.aby_rift.min' }] },
                { labelKey: 'events.aby_rift.close', outcomes: [{ weight: 100, sanityDmg: 5, logKey: 'events.aby_rift.close' }] },
            ]
        },
        {
            id: 'th_aby_memory', type: 'immediate', emoji: '🫧', nameKey: 'events.aby_memory.name', descKey: 'events.aby_memory.desc',
            outcomes: [{ weight: 100, lootChest: true, logKey: 'events.aby_memory.ok' }]
        },
        {
            id: 'th_aby_tome', type: 'interactive', emoji: '📖', nameKey: 'events.aby_tome.name', descKey: 'events.aby_tome.desc',
            choices: [
                { labelKey: 'events.aby_tome.read', outcomes: [{ weight: 100, xpGain: 100, status: s('doom', { duration: Infinity }), logKey: 'events.aby_tome.read' }] },
                { labelKey: 'events.aby_tome.burn', outcomes: [{ weight: 100, logKey: 'events.aby_tome.burn' }] },
            ]
        },
        {
            id: 'th_aby_watcher', type: 'interactive', emoji: '👁️', nameKey: 'events.aby_watcher.name', descKey: 'events.aby_watcher.desc',
            choices: [
                { labelKey: 'events.aby_watcher.mirror', outcomes: [{ weight: 100, lootEpic: true, logKey: 'events.aby_watcher.mirror_ok' }] },
                { labelKey: 'events.aby_watcher.flee', outcomes: [{ weight: 100, sanityDmg: 25, status: s('daze', { duration: 5 }), logKey: 'events.aby_watcher.flee' }] },
            ]
        },
        {
            id: 'th_aby_river', type: 'interactive', emoji: '🌊', nameKey: 'events.aby_river.name', descKey: 'events.aby_river.desc',
            choices: [
                { labelKey: 'events.aby_river.sacrifice', outcomes: [{ weight: 100, xpLoss: true, hpHealPct: 2.0, sanityHealPct: 2.0, logKey: 'events.aby_river.ok' }] },
                { labelKey: 'events.aby_river.skip', outcomes: [{ weight: 100, logKey: 'events.aby_river.skip' }] },
            ]
        },
    ],
};

/**
 * Roll a random event from the map's event pool.
 * Theme events take first priority when available.
 * @param {object} mapData
 * @param {string[]} [mapData.eventPool] - IDs of generic events allowed in this map
 * @param {string} [mapData.theme] - Theme key for themed event pool
 */
export function rollEvent(mapData) {
    const theme = mapData?.theme;
    const themeEvents = (theme && EVENTS_THEME[theme]) ? EVENTS_THEME[theme] : [];
    const pool = mapData?.eventPool || [];

    // 40% chance to pick themed event if available, else general pool
    if (themeEvents.length > 0 && Math.random() < 0.4) {
        return themeEvents[Math.floor(Math.random() * themeEvents.length)];
    }

    if (pool.length > 0) {
        const id = pool[Math.floor(Math.random() * pool.length)];
        const found = EVENTS_GENERAL.find(e => e.id === id);
        if (found) return found;
    }

    return EVENTS_GENERAL[Math.floor(Math.random() * EVENTS_GENERAL.length)];
}

export { weightedPick };
