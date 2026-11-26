#!/usr/bin/env python3
"""Simulation des supports de main (deux rangées étagées), échelle 1:1 en mm. Sortie : supports-main.svg"""
W, H = 290, 360
o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}mm" height="{H}mm" viewBox="0 0 {W} {H}" font-family="Arial, sans-serif"><rect width="{W}" height="{H}" fill="#f4f1ea"/>']
STEP, GH = 14, 12   # marche entre rangées ; hauteur de tuile enfoncée dans la rainure
def rack(ox, oy, t, n, label, col, names):
    pitch = t + 4; wid = n * pitch + 8
    o.append(f'<text x="{ox}" y="{oy}" font-size="8" font-weight="700">{label}</text>')
    front_bottom = oy + 14 + STEP + t - GH + 18      # haut du socle avant
    # rangée arrière (dessinée d'abord), puis marche, puis rangée avant
    for row in (1, 0):
        y0 = front_bottom - t + GH - (STEP if row else 0) - 0
        for i in range(n):
            x = ox + 4 + i * pitch
            nm = names[(row * n + i) % len(names)]
            o.append(f'<rect x="{x}" y="{y0}" width="{t}" height="{t}" rx="2" fill="{col}" fill-opacity="{.8 if row else 1}" stroke="#222" stroke-width=".6"/>'
                     f'<text x="{x + t / 2}" y="{y0 + 6.5}" font-size="{min(5.5, t * .17):.1f}" text-anchor="middle" font-weight="700">{nm}</text>')
        if row:
            o.append(f'<rect x="{ox}" y="{front_bottom - STEP}" width="{wid}" height="{STEP}" fill="#b6946a" stroke="#5a4326"/>')  # arrière du support (cache le bas des tuiles arrière)
    o.append(f'<rect x="{ox}" y="{front_bottom}" width="{wid}" height="18" rx="2" fill="#9a7b52" stroke="#5a4326"/>')
    # profil
    py = front_bottom + 34
    o.append(f'<text x="{ox}" y="{py - 4}" font-size="5.5" fill="#555">Profil, échelle 1:1</text>')
    pw = 40
    o.append(f'<path d="M{ox} {py + 38} L{ox} {py + STEP + 6} L{ox + 14} {py + STEP + 6} L{ox + 14} {py + 6} L{ox + 28} {py + 6} L{ox + 28} {py + 38} Z" fill="#b6946a" stroke="#5a4326"/>')
    for dx, top in ((4, py + STEP + 6), (18, py + 6)):
        o.append(f'<rect x="{ox + dx}" y="{top - (t - GH)}" width="3" height="{t - GH}" fill="{col}" stroke="#222" stroke-width=".4"/>')
    o.append(f'<text x="{ox + 36}" y="{py + 18}" font-size="5.5" fill="#555">rainures 3,5 mm · marche de {STEP} mm</text>'
             f'<text x="{ox + 36}" y="{py + 26}" font-size="5.5" fill="#555">tuile de {t} mm : {t - GH} mm visibles (nom en haut)</text>')
rack(15, 22, 30, 5, "ESSAIM : 2 × 5 tuiles de 30 mm (main de 10)", "#c9b3e6", ["ÉCORCH.", "CARAP.", "ŒIL", "RAVAG.", "HURL."])
rack(15, 175, 50, 4, "COLONIE : 2 × 4 tuiles de 50 mm (main de 7, 8 places)", "#f2e9d0", ["MURAILLE", "ANTENNE", "HAIE", "MINE ?", "RENFORT", "LABO", "DORTOIR", "?"])
o.append("</svg>"); open("docs/papier/supports-main.svg", "w").write("\n".join(o))
