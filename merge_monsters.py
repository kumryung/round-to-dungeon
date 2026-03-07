import json

base_monsters = [
    { 'typeId': 'm_summoner', 'name': '소환술사', 'nameKey': 'monsters.m_summoner.name', 'emoji': '🧙‍♂️', 'lv': 1, 'hp': 15, 'atk': 3, 'spd': 4, 'eva': 5, 'def': 0, 'growth': { 'hp': 0.15, 'atk': 0.1, 'eva': 0.5, 'def': 0 }, 'parts': { 'head': True, 'body': True, 'legs': True }, 'partsHit': { 'head': 40, 'body': 80, 'legs': 60 }, 'loot': [{ 'id': 'mat_wood', 'weight': 40 }, { 'id': 'mat_mana_stone', 'weight': 10 }], 'ability': 'summon_bat', 'abilityDesc': '턴 경과 시 Bat 소환 시도', 'fear': False },
    { 'typeId': 'm_goblin', 'name': '고블린', 'nameKey': 'monsters.m_goblin.name', 'emoji': '👺', 'lv': 1, 'hp': 18, 'atk': 4, 'spd': 5, 'eva': 5, 'def': 0, 'growth': { 'hp': 0.15, 'atk': 0.1, 'eva': 0.5, 'def': 0 }, 'parts': { 'head': True, 'body': True, 'legs': True }, 'partsHit': { 'head': 40, 'body': 80, 'legs': 60 }, 'loot': [{ 'id': 'mat_leather_strap', 'weight': 30 }, { 'id': 'mat_iron_ore', 'weight': 30 }], 'ability': None, 'abilityDesc': '기본형 몬스터', 'fear': False },
    { 'typeId': 'm_bat', 'name': '박쥐', 'nameKey': 'monsters.m_bat.name', 'emoji': '🦇', 'lv': 1, 'hp': 12, 'atk': 3, 'spd': 12, 'eva': 15, 'def': 0, 'growth': { 'hp': 0.1, 'atk': 0.1, 'eva': 0.5, 'def': 0 }, 'parts': { 'head': True, 'body': True, 'legs': False }, 'partsHit': { 'head': 40, 'body': 80, 'legs': 0 }, 'loot': [{ 'id': 'mat_beast_tendon', 'weight': 30 }], 'ability': None, 'abilityDesc': '비행형, 회피 높음', 'fear': False },
    { 'typeId': 'm_orc', 'name': '오크', 'nameKey': 'monsters.m_orc.name', 'emoji': '👹', 'lv': 1, 'hp': 28, 'atk': 6, 'spd': 3, 'eva': 0, 'def': 1, 'growth': { 'hp': 0.2, 'atk': 0.15, 'eva': 0, 'def': 0.5 }, 'parts': { 'head': True, 'body': True, 'legs': True }, 'partsHit': { 'head': 40, 'body': 80, 'legs': 60 }, 'loot': [{ 'id': 'mat_iron_ore', 'weight': 40 }, { 'id': 'mat_iron_stud', 'weight': 20 }], 'ability': None, 'abilityDesc': '높은 체력/공격력, 낮은 속도', 'fear': False },
    { 'typeId': 'm_ghost', 'name': '유령', 'nameKey': 'monsters.m_ghost.name', 'emoji': '👻', 'lv': 1, 'hp': 20, 'atk': 5, 'spd': 8, 'eva': 20, 'def': 0, 'growth': { 'hp': 0.15, 'atk': 0.1, 'eva': 0.5, 'def': 0 }, 'parts': { 'head': False, 'body': True, 'legs': False }, 'partsHit': { 'head': 0, 'body': 80, 'legs': 0 }, 'loot': [{ 'id': 'mat_sticky_sap', 'weight': 30 }, { 'id': 'mat_mana_stone', 'weight': 5 }], 'ability': 'phys_resist', 'abilityDesc': '물리 공격 50% 반감, 몸통만 존재', 'fear': True },
    { 'typeId': 'm_skeleton', 'name': '해골', 'nameKey': 'monsters.m_skeleton.name', 'emoji': '💀', 'lv': 1, 'hp': 25, 'atk': 6, 'spd': 6, 'eva': 5, 'def': 1, 'growth': { 'hp': 0.15, 'atk': 0.1, 'eva': 0.5, 'def': 0.2 }, 'parts': { 'head': True, 'body': True, 'legs': True }, 'partsHit': { 'head': 40, 'body': 80, 'legs': 60 }, 'loot': [{ 'id': 'mat_iron_stud', 'weight': 30 }, { 'id': 'mat_sharp_blade', 'weight': 10 }], 'ability': None, 'abilityDesc': '관통 공격에 취약', 'fear': False },
    { 'typeId': 'm_warlock', 'name': '암흑사제', 'nameKey': 'monsters.m_warlock.name', 'emoji': '🧛', 'lv': 1, 'hp': 22, 'atk': 7, 'spd': 7, 'eva': 10, 'def': 0, 'growth': { 'hp': 0.15, 'atk': 0.2, 'eva': 0.5, 'def': 0.2 }, 'parts': { 'head': True, 'body': True, 'legs': True }, 'partsHit': { 'head': 40, 'body': 80, 'legs': 60 }, 'loot': [{ 'id': 'mat_mana_stone', 'weight': 30 }, { 'id': 'mat_rune', 'weight': 10 }], 'ability': 'magic_atk', 'abilityDesc': '원거리 마법 공격', 'fear': True },
    { 'typeId': 'm_goblin_king', 'name': '킹 고블린', 'nameKey': 'monsters.m_goblin_king.name', 'emoji': '👑', 'lv': 1, 'hp': 45, 'atk': 8, 'spd': 6, 'eva': 10, 'def': 2, 'growth': { 'hp': 0.25, 'atk': 0.15, 'eva': 0.5, 'def': 0.5 }, 'parts': { 'head': True, 'body': True, 'legs': True }, 'partsHit': { 'head': 40, 'body': 80, 'legs': 60 }, 'loot': [{ 'id': 'mat_steel_part', 'weight': 40 }, { 'id': 'mat_sharp_blade', 'weight': 30 }, { 'id': 'mat_iron_ore', 'weight': 50 }], 'ability': 'buff_goblins', 'abilityDesc': '주변 고블린 강화 버프', 'fear': False },
    { 'typeId': 'm_slime', 'name': '슬라임', 'nameKey': 'monsters.m_slime.name', 'emoji': '🟢', 'lv': 1, 'hp': 25, 'atk': 4, 'spd': 2, 'eva': 0, 'def': 0, 'growth': { 'hp': 0.2, 'atk': 0.1, 'eva': 0, 'def': 0 }, 'parts': { 'head': False, 'body': True, 'legs': False }, 'partsHit': { 'head': 0, 'body': 80, 'legs': 0 }, 'loot': [{ 'id': 'mat_sticky_sap', 'weight': 40 }], 'ability': None, 'abilityDesc': '몸통만 타격 가능', 'fear': False },
    { 'typeId': 'm_demon', 'name': '악마', 'nameKey': 'monsters.m_demon.name', 'emoji': '😈', 'lv': 1, 'hp': 40, 'atk': 10, 'spd': 9, 'eva': 10, 'def': 2, 'growth': { 'hp': 0.2, 'atk': 0.2, 'eva': 0.5, 'def': 0.5 }, 'parts': { 'head': True, 'body': True, 'legs': True }, 'partsHit': { 'head': 40, 'body': 80, 'legs': 60 }, 'loot': [{ 'id': 'mat_mana_heart', 'weight': 10 }, { 'id': 'mat_rune', 'weight': 20 }, { 'id': 'mat_beast_tendon', 'weight': 30 }], 'ability': 'burn', 'abilityDesc': '공격 시 화상 디버프 부여', 'fear': True },
    { 'typeId': 'm_balrog', 'name': '발록', 'nameKey': 'monsters.m_balrog.name', 'emoji': '🔥', 'lv': 1, 'hp': 50, 'atk': 12, 'spd': 5, 'eva': 5, 'def': 3, 'growth': { 'hp': 0.3, 'atk': 0.2, 'eva': 0.5, 'def': 0.5 }, 'parts': { 'head': True, 'body': True, 'legs': True }, 'partsHit': { 'head': 40, 'body': 80, 'legs': 60 }, 'loot': [{ 'id': 'mat_mana_heart', 'weight': 15 }, { 'id': 'mat_steel_part', 'weight': 30 }, { 'id': 'mat_rune', 'weight': 20 }], 'ability': 'aoe', 'abilityDesc': '2턴마다 광역 공격', 'fear': False },
    { 'typeId': 'm_dark_knight', 'name': '암흑기사', 'nameKey': 'monsters.m_dark_knight.name', 'emoji': '⚔️', 'lv': 1, 'hp': 55, 'atk': 10, 'spd': 8, 'eva': 10, 'def': 4, 'growth': { 'hp': 0.25, 'atk': 0.15, 'eva': 0.5, 'def': 1 }, 'parts': { 'head': True, 'body': True, 'legs': True }, 'partsHit': { 'head': 40, 'body': 80, 'legs': 60 }, 'loot': [{ 'id': 'mat_steel_part', 'weight': 40 }, { 'id': 'mat_sharp_blade', 'weight': 30 }], 'ability': 'high_def', 'abilityDesc': '높은 방어력', 'fear': False },
    { 'typeId': 'm_poison_slime', 'name': '독슬라임', 'nameKey': 'monsters.m_poison_slime.name', 'emoji': '🟣', 'lv': 1, 'hp': 30, 'atk': 5, 'spd': 3, 'eva': 0, 'def': 0, 'growth': { 'hp': 0.2, 'atk': 0.15, 'eva': 0, 'def': 0 }, 'parts': { 'head': False, 'body': True, 'legs': False }, 'partsHit': { 'head': 0, 'body': 80, 'legs': 0 }, 'loot': [{ 'id': 'mat_sticky_sap', 'weight': 40 }, { 'id': 'mat_beast_tendon', 'weight': 20 }], 'ability': 'poison', 'abilityDesc': '피격 시 중독 부여', 'fear': False },
    { 'typeId': 'm_treant', 'name': '트렌트', 'nameKey': 'monsters.m_treant.name', 'emoji': '🌳', 'lv': 1, 'hp': 40, 'atk': 8, 'spd': 1, 'eva': 0, 'def': 3, 'growth': { 'hp': 0.3, 'atk': 0.2, 'eva': 0, 'def': 0.5 }, 'parts': { 'head': True, 'body': True, 'legs': True }, 'partsHit': { 'head': 40, 'body': 80, 'legs': 60 }, 'loot': [{ 'id': 'mat_wood', 'weight': 60 }, { 'id': 'mat_sticky_sap', 'weight': 30 }], 'ability': 'entangle', 'abilityDesc': '화염 취약, 뿌리 묶기(민첩 감소)', 'fear': False },
    { 'typeId': 'm_giant_slime', 'name': '대형 슬라임', 'nameKey': 'monsters.m_giant_slime.name', 'emoji': '🫧', 'lv': 1, 'hp': 50, 'atk': 10, 'spd': 2, 'eva': 0, 'def': 0, 'growth': { 'hp': 0.35, 'atk': 0.2, 'eva': 0, 'def': 0 }, 'parts': { 'head': False, 'body': True, 'legs': False }, 'partsHit': { 'head': 0, 'body': 80, 'legs': 0 }, 'loot': [{ 'id': 'mat_sticky_sap', 'weight': 50 }, { 'id': 'mat_mana_heart', 'weight': 5 }], 'ability': 'split', 'abilityDesc': '사망 시 분열 가능성', 'fear': False },
    { 'typeId': 'm_mimic', 'name': '미믹', 'nameKey': 'monsters.m_mimic.name', 'emoji': '📦', 'lv': 1, 'hp': 40, 'atk': 15, 'spd': 15, 'eva': 10, 'def': 0, 'growth': { 'hp': 0.2, 'atk': 0.2, 'eva': 1, 'def': 0 }, 'parts': { 'head': False, 'body': True, 'legs': False }, 'partsHit': { 'head': 0, 'body': 80, 'legs': 0 }, 'loot': [{ 'id': 'mat_steel_part', 'weight': 40 }, { 'id': 'mat_iron_ore', 'weight': 40 }], 'ability': 'first_crit', 'abilityDesc': '상자 위장, 첫 턴 확정 치명타', 'fear': True },
]

