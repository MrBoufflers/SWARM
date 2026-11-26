#!/usr/bin/env python3
"""Maquette à l'échelle 1:1 (mm) du plateau papier : cases de 60 mm, cartes 44 x 68 mm. Sortie : maquette-plateau.svg"""
C = 60; M = 48; N = 9 * C + 2 * M
COL = {"N": "#4a86d0", "E": "#46a96f", "S": "#d9a12e", "O": "#c25fab"}
def cx(x): return M + (x + 4) * C
def cy(y): return M + (4 - y) * C
def lane(x, y):
    if abs(y) > abs(x): return "N" if y > 0 else "S"
    if abs(x) > abs(y): return "E" if x > 0 else "O"
    return None
def ring(x, y): return max(abs(x), abs(y))
o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{N}mm" height="{N + 70}mm" viewBox="0 0 {N} {N + 70}" font-family="Arial, sans-serif">',
     f'<rect width="{N}" height="{N + 70}" fill="#f4f1ea"/>']
for x in range(-4, 5):
    for y in range(-4, 5):
        l, r = lane(x, y), ring(x, y)
        X, Y = cx(x), cy(y)
        if x == 0 and y == 0:
            o.append(f'<rect x="{X}" y="{Y}" width="{C}" height="{C}" fill="#3a3a3a" stroke="#222"/><text x="{X + C/2}" y="{Y + C/2 + 3}" font-size="9" fill="#fff" text-anchor="middle" font-weight="700">FUSÉE</text>')
        elif l:
            op = {1: .55, 2: .40, 3: .28, 4: .13}[r]
            o.append(f'<rect x="{X}" y="{Y}" width="{C}" height="{C}" fill="{COL[l]}" fill-opacity="{op}" stroke="#555" stroke-width=".4"/>')
            if r == 4 and abs((x if l in "NS" else y)) <= 2:
                u = x if l in "NS" else y
                o.append(f'<text x="{X + 4}" y="{Y + 9}" font-size="7" fill="#444">{"ABCDE"[u + 2 if l in "NO" else (u + 2 if l in "N" else 2 - u if l == "S" else 2 - u)]}</text>')
        elif r <= 3:
            o.append(f'<rect x="{X}" y="{Y}" width="{C}" height="{C}" fill="#2aa6a6" fill-opacity=".25" stroke="#555" stroke-width=".4"/><text x="{X + C/2}" y="{Y + C/2 + 3}" font-size="7" text-anchor="middle" fill="#145">support {r}</text>')
        else:
            o.append(f'<rect x="{X}" y="{Y}" width="{C}" height="{C}" fill="#e9e5db" stroke="#ccc" stroke-width=".3"/>')
# tuiles de démonstration
def tile(x, y, name, pv, back=False):
    X, Y = cx(x) + 5, cy(y) + 5
    s = f'<rect x="{X}" y="{Y}" width="50" height="50" rx="3" fill="{"#555" if back else "#f2e9d0"}" stroke="#222"/>'
    if not back: s += f'<text x="{X + 25}" y="{Y + 22}" font-size="7" text-anchor="middle" font-weight="700">{name}</text><text x="{X + 25}" y="{Y + 40}" font-size="11" text-anchor="middle">{pv} PV</text>'
    else: s += f'<text x="{X + 25}" y="{Y + 30}" font-size="9" text-anchor="middle" fill="#ddd">?</text>'
    return s
o.append(tile(0, 1, "BARBELÉ", 1)); o.append(tile(0, 2, "MURAILLE", 4)); o.append(tile(1, 2, "", 0, True))
# pile de cartes créatures : le bas de chaque carte (bande de 12 mm) est visible ; on empile vers l'extérieur de la lane
ROT = {"N": 0, "E": 90, "S": 180, "O": -90}
def stack(x, y, names):
    l = lane(x, y); X, Y = cx(x) + C / 2, cy(y) + C / 2
    g = [f'<g transform="translate({X} {Y}) rotate({ROT[l]})">']
    n = len(names)
    for i, nm in enumerate(names):          # i = 0 : carte du dessous (la plus proche de la fusée)
        off = -(i * 12)                      # décalage vers l'extérieur (haut dans le repère de la carte)
        top = 34 - 68 + off                  # le bas de la 1re carte est à 34 mm sous le centre de la case
        g.append(f'<rect x="-22" y="{top}" width="44" height="68" rx="3" fill="#fff" stroke="#222" stroke-width=".6"/>'
                 f'<rect x="-22" y="{top + 56}" width="44" height="12" rx="2" fill="{COL[l]}" fill-opacity=".35" stroke="#222" stroke-width=".3"/>'
                 f'<text x="-19" y="{top + 64.5}" font-size="4" font-weight="700">{nm}</text><text x="19" y="{top + 64.5}" font-size="4.5" text-anchor="end">3/1</text>')
    g.append("</g>"); return "".join(g)
o.append(stack(0, 3, ["ÉCORCHEUR", "CARAPACE", "ŒIL-SONDE"]))
o.append(stack(3, 0, ["ÉCORCHEUR", "CARAPACE"]))
o.append(stack(-1, -4, ["RAVAGEUR", "BÉHÉMOTH", "HURLEUR", "SAPEUR"]))
# légende
o.append(f'<g transform="translate({M} {N + 5})" font-size="8"><rect width="60" height="3" fill="#222"/><text y="11">60 mm = 1 case</text>'
         f'<text x="90" y="8">Imprimer à 100 % : 1 case = 6 cm. Cartes créatures 44 × 68 mm (bande du bas de 12 mm visible), tuiles de bâtiment 50 × 50 mm.</text>'
         f'<text x="90" y="19">Les cartes sont orientées bande vers la fusée et s\'empilent vers l\'extérieur de la lane (Nord : vers le haut, Est : vers la droite…).</text>'
         f'<text x="90" y="30">Marge de 48 mm autour du plateau : une pile de 4 cartes sur une case d\'entrée dépasse de 45 mm.</text>'
         f'<text x="90" y="41">Piles de démonstration : Nord C3 (3 cartes), Est (2 cartes) et entrée Sud (4 cartes).</text></g>')
o.append("</svg>")
open("docs/papier/maquette-plateau.svg", "w").write("\n".join(o))
