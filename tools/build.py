"""Assemble le prototype jouable en une seule page HTML (moteur + interface + pictos) dans dist/."""
import json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from icons import ICONS  # noqa: E402

icons_js = "const ICONS = " + json.dumps({k: v[1] for k, v in ICONS.items()}, ensure_ascii=False) + ";"
engine = (ROOT / "src/engine.js").read_text(encoding="utf-8")
ui = (ROOT / "src/ui.js").read_text(encoding="utf-8")
css = (ROOT / "src/style.css").read_text(encoding="utf-8")

page = f"""<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Swarm &amp; Steel</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600&display=swap">
<style>{css}</style></head><body>
<div id="app"></div>
<div id="flash" role="status" hidden></div>
<script>{icons_js}
{engine}
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