out_lines = []
out_lines.append("// ─── Monster Data ───")
out_lines.append("// Auto-generated from type * level logic. (16 types x 10 levels = 160 monsters)")
out_lines.append("")
out_lines.append("export const MONSTERS = {")

def getDictStr(d):
    return json.dumps(d)

for t_idx, base in enumerate(base_monsters):
    tid = t_idx + 1
    typeId = base["typeId"]
    g = base["growth"]
    
    for level in range(1, 11):
        numId = tid * 1000 + level
        lvDiff = level - 1
        
        hp = round(base["hp"] * (1 + lvDiff * g["hp"]))
        atk = round(base["atk"] * (1 + lvDiff * g["atk"]))
        eva = min(80, base["eva"] + lvDiff * g["eva"])
        def_val = round(base["def"] + lvDiff * g["def"])
        
        baseExp = base.get("baseExp", base["hp"] * 0.5 + base["atk"] * 1.5)
        exp = round(baseExp * (1 + lvDiff * 0.3))
        
        name = f"{base['name']} lv{level}"
        
        # Build obj
        out_lines.append(f"    {numId}: {{")
        out_lines.append(f"        id: {numId}, typeId: '{typeId}', name: '{name}', nameKey: '{base['nameKey']}', emoji: '{base['emoji']}',")
        out_lines.append(f"        level: {level}, hp: {hp}, maxHp: {hp}, atk: {atk}, spd: {base['spd']}, eva: {eva}, def: {def_val}, exp: {exp},")
        out_lines.append(f"        parts: {getDictStr(base['parts']).replace('\"', '')}, partsHit: {getDictStr(base['partsHit']).replace('\"', '')},")
        out_lines.append(f"        loot: {getDictStr(base['loot'])},")
        
        ability_str = f"'{base['ability']}'" if base['ability'] else "null"
        out_lines.append(f"        ability: {ability_str}, abilityDesc: '{base['abilityDesc']}', fear: {'true' if base['fear'] else 'false'}")
        out_lines.append("    },")

out_lines.append("};")
out_lines.append("")
out_lines.append("/**")
out_lines.append(" * Lookup a monster by numeric ID. Stats are already pre-calculated by level.")
out_lines.append(" */")
out_lines.append("export function getMonster(numericId) {")
out_lines.append("    const base = MONSTERS[numericId];")
out_lines.append("    if (!base) return null;")
out_lines.append("    return { ...base };")
out_lines.append("}")

with open("c:/Work/round-the-dungeon/src/data/monsters.js", "w", encoding="utf-8") as f:
    f.write("\n".join(out_lines) + "\n")
