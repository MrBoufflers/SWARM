"""Livret de règles : docs/regles-v0.3.md → docs/livret.html (page à imprimer), avec les schémas redessinés.
Le PDF est ensuite produit par tools/livret-pdf.js (Chromium). Usage : npm run livret
"""
import html
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "docs/regles-v0.3.md"
OUT = ROOT / "docs/livret.html"


def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<i>\1</i>", t)
    t = re.sub(r"`(.+?)`", r"<code>\1</code>", t)
    t = t.replace("†", "<sup>†</sup>")
    return t


# ---------------------------------------------------------------- schémas (SVG)
def svg_depart():
    cell, gap, x0, y0 = 86, 8, 40, 44
    def box(i, j, kind):
        x, y = x0 + j * (cell + gap), y0 + i * (cell + gap)
        fill, stroke = {"sup": ("#ececea", "#c9c9c5"), "haie": ("#fbe6dc", "#e07a4f"), "fusee": ("#e3edf8", "#3a78c2")}[kind]
        label = {"sup": ("Tourelle", "niveau 1"), "haie": ("Haie d'épines", "1 PV · Épines 1"), "fusee": ("Fusée", "")}[kind]
        out = f'<rect x="{x}" y="{y}" width="{cell}" height="{cell}" rx="7" fill="{fill}" stroke="{stroke}" stroke-width="{2 if kind == "fusee" else 1.4}"/>'
        out += f'<text x="{x + cell / 2}" y="{y + cell / 2 - 3}" class="b">{label[0]}</text>'
        if label[1]:
            out += f'<text x="{x + cell / 2}" y="{y + cell / 2 + 14}" class="s">{label[1]}</text>'
        return out
    kinds = [["sup", "haie", "sup"], ["haie", "fusee", "haie"], ["sup", "haie", "sup"]]
    g = "".join(box(i, j, kinds[i][j]) for i in range(3) for j in range(3))
    w = 3 * cell + 2 * gap
    g += f'<text x="{x0 + w / 2}" y="{y0 - 14}" class="d">NORD</text><text x="{x0 + w / 2}" y="{y0 + w + 26}" class="d">SUD</text>'
    g += f'<text x="{x0 - 18}" y="{y0 + w / 2 + 4}" class="d">O</text><text x="{x0 + w + 18}" y="{y0 + w / 2 + 4}" class="d">E</text>'
    lx = x0 + w + 60
    lines = [("t", "À mettre en place"), ("", "Fusée : le socle seul, aucun étage"), ("", "4 Haies d'épines de départ (1 PV, Épines 1),"),
             ("", "une par lane, face visible"), ("", "4 tourelles de niveau 1 dans les coins"), ("hr", ""),
             ("", "Colonie : 3 travailleurs, 4 tuiles en main"), ("", "Essaim : 3 de biomasse, pioche de niveau 1"), ("t", "L'essaim joue en premier")]
    y = y0 + 10
    for kind, txt in lines:
        if kind == "hr":
            g += f'<line x1="{lx}" y1="{y - 6}" x2="{lx + 300}" y2="{y - 6}" stroke="#ddd"/>'
            y += 12
            continue
        g += f'<text x="{lx}" y="{y}" class="{"lt" if kind == "t" else "l"}">{html.escape(txt)}</text>'
        y += 24
    return (f'<figure><figcaption class="ft">La colonie démarre retranchée dans un carré de 3 × 3<span>Position de départ, vue de dessus</span></figcaption>'
            f'<svg viewBox="0 0 700 360" role="img" aria-label="Position de départ">{g}</svg>'
            f'<figcaption class="fc">position de départ · 4 haies d\'épines, 4 tourelles, la fusée</figcaption></figure>')


