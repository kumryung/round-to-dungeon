import json
import random

THEMES = ["forest", "mine", "ruins", "swamp"]

# The 40 new types we need to generate
NEW_TYPES = [
    'Workshop', 'Armory', 'Generator', 'Control Room', 'Hangar', 
    'Forge', 'Foundry', 'Reactor', 'Infirmary', 'Market',
    'Dormitory', 'Kitchen', 'Pantry', 'Dining Hall', 'Barracks', 
    'Office', 'Study', 'Library', 'Prison', 'Sanctuary',
    'Ventilation', 'Bridge', 'Sewer', 'Garden', 'Balcony', 
    'Elevator', 'Portal', 'Catwalk', 'Dock', 'Plaza',
    'Catacombs', 'Throne Room', 'Crypt', 'Trial Chamber', 
    'Altar', 'Vault', 'Minefield', 'Nest', 'Observatory'
] # Skipped 'Ruins' since it's already a theme name, but adding it won't hurt, we'll map it.

TYPE_META = {
    'Workshop': {'icon': '⚒️'}, 'Armory': {'icon': '🛡️'}, 'Generator': {'icon': '⚡'}, 
    'Control Room': {'icon': '🎛️'}, 'Hangar': {'icon': '🛸'}, 'Forge': {'icon': '🔥'}, 
    'Foundry': {'icon': '🏭'}, 'Reactor': {'icon': '☢️'}, 'Infirmary': {'icon': '🏥'}, 
    'Market': {'icon': '⚖️'}, 'Dormitory': {'icon': '🛏️'}, 'Kitchen': {'icon': '🍳'}, 
    'Pantry': {'icon': '🥫'}, 'Dining Hall': {'icon': '🍽️'}, 'Barracks': {'icon': '🪖'}, 
    'Office': {'icon': '💼'}, 'Study': {'icon': '📚'}, 'Library': {'icon': '📖'}, 
    'Prison': {'icon': '⛓️'}, 'Sanctuary': {'icon': '🕊️'}, 'Ventilation': {'icon': '💨'}, 
    'Bridge': {'icon': '🌉'}, 'Sewer': {'icon': '🕳️'}, 'Garden': {'icon': '🌺'}, 
    'Balcony': {'icon': '🔭'}, 'Elevator': {'icon': '🛗'}, 'Portal': {'icon': '🌌'}, 
    'Catwalk': {'icon': '🪜'}, 'Dock': {'icon': '⚓'}, 'Plaza': {'icon': '⛲'},
    'Catacombs': {'icon': '🦴'}, 'Throne Room': {'icon': '👑'}, 'Crypt': {'icon': '⚰️'}, 
    'Trial Chamber': {'icon': '⚔️'}, 'Altar': {'icon': '🪨'}, 'Vault': {'icon': '🪙'}, 
    'Minefield': {'icon': '💥'}, 'Nest': {'icon': '🕸️'}, 'Observatory': {'icon': '👁️'}
}

# Theme style builders
def carve_path(matrix, path, val=1):
    for r, c in path:
        if 0 <= r < len(matrix) and 0 <= c < len(matrix[0]):
            matrix[r][c] = val

