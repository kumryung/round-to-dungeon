import re

with open("c:/Work/round-the-dungeon/src/data/maps.js", "r", encoding="utf-8") as f:
    content = f.read()

# Split into blocks by "id: "
blocks = content.split("id: '")
if len(blocks) > 0:
    blocks = blocks[1:] # discard header

out_lines = [
    "// ─── Map Data ───",
    "// Level 1~10, themed maps. Multi-floor dungeon structure.",
    "",
    "export const MAPS = ["
]

for b in blocks:
    # map_id is everything up to the first "'"
    map_id = b.split("'", 1)[0]
    
    def extract(key, text, is_int=False, is_str=True, is_opt=False, quote="'"):
        pat = key + r":\s*" + (f"{quote}(.*?){quote}" if is_str else r"(\d+)")
        m = re.search(pat, text)
        if m:
            val = m.group(1)
            return int(val) if is_int else val
        return None

    name_key = extract("nameKey", b, is_str=True)
    name = extract("name", b, is_str=True)
    name_en = extract("nameEn", b, is_str=True, quote='"') # Some don't have this, it's fine
    icon = extract("icon", b, is_str=True)
    theme = extract("theme", b, is_str=True)
    unlockTownLv = extract("unlockTownLv", b, is_int=True, is_str=False)
    mapLv = extract("mapLv", b, is_int=True, is_str=False)
    desc = extract("desc", b, is_str=True)

    if not map_id or not mapLv:
        continue

    # Determine floors
    if mapLv <= 3:
        num_floors = 2
        tile_base = 5 + mapLv
    elif mapLv <= 7:
        num_floors = 3
        tile_base = 6 + mapLv
    else:
        num_floors = 4
        tile_base = 7 + mapLv

    out_lines.append("    {")
    out_lines.append(f"        id: '{map_id}', nameKey: '{name_key}', name: '{name}',")
    if name_en:
        out_lines.append(f"        nameEn: \"{name_en}\",")
    out_lines.append(f"        icon: '{icon}', theme: '{theme}',")
    out_lines.append(f"        unlockTownLv: {unlockTownLv}, mapLv: {mapLv},")
    out_lines.append("        floors: [")
    
    for f in range(1, num_floors + 1):
        if f == 1:
            start_type = "'hub'"
        else:
            start_type = "'stairs'"
            
        if f == num_floors:
            end_type = "'exit'"
        else:
            end_type = "'stairs'"
            
        t_min = tile_base
        t_max = tile_base + 3
        out_lines.append("            {")
        out_lines.append(f"                floor: {f},")
        out_lines.append(f"                tileCount: [{t_min}, {t_max}],")
        out_lines.append(f"                startType: {start_type},")
        out_lines.append(f"                endType: {end_type},")
        out_lines.append("            },")
        
    out_lines.append("        ],")
    out_lines.append("        autoGenerate: {")
    out_lines.append("            tilePool: null, // theme-based")
    out_lines.append("        },")
    out_lines.append(f"        desc: '{desc}',")
    out_lines.append("    },")

out_lines.append("];\n")

with open("c:/Work/round-the-dungeon/src/data/maps.js", "w", encoding="utf-8") as f:
    f.write("\n".join(out_lines))