def svg_escalier():
    cell, gap, x0, y0 = 50, 6, 60, 40
    X = lambda u: x0 + (u + 3) * (cell + gap)
    Y = {3: y0, 2: y0 + cell + gap, 1: y0 + 2 * (cell + gap), 0: y0 + 3 * (cell + gap)}
    g = ""
    for i, c in enumerate("ABCDE"):
        g += f'<text x="{X(i - 2) + cell / 2}" y="{y0 - 12}" class="d">{c}</text>'
    for k in (3, 2, 1):
        g += f'<text x="{x0 - 26}" y="{Y[k] + cell / 2 + 4}" class="d">{k}</text>'
        for u in range(-3, 4):
            if abs(u) == k:
                kind = "corner"
            elif abs(u) < k:
                kind = "lane"
            else:
                kind = "void"
            x, y = X(u), Y[k]
            if kind == "void":
                g += f'<rect x="{x}" y="{y}" width="{cell}" height="{cell}" rx="5" fill="none" stroke="#e2e2df" stroke-dasharray="3 3"/>'
            elif kind == "corner":
                g += f'<rect x="{x}" y="{y}" width="{cell}" height="{cell}" rx="5" fill="#ececea" stroke="#c9c9c5"/><text x="{x + cell / 2}" y="{y + cell / 2 + 4}" class="s">{k}</text>'
            else:
                g += f'<rect x="{x}" y="{y}" width="{cell}" height="{cell}" rx="5" fill="#fbe6dc" stroke="#e07a4f" stroke-width="1.2"/>'
    for u in range(-3, 4):
        x, y = X(u), Y[0]
        if u == 0:
            g += f'<rect x="{x}" y="{y}" width="{cell}" height="{cell}" rx="5" fill="#e3edf8" stroke="#3a78c2" stroke-width="2"/><text x="{x + cell / 2}" y="{y + cell / 2 + 4}" class="s">Fusée</text>'
        else:
            g += f'<rect x="{x}" y="{y}" width="{cell}" height="{cell}" rx="5" fill="none" stroke="#e2e2df" stroke-dasharray="3 3"/>'
    C = lambda u, k: (X(u) + cell / 2, Y[k] + cell / 2)
    def path(pts, color, dx):
        d = " ".join(f"{x + dx},{y + dx}" for x, y in pts)
        return f'<polyline points="{d}" fill="none" stroke="{color}" stroke-width="3" stroke-linejoin="round" marker-end="url(#a-{color[1:]})"/>'
    green, blue = "#1f9d6c", "#1d3d7a"
    g += path([C(-2, 3), C(-1, 3), C(-1, 2), C(0, 2), C(0, 1), (C(0, 0)[0], Y[0] + 6)], green, -4)
    g += path([C(1, 3), C(1, 2), C(0, 2), C(0, 1)], blue, 4)
    lx = X(3) + cell + 40
    g += f'<line x1="{lx}" y1="{y0 + 8}" x2="{lx + 26}" y2="{y0 + 8}" stroke="{green}" stroke-width="3"/><text x="{lx + 36}" y="{y0 + 12}" class="l">A3 → B3 → B2 → C2 → C1</text>'
    g += f'<line x1="{lx}" y1="{y0 + 34}" x2="{lx + 26}" y2="{y0 + 34}" stroke="{blue}" stroke-width="3"/><text x="{lx + 36}" y="{y0 + 38}" class="l">D3 → D2 → C2 → C1</text>'
    g += f'<rect x="{lx + 4}" y="{y0 + 52}" width="16" height="16" rx="3" fill="#ececea" stroke="#c9c9c5"/><text x="{lx + 36}" y="{y0 + 64}" class="l">Coin de support : jamais traversé</text>'
    g += f'<text x="{lx}" y="{y0 + 104}" class="lt">Tous les chemins se rejoignent</text><text x="{lx}" y="{y0 + 124}" class="lt">en couronne 1 : l\'entonnoir</text>'
    g += f'<text x="{lx}" y="{y0 + 156}" class="l s2">Une case vide se traverse ;</text><text x="{lx}" y="{y0 + 174}" class="l s2">la créature frappe la première</text><text x="{lx}" y="{y0 + 192}" class="l s2">tuile sur son chemin.</text>'
    defs = "".join(f'<marker id="a-{c[1:]}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{c}"/></marker>' for c in (green, blue))
    return (f'<figure><figcaption class="ft">Chaque créature descend sa lane case par case, sans diagonale<span>Lane Nord, couronnes 3, 2 et 1 de haut en bas</span></figcaption>'
            f'<svg viewBox="0 0 720 280" role="img" aria-label="Chemin en escalier"><defs>{defs}</defs>{g}</svg>'
            f'<figcaption class="fc">chemin en escalier · lane Nord, 2 exemples</figcaption></figure>')


