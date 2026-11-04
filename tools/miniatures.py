"""Miniatures des illustrations (dossier images/, 2048 px) pour la page du jeu : assets/miniatures/*.webp (200 px).
Usage : python3 tools/miniatures.py   (à relancer quand une image est ajoutée ou changée dans images/)
La table NOMS relie chaque nom du jeu à son fichier ; build.py intègre les miniatures dans la page."""
import json, pathlib, unicodedata
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / "images", ROOT / "assets/miniatures"
TAILLE, QUALITE = 200, 68

# nom dans le jeu → fichier dans images/ (les noms de fichiers d'Oni gardent leurs fautes éventuelles)
NOMS = {
    "Écorcheur": "écorcheur.jpg", "Ravageur": "ravageur.jpg", "Massacreur": "massacreur.jpg",
    "Carapace": "carapace.jpg", "Béhémoth": "béhémoth.jpg", "Colosse": "colosse.jpg",
    "Œil-sonde": "oeil sonde.jpg", "Glaneur": "glaneur.jpg", "Hurleur": "hurleur.jpg", "Phéromone": "phéromone.jpg",
    "Barbelé": "barbelé.jpg", "Antenne": "antenne.jpg", "Bastion": "bastion.jpg", "Haie d'épines": "haie d'épines.jpg",
    "Laboratoire": "laboratoire.jpg", "Mur hérissé": "mur hérissé.jpg", "Muraille": "muraille.jpg",
    "Observatoire": "observatroire.jpg", "Rempart": "rempart.jpg",
    "support 1": "support 1.jpg", "support 2": "support 2.jpg", "support 3": "support niveau 3.jpg",
}

def slug(n):
    n = unicodedata.normalize("NFKD", n.replace("Œ", "Oe")).encode("ascii", "ignore").decode().lower()
    return "".join(c if c.isalnum() else "-" for c in n).strip("-")

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    table, total = {}, 0
    for nom, fichier in NOMS.items():
        src = unicodedata.normalize("NFC", fichier)
        path = next((p for p in SRC.iterdir() if unicodedata.normalize("NFC", p.name) == src), None)
        if not path: print("absent :", fichier); continue
        im = Image.open(path).convert("RGB"); im.thumbnail((TAILLE, TAILLE), Image.LANCZOS)
        dest = OUT / (slug(nom) + ".webp"); im.save(dest, "WEBP", quality=QUALITE, method=6)
        table[nom] = dest.name; total += dest.stat().st_size
    (OUT / "table.json").write_text(json.dumps(table, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(table)} miniatures, {total // 1024} Ko au total")

if __name__ == "__main__":
    main()
