"""Assemble le prototype jouable en une seule page HTML (moteur + interface + pictos) dans dist/."""
import json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from icons import ICONS  # noqa: E402

icons_js = "const ICONS = " + json.dumps({k: v[1] for k, v in ICONS.items()}, ensure_ascii=False) + ";"
engine = (ROOT / "src/engine.js").read_text(encoding="utf-8")
bilan = (ROOT / "src/bilan.js").read_text(encoding="utf-8")
aide = (ROOT / "src/aide.js").read_text(encoding="utf-8")
ui = (ROOT / "src/ui.js").read_text(encoding="utf-8")
css = (ROOT / "src/style.css").read_text(encoding="utf-8")
# illustrations (miniatures de tools/miniatures.py) : une classe CSS par nom du jeu (.im-ecorcheur…), table IMG_CLASS côté JS
import base64
mini = ROOT / "assets/miniatures"
table = json.loads((mini / "table.json").read_text(encoding="utf-8")) if (mini / "table.json").exists() else {}
img_css = "".join(
    f".im-{f[:-5]}{{--img:url(data:image/webp;base64,{base64.b64encode((mini / f).read_bytes()).decode()})}}\n" for f in sorted(set(table.values())))
# logos des camps (tools/logos.js) : masques CSS --logo-colonie / --logo-essaim (la couleur vient du camp)
logos = ROOT / "assets/logos"
img_css += ":root{" + "".join(f"--logo-{k}:url(data:image/png;base64,{base64.b64encode((logos / (k + '.png')).read_bytes()).decode()});" for k in ("colonie", "essaim", "jeu", "titre") if (logos / (k + ".png")).exists()) + "}\n"
img_js = "const IMG_CLASS = " + json.dumps({n: "im im-" + f[:-5] for n, f in table.items()}, ensure_ascii=False) + ";"

page = f"""<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Swarm &amp; Steel</title>
<script>(function(){{var r=document.documentElement;try{{var t=localStorage.getItem("swarm-steel-theme");r.dataset.theme=(t==="light"||t==="auto")?t:"dark";if(window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches)r.classList.add("sys-dark")}}catch(e){{r.dataset.theme="dark"}}}})();</script>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600&display=swap">
<style>{css}
{img_css}</style></head><body>
<div id="app"></div>
<div id="flash" role="status" hidden></div>
<script>{icons_js}
{img_js}
{engine}
{bilan}
{aide}
{ui}</script>
</body></html>
"""
out = ROOT / "dist/swarm-steel-jeu.html"
out.parent.mkdir(exist_ok=True)
out.write_text(page, encoding="utf-8")
print("ok", out.relative_to(ROOT), len(page) // 1024, "Ko")

# « --site » : dossier de publication Netlify, recréé à neuf à chaque build (page servie à la racine)
if "--site" in sys.argv:
    import shutil
    site = ROOT / "site"
    shutil.rmtree(site, ignore_errors=True)
    site.mkdir()
    (site / "index.html").write_text(page, encoding="utf-8")
    print("ok", (site / "index.html").relative_to(ROOT))
