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
    "Œil-sonde": "oeil sonde.jpg", "Glaneur": "glaneur.jpg", "Hurleur": "hurleur.jpg",
    "Phéromone": "phéromone.jpg", "Perforeur": "perforeur.jpg", "Catalyseur": "catalyseur.jpg",
    "Sapeur": "sapeur.jpg", "Sporeur": "sporeur.jpg",
    "Palissade": "palissade.jpg", "Barbelé": "barbelé.jpg", "Antenne": "antenne.jpg", "Bastion": "bastion.jpg", "Haie d'épines": "haie d'épines.jpg",
    "Laboratoire": "laboratoire.jpg", "Mur hérissé": "mur hérissé.jpg", "Muraille": "muraille.jpg",
    "Observatoire": "observatroire.jpg", "Rempart": "rempart.jpg", "Archives": "archive.jpg",
    "Baraquement": "baraquement.jpg", "Dortoir": "dortoir.jpg", "Égide": "egide.jpg", "Ligne de front": "ligne de front.jpg",
    "Réduit": "réduit.jpg", "Piège": "piege.jpg", "Siphon": "siphon.jpg", "Mine mineure": "piege.jpg", "Mine majeure": "piege.jpg", "Mine supérieure": "piege.jpg", "Siphon mineur": "siphon.jpg", "Siphon majeur": "siphon.jpg", "Siphon supérieur": "siphon.jpg", "Ronceraie": "ronceraie.jpg",
    "Avant-poste du Nord": "avant poste.jpg", "Avant-poste de l'Est": "avant poste.jpg",
    "Avant-poste du Sud": "avant poste.jpg", "Avant-poste de l'Ouest": "avant poste.jpg",
    "support 1": "support 1.jpg", "support 2": "support 2.jpg", "support 3": "support niveau 3.jpg",
    "Fusée": "fusée.jpg", "Champ de bataille": "champs de bataille.jpg",
    "Passage colonie": "pop up tour colonie.webp", "Passage essaim": "pop up tour essaim.webp",
}
# taille particulière : le champ de bataille sert de fond à tout le plateau
TAILLES = {"champs de bataille.jpg": (840, 55),
           # cadres de l'écran de passage (fond transparent conservé)
           "pop up tour colonie.webp": (900, 78), "pop up tour essaim.webp": (900, 78)}

# vignettes recadrées sur le visage des créatures (cartes d'amélioration, Oni 06/11/2026) :
# nom → (centre x, centre y, côté du carré), en fraction de la largeur de l'illustration
VISAGES = {
    "Ravageur": (.59, .30, .34), "Massacreur": (.60, .27, .34), "Béhémoth": (.60, .52, .36), "Colosse": (.67, .52, .36),
    "Phéromone": (.63, .41, .34), "Perforeur": (.52, .44, .34), "Catalyseur": (.67, .42, .30), "Sapeur": (.74, .50, .30), "Sporeur": (.63, .60, .34),
}
TAILLE_VISAGE = 180

def slug(n):
    n = unicodedata.normalize("NFKD", n.replace("Œ", "Oe")).encode("ascii", "ignore").decode().lower()
    return "".join(c if c.isalnum() else "-" for c in n).strip("-")

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.webp"): old.unlink()
    table, faits, total = {}, {}, 0
    for nom, fichier in NOMS.items():
        src = unicodedata.normalize("NFC", fichier)
        if src not in faits:  # une image partagée (Avant-postes) n'est réduite et intégrée qu'une fois
            path = next((p for p in SRC.iterdir() if unicodedata.normalize("NFC", p.name) == src), None)
            if not path: print("absent :", fichier); continue
            taille, qualite = TAILLES.get(src, (TAILLE, QUALITE))
            im = Image.open(path); im = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB"); im.thumbnail((taille, taille), Image.LANCZOS)
            dest = OUT / (slug(src.rsplit(".", 1)[0]) + ".webp"); im.save(dest, "WEBP", quality=qualite, method=6)
            faits[src] = dest.name; total += dest.stat().st_size
        table[nom] = faits[src]
    for nom, (cx, cy, cote) in VISAGES.items():
        src = unicodedata.normalize("NFC", NOMS[nom])
        path = next(p for p in SRC.iterdir() if unicodedata.normalize("NFC", p.name) == src)
        im = Image.open(path).convert("RGB"); w, h = im.size; c = cote * w
        box = [round(cx * w - c / 2), round(cy * h - c / 2)]; box = [max(0, min(box[0], w - c)), max(0, min(box[1], h - c))]
        im = im.crop((box[0], box[1], box[0] + c, box[1] + c)).resize((TAILLE_VISAGE, TAILLE_VISAGE), Image.LANCZOS)
        dest = OUT / ("visage-" + slug(nom) + ".webp"); im.save(dest, "WEBP", quality=QUALITE, method=6)
        table["Visage " + nom] = dest.name; total += dest.stat().st_size
    (OUT / "table.json").write_text(json.dumps(table, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(faits)} miniatures pour {len(table)} noms, {total // 1024} Ko au total")

if __name__ == "__main__":
    main()
