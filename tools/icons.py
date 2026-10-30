# Pictos de Swarm & Steel — viewBox 0 0 24 24, trait = currentColor.
# Chaque entrée : (libellé du lexique, contenu SVG)

ICONS = {
    # --- statistiques et ressources ---
    "atq": ("Attaque (ATQ)",
            '<path d="M4 15C7 11 9 8 12 4M7 19C10 14 13 10 17 5M11 21C14 16 17 12 21 8"/>'),
    "pv": ("Points de vie (PV)",
           '<path d="M12 20C4.5 14.5 2.5 10 5.5 6.2C7.9 3.6 10.8 4.6 12 7.2C13.2 4.6 16.1 3.6 18.5 6.2C21.5 10 19.5 14.5 12 20Z" fill="currentColor" stroke="none"/>'),
    "biomasse": ("Biomasse (coût, budget)",
                 '<path d="M12 3C15.5 7 19 10 19 14.2A7 7 0 0 1 5 14.2C5 10 8.5 7 12 3Z"/><circle cx="10" cy="14" r="1.3" fill="currentColor" stroke="none"/><circle cx="14" cy="16.5" r="1" fill="currentColor" stroke="none"/>'),
    "duree": ("Durée de construction",
              '<path d="M6 3H18M6 21H18M7.5 3C7.5 9 12 10 12 12C12 14 7.5 15 7.5 21M16.5 3C16.5 9 12 10 12 12C12 14 16.5 15 16.5 21"/>'),
    "travailleur": ("Travailleur",
                    '<circle cx="12" cy="8.5" r="3.8"/><path d="M7.5 7.2H16.5M4.5 21C4.5 16.5 7.8 13.8 12 13.8C16.2 13.8 19.5 16.5 19.5 21"/>'),
    "tech": ("Technologie",
             '<circle cx="12" cy="9" r="2"/><path d="M12 11V21M8.5 21H15.5M8.6 5.6A4.8 4.8 0 0 0 8.6 12.4M15.4 5.6A4.8 4.8 0 0 1 15.4 12.4M5.6 3A8.6 8.6 0 0 0 5.6 15M18.4 3A8.6 8.6 0 0 1 18.4 15"/>'),
    "fusee": ("Fusée (étage)",
              '<path d="M12 2C15.8 5 16.8 10 15.8 15H8.2C7.2 10 8.2 5 12 2Z"/><circle cx="12" cy="9" r="1.8"/><path d="M8.2 15L5 19.5L8.6 18.4M15.8 15L19 19.5L15.4 18.4M10.6 18L12 22L13.4 18"/>'),
    "chantier": ("Chantier",
                 '<path d="M5 21V4H19M5 4L10.5 9.5M19 4V8M17 8H21V11H17ZM3 21H9"/>'),
    "mur": ("Forteresse (mur)",
            '<path d="M3 5H21V19H3ZM3 9.7H21M3 14.3H21M9 5V9.7M15 5V9.7M6 9.7V14.3M12 9.7V14.3M18 9.7V14.3M9 14.3V19M15 14.3V19"/>'),
    "tourelle": ("Tourelle (dégâts en fin de tour de la colonie)",
                 '<circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><path d="M12 2.5V6.5M12 17.5V21.5M2.5 12H6.5M17.5 12H21.5"/>'),
    # --- capacités des forteresses ---
    "epines": ("Épines X : X dégâts à la créature qui attaque la tuile",
               '<path d="M2 20H22M3 20L6 11L9 20M9 20L12 4.5L15 20M15 20L18 11L21 20"/>'),
    "renforce": ("Renforcé X : 1 PV perdu par tranche de X dégâts",
                 '<path d="M12 3L20 6V11.5C20 16.2 16.6 19.6 12 21C7.4 19.6 4 16.2 4 11.5V6Z"/>'),
    "temp": ("Travailleur temporaire (tant que la tuile tient)",
             '<circle cx="9" cy="8.5" r="3.4"/><path d="M2.5 21C2.5 16.8 5.4 14 9 14C10.6 14 12 14.5 13.2 15.4M15 13H21M15 21H21M16 13C16 16 18 16.5 18 17C18 17.5 16 18 16 21M20 13C20 16 18 16.5 18 17C18 17.5 20 18 20 21"/>'),
    "perm": ("Travailleur permanent (conservé si la tuile tombe)",
             '<circle cx="9" cy="8.5" r="3.4"/><path d="M2.5 21C2.5 16.8 5.4 14 9 14C10.6 14 12 14.5 13.2 15.4"/><path d="M18 11.5L19.3 14.6L22.6 14.8L20 17L20.9 20.2L18 18.4L15.1 20.2L16 17L13.4 14.8L16.7 14.6Z" fill="currentColor" stroke="none"/>'),
    "cardinal": ("Bonus selon le point cardinal",
                 '<circle cx="12" cy="12" r="9"/><path d="M12 4.5L14.2 12L12 19.5L9.8 12Z" fill="currentColor" stroke="none"/>'),
    "couronne": ("Couronne (anneau autour de la fusée)",
                 '<rect x="3" y="3" width="18" height="18"/><rect x="8" y="8" width="8" height="8"/>'),
    "piege": ("Piège camouflé",
              '<path d="M3 14H21M4 14L6 8.5L8 14L10 8.5L12 14L14 8.5L16 14L18 8.5L20 14M3 14C3 19 21 19 21 14"/>'),
    # --- capacités des créatures ---
    "aura": ("Aura : touche les autres créatures de la même case",
             '<circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none"/><path d="M7.2 7.2A6.8 6.8 0 0 0 7.2 16.8M16.8 7.2A6.8 6.8 0 0 1 16.8 16.8M4.2 4.2A11 11 0 0 0 4.2 19.8M19.8 4.2A11 11 0 0 1 19.8 19.8"/>'),
    "soin": ("Soin",
             '<path d="M9 3H15V9H21V15H15V21H9V15H3V9H9Z"/>'),
    "fureur": ("Fureur (+ATQ)",
               '<path d="M12 21C7.4 21 5.4 17.6 6.2 14.2C7 11.2 9.6 10.1 9 5.8C12 7.8 13.2 10 13 12.4C14.2 11.4 15 9.8 15 8.2C18 11 19.2 14 18.2 16.8C17.2 19.6 15 21 12 21Z"/>'),
    "vision": ("Vision : révèle les tuiles camouflées",
               '<path d="M2 12C5 6.5 8.5 5 12 5C15.5 5 19 6.5 22 12C19 17.5 15.5 19 12 19C8.5 19 5 17.5 2 12Z"/><circle cx="12" cy="12" r="3"/>'),
    "furtivite": ("Furtivité : ne peut pas être visée",
                  '<path d="M2 12C5 6.5 8.5 5 12 5C15.5 5 19 6.5 22 12C19 17.5 15.5 19 12 19C8.5 19 5 17.5 2 12Z"/><path d="M4 3L20 21"/>'),
    "leurre": ("Leurre / provocation : force la cible",
               '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>'),
    "percee": ("Percée : les dégâts en trop continuent",
               '<path d="M9.5 3.5H14.5V20.5H9.5ZM9.5 9H14.5M9.5 15H14.5M2 12H21M17.5 8.5L21 12L17.5 15.5"/>'),
    "instinct": ("Instinct : donne une capacité supplémentaire",
                 '<path d="M12 2L13.9 10.1L22 12L13.9 13.9L12 22L10.1 13.9L2 12L10.1 10.1Z"/>'),
    "spores": ("Spores : dégâts de zone",
               '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="4" r="1.6"/><circle cx="12" cy="20" r="1.6"/><circle cx="4" cy="12" r="1.6"/><circle cx="20" cy="12" r="1.6"/><circle cx="6.3" cy="6.3" r="1.2"/><circle cx="17.7" cy="17.7" r="1.2"/><circle cx="17.7" cy="6.3" r="1.2"/><circle cx="6.3" cy="17.7" r="1.2"/>'),
    "sabotage": ("Sabotage : détruit un chantier",
                 '<circle cx="10" cy="14.5" r="6.5"/><path d="M14.6 9.9L17.5 7M17.5 7L19 8.5M19.5 3V4.8M22 5.5H20.2M21.3 3.7L20.1 4.9"/>'),
    "mobilite": ("Mobilité : choisit sa cible / change de lane",
                 '<path d="M12 21V12M12 12L6 5M12 12L18 5M6 5V9M6 5H10M18 5V9M18 5H14"/>'),
    "deploiement": ("Déploiement gratuit",
                    '<path d="M6 4L12 10L18 4M6 12L12 18L18 12M5 21H19"/>'),
    "reincarnation": ("Réincarnation",
                      '<path d="M19.5 12A7.5 7.5 0 1 1 16.8 6.2M17.5 2.5V6.8H13.2"/><path d="M12 15.5C9.2 13.5 8.5 12 9.6 10.6C10.4 9.7 11.5 10 12 11C12.5 10 13.6 9.7 14.4 10.6C15.5 12 14.8 13.5 12 15.5Z" fill="currentColor" stroke="none"/>'),
    "protection": ("Protection : le tank attire les tirs",
                   '<path d="M12 3L20 6V11.5C20 16.2 16.6 19.6 12 21C7.4 19.6 4 16.2 4 11.5V6Z"/><circle cx="12" cy="10" r="2.2"/><path d="M8.5 16.5C9 14.5 10.3 13.5 12 13.5C13.7 13.5 15 14.5 15.5 16.5"/>'),
    "clairvoyance": ("Clairvoyance : toutes les tuiles camouflées visibles",
                     '<path d="M4 12C6.2 8.2 8.8 7 12 7C15.2 7 17.8 8.2 20 12C17.8 15.8 15.2 17 12 17C8.8 17 6.2 15.8 4 12Z"/><circle cx="12" cy="12" r="2.2"/><path d="M12 1.5V4M12 20V22.5M3.5 3.5L5.3 5.3M18.7 18.7L20.5 20.5M20.5 3.5L18.7 5.3M5.3 18.7L3.5 20.5"/>'),
    "frenesie": ("Frénésie : dégâts doublés",
                 '<path d="M3 13C5 10 6.5 7.5 8.5 4.5M6 17C8 13.5 10 10.5 12.5 7M15 11L21 17M21 11L15 17"/>'),
    # --- sortilèges ---
    "frappe": ("Frappe : dégâts à une créature",
               '<path d="M13.5 2L5 13.5H11L9.5 22L19 9.5H13Z"/>'),
    "salve": ("Salve : plusieurs cibles",
              '<path d="M8 2L3.5 9H7L6 15L11 7.5H7.5ZM17 6L12.5 13H16L15 19L20 11.5H16.5Z"/>'),
    "lane": ("Lane entière",
             '<path d="M8 3H16L20.5 21H3.5Z"/><path d="M12 7V17M9.5 14.5L12 17L14.5 14.5"/>'),
    "stase": ("Stase : protège une zone",
              '<path d="M12 2V22M3.3 7L20.7 17M3.3 17L20.7 7M9.5 3.5L12 6L14.5 3.5M9.5 20.5L12 18L14.5 20.5"/>'),
    "famine": ("Famine : budget de biomasse réduit",
               '<path d="M12 3C15.5 7 19 10 19 14.2A7 7 0 0 1 5 14.2C5 10 8.5 7 12 3Z"/><path d="M8.5 14.5H15.5"/>'),
    "brouillage": ("Brouillage : annule un déploiement",
                   '<rect x="6" y="3" width="12" height="18"/><path d="M8.5 7.5L15.5 16.5M15.5 7.5L8.5 16.5"/>'),
    "effort": ("Effort : points de construction en plus",
               '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7.2" stroke-width="3.2" stroke-dasharray="2.6 2.1"/>'),
    "cadence": ("Cadence : chaque travailleur compte double",
                '<circle cx="8.5" cy="9.5" r="2"/><circle cx="8.5" cy="9.5" r="5" stroke-width="2.6" stroke-dasharray="2 1.8"/><circle cx="17" cy="16.5" r="1.6"/><circle cx="17" cy="16.5" r="4" stroke-width="2.4" stroke-dasharray="1.8 1.6"/>'),
    "reparation": ("Réparation : rend des PV",
                   '<path d="M13 3L21 11L18 14L10 6ZM11.5 9.5L3 18L6 21L14.5 12.5"/>'),
    "renouvellement": ("Renouvellement : défausser et repiocher",
                       '<path d="M20 12A8 8 0 1 1 17.7 6.3M18.5 2.5V6.8H14.2"/>'),
    "reconversion": ("Reconversion : échange main ↔ plateau",
                     '<path d="M4 8H19M15.5 4.5L19 8L15.5 11.5M20 16H5M8.5 12.5L5 16L8.5 19.5"/>'),
    "nuke": ("Nuke : détruit toutes les créatures",
             '<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/><path d="M12 12L12 4A8 8 0 0 1 18.9 8Z" fill="currentColor" stroke="none"/><path d="M12 12L18.9 16A8 8 0 0 1 5.1 16Z" fill="currentColor" stroke="none" opacity="0"/><path d="M12 12L5.1 8A8 8 0 0 1 12 4Z" fill="none" stroke="none"/>'),
    # --- types d'essaim (illustrations) ---
    "aggro": ("Type aggro",
              '<path d="M4 15C7 11 9 8 12 4M7 19C10 14 13 10 17 5M11 21C14 16 17 12 21 8"/>'),
    "tank": ("Type tank",
             '<path d="M3 15C3 9.5 7 5.5 12 5.5C17 5.5 21 9.5 21 15ZM3 15H21M8 15C8 11 9.8 8 12 8C14.2 8 16 11 16 15M12 5.5V15M2 18.5H22"/>'),
    "soutien": ("Type soutien",
                '<circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none"/><path d="M7.2 7.2A6.8 6.8 0 0 0 7.2 16.8M16.8 7.2A6.8 6.8 0 0 1 16.8 16.8M4.2 4.2A11 11 0 0 0 4.2 19.8M19.8 4.2A11 11 0 0 1 19.8 19.8"/>'),
    "sort": ("Sortilège",
             '<path d="M12 2L13.6 8.4L20 10L13.6 11.6L12 18L10.4 11.6L4 10L10.4 8.4Z"/><path d="M18.5 15.5L19.2 18.3L22 19L19.2 19.7L18.5 22.5L17.8 19.7L15 19L17.8 18.3Z" fill="currentColor" stroke="none"/>'),
    "palier": ("Palier",
               '<path d="M3 20H8V15H13V10H18V5H21"/>'),
}

# La nuke a besoin de trois pales : on la redéfinit proprement par rotation.
ICONS["nuke"] = (
    ICONS["nuke"][0],
    '<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/>'
    + "".join(
        f'<path transform="rotate({a} 12 12)" d="M12 9.2L9.6 4.6A8 8 0 0 1 14.4 4.6Z" fill="currentColor" stroke="none"/>'
        for a in (0, 120, 240)
    ),
)


def sprite():
    out = ['<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>']
    for k, (_, body) in ICONS.items():
        out.append(f'<symbol id="i-{k}" viewBox="0 0 24 24">{body}</symbol>')
    out.append("</defs></svg>")
    return "".join(out)


def ic(name, cls="i"):
    # picto intégré directement (plus fiable à l'impression qu'une référence <use>)
    return (f'<svg class="{cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONS[name][1]}</svg>')
