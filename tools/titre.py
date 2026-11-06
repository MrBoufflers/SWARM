"""Titre du jeu « SWARM & STEEL » et noms des camps en image (accueil, salle d'attente ; Oni 06/11/2026) : assets/logos/titre*.png (blanc sur fond transparent,
utilisé comme masque CSS ; la matière — acier, braise — est appliquée par la feuille de style).

La police Ethnocentric (Typodermic) est sous licence « Desktop » : elle permet de livrer du texte rendu en image fixe,
mais pas d'intégrer le fichier de police au site. Le fichier .otf n'est donc PAS dans le dépôt ; pour régénérer le titre :
    python3 tools/titre.py chemin/vers/Ethnocentric-Regular.otf
"""
import pathlib, sys
from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "assets/logos"
# fichier → texte : titre du jeu (accueil) et noms des camps (salle d'attente en ligne)
TEXTES = {"titre": "SWARM & STEEL", "titre-colonie": "COLONIE", "titre-essaim": "ESSAIM"}
TAILLE, MARGE = 220, 24

def main(police):
    f = ImageFont.truetype(police, TAILLE)
    OUT.mkdir(parents=True, exist_ok=True)
    for nom, texte in TEXTES.items():
        x0, y0, x1, y1 = f.getbbox(texte)
        im = Image.new("LA", (x1 - x0 + 2 * MARGE, y1 - y0 + 2 * MARGE), (255, 0))
        ImageDraw.Draw(im).text((MARGE - x0, MARGE - y0), texte, font=f, fill=(255, 255))
        dest = OUT / (nom + ".png"); im.save(dest, optimize=True)
        print("ok", dest.relative_to(ROOT), im.size, dest.stat().st_size, "octets")

if __name__ == "__main__":
    if len(sys.argv) != 2: sys.exit(__doc__)
    main(sys.argv[1])