def generate_layout(theme):
    w = random.randint(7, 12)
    h = random.randint(7, 12)
    matrix = [[0 for _ in range(w)] for _ in range(h)]
    
    # Generate some random connected path logic based on theme
    points = []
    if theme == "forest":
        # Winding smooth curves
        points = [(h//2, 0), (h//3, w//3), (h//2, w//2), (h-2, w-2), (h//2, w-1)]
    elif theme == "mine":
        # Jagged
        points = [(h//2, 0), (h//2, w//2), (0, w//2), (0, w-1)]
        if random.random() > 0.5:
             points = [(h-1, w//2), (h//2, w//2), (h//2, w-1)]
    elif theme == "ruins":
        # Blocky and branched
        points = [(h//2, 0), (h//2, w-1)]
        carve_path(matrix, [(r, w//2) for r in range(h)])
    else: # swamp
        # Blobby loops
        points = [(h//2, 0), (h//2, w-1)]
        for r in range(h//4, 3*h//4):
            for c in range(w//4, 3*w//4):
                if random.random() < 0.7: matrix[r][c] = 1

    curr_p = points[0]
    for p in points[1:]:
        # Walker
        while curr_p != p:
            matrix[curr_p[0]][curr_p[1]] = 1
            if curr_p[0] < p[0]: curr_p = (curr_p[0]+1, curr_p[1])
            elif curr_p[0] > p[0]: curr_p = (curr_p[0]-1, curr_p[1])
            elif curr_p[1] < p[1]: curr_p = (curr_p[0], curr_p[1]+1)
            elif curr_p[1] > p[1]: curr_p = (curr_p[0], curr_p[1]-1)
        matrix[curr_p[0]][curr_p[1]] = 1

    # Extract valid exits
    exits = {"top": [], "right": [], "bottom": [], "left": []}
    for c in range(w):
        if matrix[0][c] == 1: exits["top"].append({"col": c})
        if matrix[h-1][c] == 1: exits["bottom"].append({"col": c})
    for r in range(h):
        if matrix[r][0] == 1: exits["left"].append({"row": r})
        if matrix[r][w-1] == 1: exits["right"].append({"row": r})
        
    return matrix, exits

def validate_connectivity(matrix):
    cells = [(r, c) for r in range(len(matrix)) for c in range(len(matrix[0])) if matrix[r][c] == 1]
    if not cells: return False
    
    visited = set()
    q = [cells[0]]
    visited.add(cells[0])
    
    while q:
        r, c = q.pop(0)
        for dr, dc in [(-1,0), (1,0), (0,-1), (0,1)]:
            nr, nc = r+dr, c+dc
            if 0 <= nr < len(matrix) and 0 <= nc < len(matrix[0]) and matrix[nr][nc] == 1 and (nr,nc) not in visited:
                visited.add((nr, nc))
                q.append((nr, nc))
                
    return len(visited) == len(cells)

def generate():
    js_output = "export const GENERATED_TILES = {\n"
    
    # Base ID mappings per theme to avoid collisions
    # forest: 400+, mine: 500+, ruins: 600+, swamp: 700+
    t_ids = {"forest": 401, "mine": 501, "ruins": 601, "swamp": 701}
    
    # 3 of each type per theme
    for theme in THEMES:
        for t_type in NEW_TYPES:
            for variant in range(3):
                t_id = t_ids[theme]
                t_ids[theme] += 1
                
                icon = TYPE_META.get(t_type, {}).get('icon', '❓')
                name = f"{theme.title()}_V{variant+1}"
                
                # Keep regenerating until we have at least 1 exit and it is fully connected
                layout, exits = [], {}
                while True:
                    layout, exits = generate_layout(theme)
                    valid_exits = sum([len(e) for e in exits.values()])
                    if valid_exits >= 1 and validate_connectivity(layout):
                        break
                
                # Format to JS string
                layout_str = "[\n" + ",\n".join(["            [" + ",".join(map(str, row)) + "]" for row in layout]) + "\n        ]"
                exits_str = f"{{ top: {json.dumps(exits['top'])}, right: {json.dumps(exits['right'])}, bottom: {json.dumps(exits['bottom'])}, left: {json.dumps(exits['left'])} }}"
                
                js_output += f"""    {t_id}: {{
        id: {t_id}, tileType: '{t_type}', theme: '{theme}', name: '{name}', icon: '{icon}',
        layout: {layout_str},
        exits: {exits_str},
        eventSpawn: {{ maxCount: 1, generalCount: [0, 1], tileTypeCount: [0, 0] }},
        mobSpawn: null,
    }},\n"""

    js_output += "};\n"
    
    with open("generated_tiles.js", "w", encoding="utf-8") as f:
        f.write(js_output)
    print("Done. Created generated_tiles.js")

if __name__ == "__main__":
    generate()