# ---------------------------------------------------------------- conversion du Markdown (sous-ensemble utilisé par le livret)
def convert(md):
    figures = [svg_depart(), svg_escalier()]
    out, para, i = [], [], 0
    lines = md.split("\n")

    def flush():
        if para:
            out.append("<p>" + inline(" ".join(para)) + "</p>")
            para.clear()

    while i < len(lines):
        L = lines[i]
        if not L.strip():
            flush(); i += 1; continue
        if L.strip().startswith("*[schéma"):
            flush(); out.append(figures.pop(0) if figures else ""); i += 1; continue
        m = re.match(r"^(#{1,4}) (.*)", L)
        if m:
            flush()
            n = len(m.group(1))
            out.append(f"<h{n}>{inline(m.group(2))}</h{n}>")
            if n == 1 and i + 2 < len(lines) and "@Oni" in lines[i + 2]:
                out.append('<p class="meta"><span>30 oct. 2026</span> · <span>@Oni</span></p>')
                i += 3
                continue
            i += 1; continue
        if L.startswith("|"):
            flush()
            rows = []
            while i < len(lines) and lines[i].startswith("|"):
                rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")])
                i += 1
            head, body = rows[0], [r for r in rows[1:] if not re.match(r"^-+$", r[0].replace(" ", ""))]
            t = "<table><thead><tr>" + "".join(f"<th>{inline(c)}</th>" for c in head) + "</tr></thead><tbody>"
            t += "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in body) + "</tbody></table>"
            out.append(t); continue
        if re.match(r"^- ", L) or re.match(r"^\d+\. ", L):
            flush()
            ordered = bool(re.match(r"^\d+\. ", L))
            items = []
            while i < len(lines) and (re.match(r"^- ", lines[i]) or re.match(r"^\d+\. ", lines[i])):
                items.append(re.sub(r"^(- |\d+\. )", "", lines[i])); i += 1
            tasks = all(re.match(r"^\[[ x]\] ", it) for it in items)
            if tasks:
                lis = "".join(f'<li class="{"done" if it[1] == "x" else ""}">{inline(it[4:])}</li>' for it in items)
                out.append(f'<ul class="tasks">{lis}</ul>')
            else:
                tag = "ol" if ordered else "ul"
                out.append(f"<{tag}>" + "".join(f"<li>{inline(it)}</li>" for it in items) + f"</{tag}>")
            continue
        para.append(L.strip()); i += 1
    flush()
    return "\n".join(out)


CSS = """
@page { size: A4; margin: 22mm 18mm 20mm; }
* { box-sizing: border-box; }
body { font-family: "Liberation Sans", "DejaVu Sans", Arial, sans-serif; font-size: 10.6pt; line-height: 1.5; color: #1f1f1d; margin: 0; }
h1, h2, h3 { font-family: "DejaVu Serif", "Liberation Serif", Georgia, serif; font-weight: 400; letter-spacing: -.01em; }
h1 { font-size: 24pt; margin: 0 0 8px; line-height: 1.15; }
h2 { font-size: 17pt; margin: 26px 0 8px; page-break-after: avoid; }
h3 { font-size: 13pt; margin: 18px 0 6px; page-break-after: avoid; }
h4 { font-size: 10.8pt; margin: 14px 0 6px; page-break-after: avoid; }
p { margin: 0 0 8px; }
.meta span { background: #f0efeb; border-radius: 6px; padding: 2px 8px; font-size: 9.5pt; }
ul, ol { margin: 0 0 8px; padding-left: 22px; } li { margin: 2px 0; }
ul.tasks { list-style: none; padding-left: 4px; }
ul.tasks li { position: relative; padding-left: 22px; }
ul.tasks li::before { content: ""; position: absolute; left: 0; top: 4px; width: 11px; height: 11px; border: 1px solid #b9b8b2; border-radius: 3px; background: #f4f3ef; }
ul.tasks li.done::before { background: #1f9d6c; border-color: #1f9d6c; }
ul.tasks li.done::after { content: "✓"; position: absolute; left: 2px; top: 0; color: #fff; font-size: 9pt; }
table { border-collapse: collapse; width: 100%; margin: 6px 0 12px; font-size: 9.6pt; page-break-inside: auto; }
tr { page-break-inside: avoid; }
th { background: #f3f2ee; color: #5f5e58; font-weight: 400; text-align: left; }
th, td { border: 1px solid #dddcd6; padding: 5px 8px; vertical-align: top; }
sup { font-size: 70%; }
figure { margin: 10px 0 6px; page-break-inside: avoid; }
figure svg { width: 100%; height: auto; font-family: "Liberation Sans", Arial, sans-serif; }
svg .b { font-size: 13px; font-weight: 700; text-anchor: middle; fill: #1f1f1d; }
svg .s { font-size: 11px; text-anchor: middle; fill: #6b6a64; }
svg .d { font-size: 11px; font-weight: 700; text-anchor: middle; fill: #6b6a64; letter-spacing: .06em; }
svg .l { font-size: 12px; fill: #3d3c38; } svg .l.s2 { fill: #77766f; }
svg .lt { font-size: 12.5px; font-weight: 700; fill: #1f1f1d; }
.ft { font-weight: 700; font-size: 11pt; } .ft span { display: block; font-weight: 400; font-size: 9pt; color: #77766f; }
.fc { color: #77766f; font-size: 9.5pt; margin-top: 2px; }
"""


def main():
    md = SRC.read_text(encoding="utf-8")
    title = md.split("\n", 1)[0].lstrip("# ").strip()
    page = f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>{html.escape(title)}</title><style>{CSS}</style></head><body>{convert(md)}</body></html>'
    OUT.write_text(page, encoding="utf-8")
    print("ok", OUT.relative_to(ROOT))


if __name__ == "__main__":
    main()
