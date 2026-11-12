// Tests ciblés des règles du livret v0.3 (scénarios précis, pas de simulation de parties)
const SF = require("../src/engine.js");
let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log("ÉCHEC :", msg); } else console.log("ok   :", msg); };
// Les scénarios ciblés partent de l'ancienne mise en place (haies de la couronne 1 seulement, supports de niveau 1) ;
// la mise en place actuelle (couronne 2 garnie, Oni 01/11/2026) a son propre test (37) via SF.newGame().
// anciens scénarios : Palissade, Égide et Archives gardent leurs valeurs d'avant le 09/11/2026 (sans Bouclier) pour tester
// la percée, les spores, la biomasse… ; leurs nouvelles valeurs ont leurs propres tests (n° 74)
const TILESTATS = SF.tileStats, LEGACY = { "Palissade": { hp: 2, max: 2 }, "Égide": { ren: 2 }, "Archives": { hp: 3, max: 3 } };
SF.tileStats = (n, x, y) => { const t = TILESTATS(n, x, y); if (LEGACY[n]) { Object.assign(t, LEGACY[n]); delete t.shield; } return t; };
const fresh = () => {
  const S = SF.newGame(); S.log = [];
  for (const k of Object.keys(S.tiles)) if (S.tiles[k].start && SF.ring(...SF.parse(k)) === 2) delete S.tiles[k];
  for (const k of Object.keys(S.supports)) if (S.supports[k] === 2) delete S.supports[k];
  delete S.startHand; // pioche normale dès le premier tour (la main de départ a son propre test, n° 56)
  // main de 4 tuiles de la colonie (avant le 07/11/2026, piochée à la mise en place ; désormais au début de son tour)
  while (S.hand.length < 4) S.hand.push(S.tileDecks.renfort.pop());
  return S;
};

// 1. chemin sans diagonale : A3 → B3 → B2 → C2 → C1 → fusée (lane Nord, colonne A = u -2)
{
  const steps = []; let u = -2, k = 4;
  while (k !== 0) { [u, k] = SF.nextStep(u, k); steps.push(k === 0 ? "F" : "ABCDE"[u + 2] + k); }
  ok(steps.join(" ") === "A3 B3 B2 C2 C1 F", "chemin colonne A : " + steps.join(" "));
  steps.length = 0; u = 1; k = 4;
  while (k !== 0) { [u, k] = SF.nextStep(u, k); steps.push(k === 0 ? "F" : "ABCDE"[u + 2] + k); }
  ok(steps.join(" ") === "D3 D2 C2 C1 F", "chemin colonne D : " + steps.join(" "));
}
// 2. une créature traverse les cases vides et frappe la haie d'épines de départ (1 PV) ; Épines 1 en retour
{
  const S = fresh(); SF.attackerDraw(S);
  S.creatures.push({ id: 900, name: "Écorcheur", lane: "N", u: -2, k: 4, hp: 1, new: true, acted: false });
  SF.act(S, S.creatures[0]);
  ok(!S.tiles["0,1"], "Écorcheur (3 ATQ) détruit la haie de départ Nord (1 PV)");
  ok(S.biomass === 4 + 0 || S.biomass >= 4, "biomasse +1 après destruction (biomasse " + S.biomass + ")");
  ok(S.creatures.length === 0, "l'Écorcheur (1 PV) meurt sur Épines 1");
}
// 3. Renforcé 2 : 3 dégâts → 1 PV perdu
{
  const S = fresh(); SF.attackerDraw(S);
  S.tiles["0,1"] = SF.tileStats("Rempart", 0, 1);
  S.creatures.push({ id: 901, name: "Écorcheur", lane: "N", u: 0, k: 4, hp: 1, new: true, acted: false });
  SF.act(S, S.creatures[0]);
  ok(S.tiles["0,1"].hp === 3, "Rempart (Renforcé 2) frappé pour 3 : 4 → 3 PV");
}
// 4. piège : révélé à la première attaque, 2 dégâts à la créature
{
  const S = fresh(); SF.attackerDraw(S);
  S.tiles["0,1"] = SF.tileStats("Mine supérieure", 0, 1);
  S.creatures.push({ id: 902, name: "Carapace", lane: "N", u: 0, k: 4, hp: 3, new: true, acted: false });
  SF.act(S, S.creatures[0]);
  const c = S.creatures[0];
  ok(S.tiles["0,1"].revealed && S.tiles["0,1"].hp === 3, "Mine supérieure révélée ; la Carapace meurt avant de frapper : la mine garde ses 3 PV");
  ok(!c, "Carapace (3 PV) : 3 dégâts du piège, détruite");
}
// 5. un support tombe quand tous les murs qui le touchent ont disparu
{
  const S = fresh(); SF.attackerDraw(S);
  delete S.tiles["0,1"]; const b0 = S.biomass;
  S.tiles["1,0"].hp = 1;
  S.creatures.push({ id: 903, name: "Ravageur", lane: "E", u: 0, k: 4, hp: 9, new: true, acted: false });
  SF.act(S, S.creatures[0]);
  ok(!S.supports["1,1"], "support NE tombé (murs Nord et Est détruits)");
  ok(S.biomass === b0 + 2, "biomasse +1 (mur) +1 (support)");
}
// 6. fusée : 2 points par étage (étages 1-3), +1 travailleur, palier 3 = +2 technologies
{
  const S = fresh(); SF.attackerDraw(S); SF.endDeploy(S); SF.startAttacks(S); SF.endAttackerTurn(S);
  S.workersBase = 6; S.turnPts = 6; S.extraPts = 0; // points du tour fixés au début du tour (v0.5.8)
  SF.endDefenderTurn(S);
  ok(S.floors === 3 && S.workersBase === 9 && SF.tech(S) >= 2, "6 points → 3 étages, +3 travailleurs, +2 technologies");
}
// 7. chantier : case valide seulement si elle touche une tuile, un support ou la fusée
{
  const S = fresh();
  ok(SF.canTarget(S, "N", "0,2"), "N2 centrale valide (touche le mur de départ)");
  ok(SF.canTarget(S, "N", "-1,2"), "case B2 valide (touche le support NO)");
  ok(!SF.canTarget(S, "N", "0,3"), "couronne 3 isolée refusée");
}
// 8. paliers de biomasse
{
  const S = fresh();
  const t = b => { S.biomass = b; return SF.tier(S) + 1; };
  ok([3, 9, 15, 21, 30].map(t).join() === "1,2,3,4,4" && [8, 14, 20].map(t).join() === "1,2,3", "paliers : départ, puis 9 / 15 / 21 (4 paliers, Oni 02/11/2026)");
  ok(SF.TIERS.map(r => r.n.join("")).join() === "300,320,421,433", "pioches 3·0·0 / 3·2·0 / 4·2·1 / 4·3·3");
}
// 9. Protection : un tir sur une créature non tank de la case d'un tank vise le tank
{
  const S = fresh(); S.upgrades.tank.r1 = "B";
  const a = { id: 1, name: "Écorcheur", lane: "N", u: 0, k: 4, hp: 1 }, b = { id: 2, name: "Carapace", lane: "N", u: 0, k: 4, hp: 3 };
  S.creatures.push(a, b);
  ok(SF.resolveTarget(S, a) === b, "Protection redirige le tir vers la Carapace");
}
// 10. aura Fureur : +1 ATQ aux autres créatures de la case, pas à elle-même
{
  const S = fresh();
  const h = { id: 1, name: "Hurleur", lane: "N", u: 0, k: 4, hp: 1 }, e = { id: 2, name: "Écorcheur", lane: "N", u: 0, k: 4, hp: 1 };
  const far = { id: 3, name: "Écorcheur", lane: "N", u: 1, k: 4, hp: 1 };
  S.creatures.push(h, e, far);
  ok(SF.effAtq(S, e) === 5 && SF.effAtq(S, h) === 0 && SF.effAtq(S, far) === 3, "Fureur (+2 ATQ, 11/11/2026) : même case seulement ; le Hurleur lui-même a 0 ATQ");
}
// 11. améliorations payées en plusieurs fois
{
  const S = fresh(); SF.attackerDraw(S);
  S.budget = 3; S.reserve = 2;
  ok(SF.invest(S, "aggro", "A1", 2) && S.budget === 3 && S.reserve === 0, "déploiement : l'investissement prend d'abord la réserve (Oni, 09/11/2026)");
  ok(SF.nodeState(S, "aggro", "B1") === "closed", "commencer à investir dans A1 ferme B1");
  ok(!SF.invest(S, "aggro", "B1", 1), "investir dans B1 refusé");
  ok(SF.invest(S, "aggro", "A1", 99) && SF.invested(S, "aggro", "A1") === 5 && S.budget === 0 && S.reserve === 0, "Tout investir : réserve puis budget (5 / 6)");
  ok(SF.nodeState(S, "aggro", "A2") === "needR1" && !SF.invest(S, "aggro", "A2", 1), "rang 2 bloqué tant que le rang 1 n'est pas acquis");
  SF.endDeploy(S); S.reserve = 4;
  const n2 = S.piles[2].length;
  ok(SF.invest(S, "aggro", "A1", 99) && S.upgrades.aggro.r1 === "A" && S.reserve === 3, "étape Améliorations : 1 point de plus → Férocité acquise (6), 3 restent en réserve");
  ok(S.piles[2].length > n2, "les cartes aggro de niveau 2 entrent dans la pioche");
  ok(SF.nodeState(S, "aggro", "C2") === "open" && SF.nodeState(S, "aggro", "A2") === "open" && SF.nodeState(S, "aggro", "B2") === "closed", "rang 2 : suite de A et centre ouverts, suite de B fermée");
  S.phase = "A_attack"; S.reserve = 20;
  ok(!SF.invest(S, "aggro", "C2", 1), "pas d'investissement pendant les attaques");
}
// 12. construire sur une case occupée : les créatures reculent d'une case vers le fond
{
  const S = fresh();
  ok(SF.canTarget(S, "N", "0,2") , "chantier possible sur C2");
  const a = { id: 1, name: "Écorcheur", lane: "N", u: 0, k: 2, hp: 1 }, b = { id: 2, name: "Carapace", lane: "N", u: 0, k: 2, hp: 3 };
  S.creatures.push(a, b);
  ok(SF.canTarget(S, "N", "0,2"), "chantier toujours possible avec 2 créatures sur C2");
  SF.pushBack(S, "0,2");
  ok(a.k === 3 && b.k === 3 && a.u === 0, "les 2 créatures reculent en C3");
  S.tiles["0,3"] = SF.tileStats("Muraille", 0, 3);
  a.k = b.k = 2; SF.pushBack(S, "0,2");
  ok(a.k === 4 && b.k === 4, "C3 bâtie : elles reculent jusqu'à la case d'entrée");
}
// 13. les soutiens n'attaquent pas (0 ATQ) et ont +1 / +3 / +5 PV
{
  const S = fresh(); SF.attackerDraw(S);
  ok(["Œil-sonde","Glaneur","Catalyseur"].every(n => SF.CREATURES[n].pv === 2 && SF.CREATURES[n].atq === 0 && SF.CREATURES[n].lvl === 1), "soutiens N1 (Catalyseur depuis la v0.5) : 0 ATQ / 2 PV");
  ok(["Charognard","Perforeur","Hurleur"].every(n => SF.CREATURES[n].pv === 4 && SF.CREATURES[n].atq === 0 && SF.CREATURES[n].lvl === 2), "soutiens N2 (Hurleur depuis la v0.5) : 0 ATQ / 4 PV");
  ok(["Sapeur","Sporeur"].every(n => SF.CREATURES[n].pv === 6 && SF.CREATURES[n].atq === 0), "soutiens N3 : 0 ATQ / 6 PV");
  const g = { id: 1, name: "Glaneur", lane: "N", u: 0, k: 4, hp: 2, new: true, acted: false };
  const h = { id: 2, name: "Hurleur", lane: "N", u: 0, k: 4, hp: 2, new: true, acted: false };
  S.creatures.push(g, h);
  SF.act(S, g);
  ok(S.tiles["0,1"].hp === 1 && g.hp === 2 && g.k === 2, "le Glaneur avance jusqu'à la haie de départ, ne la frappe pas et ne prend pas d'Épines");
  ok(SF.effAtq(S, g) === 0, "un soutien reste à 0 ATQ même sous l'Aura Fureur d'un autre Hurleur");
}
// 14. Camouflage : toutes les forteresses sauf Antenne, Laboratoire, Observatoire, Baraquement, Dortoir
{
  const S = fresh(); SF.attackerDraw(S);
  for (const n of Object.keys(SF.TILES).filter(n => !["Antenne", "Laboratoire", "Observatoire", "Baraquement", "Dortoir", "Archives", "Avant-poste du Nord", "Avant-poste de l'Est", "Avant-poste du Sud", "Avant-poste de l'Ouest", "Abri blindé"].includes(n))) ok(!SF.tileStats(n, 0, 2).revealed && SF.tileStats(n, 0, 2).camo === 1, n + " posé camouflé");
  for (const n of ["Antenne", "Laboratoire", "Observatoire", "Baraquement", "Dortoir", "Archives", "Avant-poste du Nord", "Avant-poste de l'Est", "Avant-poste du Sud", "Avant-poste de l'Ouest"]) ok(SF.tileStats(n, 0, 2).revealed && !SF.tileStats(n, 0, 2).camo, n + " posé face visible");
  S.tiles["0,1"] = SF.tileStats("Muraille", 0, 1);
  const c = { id: 950, name: "Carapace", lane: "N", u: 0, k: 4, hp: 3, new: true, acted: false };
  S.creatures.push(c); SF.act(S, c);
  ok(S.tiles["0,1"] === undefined || S.tiles["0,1"].revealed, "la Muraille est révélée à la première attaque");
  ok(c.hp === 3, "Muraille : ni piège ni Épines, la Carapace ne perd rien");
  ok(SF.pubName("Muraille") === "tuile camouflée" && SF.pubName("Dortoir") === "Dortoir", "le journal ne nomme pas une tuile camouflée");
}
// 15. Griffes : Aura +1 ATQ aux autres créatures de la case ; toutes les auras se cumulent (Oni, 02/11/2026)
{
  const S = fresh(); S.upgrades.soutien.r1 = "B";
  const g1 = { id: 1, name: "Glaneur", lane: "N", u: 0, k: 4, hp: 2 }, g2 = { id: 2, name: "Œil-sonde", lane: "N", u: 0, k: 4, hp: 2 };
  const e = { id: 3, name: "Écorcheur", lane: "N", u: 0, k: 4, hp: 1 };
  S.creatures.push(g1, g2, e);
  ok(SF.effAtq(S, e) === 3, "Griffes ne donne plus d'ATQ (Coup de grâce, 11/11/2026)");
  S.creatures.push({ id: 4, name: "Hurleur", lane: "N", u: 0, k: 4, hp: 2 });
  ok(SF.effAtq(S, e) === 5, "+ un Hurleur : 3 + 2 (Fureur)");
  ok(SF.effAtq(S, g1) === 0, "le soutien reste à 0 ATQ");
}
// 16. tourelles : 8 cases autour du support ; niveau I = 1 + paliers de fusée (3/6/9), niveau II = 2
{
  const S = fresh();
  const near = { id: 1, name: "Béhémoth", lane: "N", u: 0, k: 2, hp: 50 };   // C2 Nord = (0,2), diagonale du support (1,1)
  const side = { id: 2, name: "Béhémoth", lane: "E", u: 0, k: 2, hp: 50 };   // (2,0) : diagonale de (1,1) ? non, distance 1 en x, 1 en y → oui
  const far = { id: 3, name: "Béhémoth", lane: "N", u: 0, k: 3, hp: 50 };    // (0,3) : hors de portée
  S.creatures.push(near, side, far);
  const t = SF.supportTargets(S, "1,1").map(c => c.id).sort();
  ok(t.join() === "1,2", "support (1,1) : vise C2 Nord et C2 Est, pas C3 (" + t.join() + ")");
  ok(SF.turretDmg(S, 1) === 1 && SF.turretDmg(S, 2) === 2, "étage 0 : niveau I = 1 dégât, niveau II = 2");
  S.floors = 3; ok(SF.turretDmg(S, 1) === 2, "étage 3 : niveau I = 2");
  S.floors = 9; ok(SF.turretDmg(S, 1) === 4 && SF.turretDmg(S, 2) === 2, "étage 9 : niveau I = 4, niveau II inchangé");
}
// 17. fusée : une attaque = un seul travailleur
{
  const S = fresh(); SF.attackerDraw(S); delete S.tiles["0,1"];
  const m = { id: 9, name: "Massacreur", lane: "N", u: 0, k: 1, hp: 3, acted: false };
  S.creatures.push(m); const w0 = S.workersBase; SF.act(S, m);
  ok(S.workersBase === w0 - 1, "Massacreur (7 ATQ) contre la fusée : −1 travailleur seulement");
}
// 18. plafond de population par lane : 1 / 2 / 3 / 4 / 5
{
  const S = fresh();
  ok([3, 9, 15, 21].map(b => { S.biomass = b; return SF.capOf(S); }).join() === "2,3,4,5", "plafonds 2 / 3 / 4 / 5 (biomasse départ / 9 / 15 / 21)");
}
// 19. Effort : +2 points (Cadence, doublon, retirée le 09/11/2026)
{
  const S = fresh(); SF.attackerDraw(S); SF.endDeploy(S); SF.startAttacks(S); SF.endAttackerTurn(S);
  const p0 = SF.totalPoints(S); S.spells = ["Effort"]; SF.useSpell(S, 0);
  ok(SF.totalPoints(S) === p0 + 2, "Effort : +2 points (" + p0 + " → " + SF.totalPoints(S) + ")");
}
// 20. chantier par lane, case choisie à la fin de la construction
{
  const S = fresh(); SF.attackerDraw(S); SF.endDeploy(S); SF.startAttacks(S); SF.endAttackerTurn(S);
  S.hand.unshift("Palissade");
  ok(SF.startChantier(S, 0, "N"), "chantier lancé en lane Nord sans case cible");
  S.alloc.N = 1; SF.endDefenderTurn(S);
  ok(S.phase === "D_place" && SF.placeTargets(S).includes("0,2") && !SF.placeTargets(S).includes("2,0"), "pose : cases de la lane Nord seulement");
  const c = { id: 77, name: "Béhémoth", lane: "N", u: 0, k: 2, hp: 50 }; S.creatures.push(c);
  ok(SF.placeTile(S, "0,2") && S.tiles["0,2"].name === "Palissade" && c.k === 3, "posée en C2, la créature recule en C3");
  ok(S.phase !== "D_place", "le tour de la colonie se termine après la pose");
}
// 21. actions des joueurs (SF.apply) : camp, phase et paramètres vérifiés par le moteur
{
  const S = fresh();
  ok(SF.apply(S, "colonie", "draw") !== "" && S.phase === "A_start", "la colonie ne peut pas piocher pour l'essaim");
  ok(SF.apply(S, "essaim", "endDeploy") !== "", "fin de déploiement refusée avant la pioche");
  ok(SF.apply(S, "essaim", "draw") === "" && S.phase === "A_deploy", "l'essaim pioche");
  ok(SF.apply(S, "essaim", "deploy", { uid: S.handA[0].uid, lane: "X", u: 0 }) !== "", "lane inconnue refusée");
  ok(SF.apply(S, "essaim", "deploy", { uid: S.handA[0].uid, lane: "N", u: 7 }) !== "", "colonne hors plateau refusée");
  ok(SF.apply(S, "essaim", "nimporte") !== "", "action inconnue refusée");
  S.creatures.push({ id: 990, name: "Carapace", lane: "N", u: 0, k: 4, hp: 3, acted: false }); // une créature en jeu : sinon l'étape d'attaque passe d'elle-même
  ok(SF.apply(S, "essaim", "endDeploy") === "" && SF.apply(S, "essaim", "toAttacks") !== "", "fin du déploiement (et des améliorations) : passage direct aux attaques (Oni, 06/11/2026)");
  ok(S.phase === "A_attack" || S.phase === "A_react", "phase d'attaque (ou de réaction si la colonie tient un sortilège offensif)");
}
// 22. fenêtre de réaction : ouverte seulement si la colonie tient un sortilège offensif autre que Famine
{
  const S = fresh(); SF.apply(S, "essaim", "draw");
  S.spells = ["Barrage"]; S.creatures.push({ id: 990, name: "Carapace", lane: "N", u: 0, k: 4, hp: 3, acted: false });
  SF.apply(S, "essaim", "endDeploy");
  ok(S.phase === "A_react", "Barrage en main → fenêtre de réaction");
  ok(SF.apply(S, "essaim", "endA") !== "", "l'essaim ne peut pas agir pendant la réaction");
  ok(SF.apply(S, "colonie", "spell", { i: 0, arg: "N" }) === "" && S.spells.length === 0, "la colonie joue Barrage");
  ok(SF.apply(S, "colonie", "reactDone") === "" && S.phase === "A_attack", "fin de la réaction");
  const T = fresh(); SF.apply(T, "essaim", "draw"); T.spells = ["Famine", "Effort"]; T.creatures.push({ id: 990, name: "Carapace", lane: "N", u: 0, k: 4, hp: 3, acted: false });
  SF.apply(T, "essaim", "endDeploy");
  ok(T.phase === "A_attack", "Famine ou sort de soutien seuls : pas de fenêtre de réaction");
}
// 23. Renouvellement : indices invalides refusés (sinon pioche gratuite)
{
  const S = fresh(); SF.attackerDraw(S); SF.endDeploy(S); SF.startAttacks(S); SF.endAttackerTurn(S);
  S.spells = ["Renouvellement"]; const n = S.hand.length, deck = S.tileDecks.renfort.length;
  ok(SF.apply(S, "colonie", "spell", { i: 0, arg: ["a", "b"] }) !== "" && S.tileDecks.renfort.length === deck && S.spells.length === 1, "indices non numériques refusés");
  ok(SF.apply(S, "colonie", "spell", { i: 0, arg: [0, 0] }) !== "", "indice en double refusé");
  ok(SF.apply(S, "colonie", "spell", { i: 0, arg: [0] }) === "" && S.hand.length === n, "défausser 1 tuile et en repiocher 1");
}
// 24. fin du tour de la colonie : construction et pose, puis tirs, puis fenêtre Famine si la colonie tient Famine
{
  const S = fresh(); SF.attackerDraw(S); SF.endDeploy(S); SF.startAttacks(S); SF.endAttackerTurn(S);
  S.hand.unshift("Palissade");
  S.creatures.push({ id: 991, name: "Colosse", lane: "N", u: 1, k: 2, hp: 7, acted: false }); // à portée de la tourelle (1,1)
  SF.apply(S, "colonie", "startCh", { i: 0, lane: "N" }); S.alloc.N = 1;
  const deck = S.spellDeck; S.spellDeck = [...deck.filter(s => s !== "Famine"), "Famine"]; S.techBonus = 3; // pioche 1 sortilège : Famine
  SF.apply(S, "colonie", "build");
  ok(S.phase === "D_place", "pose du bâtiment achevé");
  ok(SF.apply(S, "colonie", "placeAt", { k: "0,2" }) === "" && S.phase === "D_fire", "après la pose : les tourelles tirent");
  ok(SF.apply(S, "colonie", "endD") === "" && S.phase === "D_spell" && S.spellOffer.length === 2 && S.spellOffer[0] === "Famine", "fin du tour : la colonie voit les 2 premiers sortilèges (09/11/2026)");
  const other = S.spellOffer[1], disc = S.spellDiscard.length;
  ok(SF.apply(S, "colonie", "spellPick", { i: 0 }) === "" && S.spells.includes("Famine") && S.spellDiscard.length === disc + 1 && S.spellDiscard.includes(other) && S.phase === "A_famine", "elle garde Famine, défausse l'autre ; puis fenêtre Famine ouverte");
  ok(SF.viewFor(S, "essaim").spellDiscard.includes(S.spellDiscard[S.spellDiscard.length - 1]) && SF.viewFor(S, "essaim").spellDeck.every(x => x === null), "l'essaim voit la défausse des sortilèges, pas la pioche ni le choix");
  ok(SF.apply(S, "colonie", "famine", { play: true }) === "" && S.phase === "A_start" && S.famine, "Famine jouée");
}
// 25. vue filtrée : rien de caché n'est envoyé à l'autre camp
{
  const S = fresh(); SF.attackerDraw(S);
  S.tiles["0,2"] = SF.tileStats("Mine supérieure", 0, 2);
  S.chantiers.E.push({ tile: "Muraille", left: 2, fresh: true }); S.chantiers.S.push({ tile: "Antenne", left: 1, fresh: true });
  S.toPlace.push({ tile: "Rempart", lane: "O" }); S.spells = ["Famine", "Effort"];
  const A = SF.viewFor(S, "essaim"), txt = JSON.stringify(A);
  ok(A.hand.length === S.hand.length && A.hand.every(x => x === null), "essaim : main de la colonie réduite à son nombre");
  ok(A.spells.length === 2 && A.spells.every(x => x === null), "essaim : sortilèges réduits à leur nombre");
  ok(A.tiles["0,2"].name === null && A.tiles["0,2"].hp === null && !txt.includes("Piège"), "essaim : tuile camouflée sans nom ni PV");
  ok(A.chantiers.E[0].tile === null && A.chantiers.S[0].tile === "Antenne", "essaim : chantier camouflé sans nom, Antenne visible");
  ok(A.toPlace[0].tile === null && !txt.includes("Muraille") && !txt.includes("Rempart"), "essaim : tuile à poser camouflée sans nom");
  ok(A.handA.length && A.handA[0].name, "essaim : voit sa propre main");
  ok([1, 2, 3].every(l => A.piles[l].every(x => x === null)) && Object.values(A.tileDecks).every(d => d.every(x => x === null)) && A.spellDeck.every(x => x === null), "personne ne voit l'ordre des pioches");
  const C = SF.viewFor(S, "colonie");
  ok(C.handA.length === S.handA.length && C.handA.every(x => x === null), "colonie : main de l'essaim réduite à son nombre");
  ok(C.tiles["0,2"].name === "Mine supérieure" && C.hand[0] === S.hand[0], "colonie : voit ses tuiles et sa main");
  S.upgrades.soutien.r2 = "C"; S.creatures.push({ id: 90, name: "Glaneur", lane: "N", u: 0, k: 4, hp: 2 });
  ok(SF.viewFor(S, "essaim").tiles["0,2"].name === "Mine supérieure", "Clairvoyance : la tuile camouflée est visible pour l'essaim");
}
// 26. événements visuels (animations) : produits seulement à la demande, et filtrés pour l'essaim
{
  const S = fresh(); SF.attackerDraw(S);
  SF.apply(S, "essaim", "endDeploy");
  ok(!("fx" in S), "sans demande, le moteur ne garde aucun événement dans l'état");
  const T = fresh(); T.tiles["1,2"] = SF.tileStats("Muraille", 1, 2); T.tiles["0,2"] = SF.tileStats("Mine supérieure", 0, 2);
  const c = { id: 50, name: "Écorcheur", lane: "N", u: 0, k: 4, hp: 1, acted: false }; T.creatures.push(c);
  T.phase = "A_attack"; T.fx = [];
  SF.apply(T, "essaim", "act", { key: SF.posKey(c) });
  ok(T.fx.some(e => e.t === "move") && T.fx.some(e => e.t === "reveal" && e.k === "0,2") && !T.fx.some(e => e.t === "hit" && e.k === "0,2"), "déplacement (C3), piège révélé en C2, l'Écorcheur meurt avant de frapper");
  ok(T.fx.some(e => e.t === "dmg" && e.id === 50) && T.fx.some(e => e.t === "die" && e.id === 50), "piège et Épines : dégâts puis mort de la créature");
  const hidden = SF.fxFor(T, "essaim", [{ t: "hit", id: null, k: "1,2", n: 1, hp: 3 }]);
  ok(hidden[0].hp === null && hidden[0].n === null, "PV d'une tuile camouflée encore cachée non transmis à l'essaim");
  ok(SF.fxFor(T, "colonie", [{ t: "hit", id: null, k: "1,2", n: 1, hp: 3 }])[0].hp === 3, "la colonie reçoit les PV de ses tuiles");
}
// 27. Épines (décision d'Oni, 30/10/2026) : seulement les Haies d'épines de départ (1), la Haie d'épines et le Mur hérissé (2)
{
  const withEp = Object.keys(SF.TILES).filter(n => SF.TILES[n].ep > 0).sort();
  ok(withEp.join() === ["Baraquement", "Haie d'épines", "Ligne de front", "Mur hérissé", "Réduit", "Ronceraie"].sort().join() && SF.TILES["Haie d'épines"].ep === 2 && SF.TILES["Mur hérissé"].ep === 2 && SF.TILES["Réduit"].ep === 1, "tuiles à Épines : Baraquement, Ligne de front, Réduit (1) ; Haie d'épines, Mur hérissé, Ronceraie (2)");
  const S = fresh();
  ok(["0,1", "1,0", "0,-1", "-1,0"].every(k => S.tiles[k].name === "Barbelé" && S.tiles[k].start && S.tiles[k].ep === 1 && S.tiles[k].hp === 1 && S.tiles[k].max === 1 && S.tiles[k].revealed), "les Barbelés de départ (couronne 1) : 1 PV, Épines 1, face visible");
  // support de niveau 2 en (1,2) / (-1,2)… : il touche les murs (0,2) et (1,1) côté fusée
  S.supports["1,2"] = 2;
  S.tiles["0,2"] = SF.tileStats("Muraille", 0, 2);
  const touching = SF.supportWalls(1, 2);
  const tk = touching.find(k => k === "0,2");
  ok(SF.epinesOf(S, "0,2") === 0, "support de niveau 2 : plus de bonus d'Épines (Oni, 04/11/2026) : Muraille 0");
  S.tiles["0,2"] = SF.tileStats("Haie d'épines", 0, 2);
  ok(SF.epinesOf(S, "0,2") === 2, "Haie d'épines à côté d'un support de niveau 2 : Épines 2 (sans bonus)");
  const old = { tiles: { "0,1": { name: "Mur de départ", ep: 1 }, "0,2": { name: "Muraille", ep: 1 } }, tileDiscard: ["Mur de départ", "Muraille"], tileDeck: [], hand: [] };
  SF.migrate(old);
  ok(old.tiles["0,1"].name === "Barbelé" && old.tiles["0,1"].start && old.tiles["0,2"].ep === 0 && old.tileDiscards.renfort.join() === "Muraille", "ancienne partie : Mur de départ devenu Barbelé, Épines mises à jour");
  const old2 = { tiles: { "0,1": { name: "Haie de départ", ep: 1, hp: 2, max: 2 } }, tileDiscard: [], tileDeck: [], hand: [] };
  SF.migrate(old2);
  ok(old2.tiles["0,1"].name === "Barbelé" && old2.tiles["0,1"].hp === 1 && old2.tiles["0,1"].max === 1, "partie d'hier : Haie de départ (2 PV) ramenée à 1 PV");
}
// 28. fusée : coût d'un étage 2 / 4 / 6 / 8 selon le palier (Oni, 04/11/2026) (étages 1-3, 4-6, 7-9, 10-12)
{
  const S = fresh();
  const costs = [];
  for (let f = 0; f < 12; f++) { S.floors = f; costs.push(SF.floorCost(S)); }
  ok(costs.join(" ") === "2 2 2 4 4 4 7 7 7 10 10 10", "coût par étage (2 / 4 / 7 / 10, 11/11/2026) : " + costs.join(" "));
  const T = fresh(); T.phase = "D_fire"; T.floors = 2; T.rocketPts = 0; T.workersBase = 6;
  T.alloc = { N: 0, E: 0, S: 0, O: 0 }; T.extraPts = 0;
  SF.endDefenderTurn(T);
  ok(T.floors === 4 && T.rocketPts === 0, "6 points avec 2 étages : étage 3 (2 points), étage 4 (4 points)");
}
// 29. animations du lot 3 : fusée (étage, Nuke, décollage), Vision, améliorations — événements seulement, règles inchangées
{
  const T = fresh(); T.phase = "D_fire"; T.floors = 8; T.rocketPts = 0; T.workersBase = 7;
  T.alloc = { N: 0, E: 0, S: 0, O: 0 }; T.extraPts = 0;
  T.creatures.push({ id: 70, name: "Carapace", lane: "S", u: 0, k: 4, hp: 3, acted: false });
  T.fx = []; SF.endDefenderTurn(T);
  ok(T.floors === 9 && T.fx.some(e => e.t === "floor" && e.n === 9) && T.fx.some(e => e.t === "nuke" && e.ids.includes(70)) && T.creatures.length === 0, "étage 9 : événements étage + Nuke, créatures détruites");
  const U = fresh(); U.phase = "D_fire"; U.floors = 11; U.rocketPts = 0; U.workersBase = 10;
  U.alloc = { N: 0, E: 0, S: 0, O: 0 }; U.extraPts = 0; U.fx = []; SF.endDefenderTurn(U);
  ok(U.winner === "colonie" && U.fx.some(e => e.t === "liftoff"), "étage 12 : décollage et victoire de la colonie");
  const V = fresh(); SF.attackerDraw(V); V.tiles["0,2"] = SF.tileStats("Muraille", 0, 2);
  V.handA = [{ name: "Œil-sonde", free: true, uid: 999 }]; V.fx = [];
  SF.deploy(V, 999, "N", 0);
  ok(V.fx.some(e => e.t === "vision" && e.keys.includes("0,2")) && V.tiles["0,2"].revealed, "Vision : événement avec la tuile révélée");
  V.budget = 20; V.fx = []; SF.invest(V, "aggro", "A1", 99);
  ok(V.fx.some(e => e.t === "invest") && V.fx.some(e => e.t === "upgrade" && e.name === "Férocité"), "investissement puis amélioration acquise");
  const D = fresh(); D.fx = []; SF.attackerDraw(D);
  ok(D.fx.some(e => e.t === "draw" && e.n === D.handA.length), "pioche de l'essaim");
}
// 30. coûts des améliorations 6 / 12 et main de la colonie 4 + 1 par palier (décisions d'Oni, 30/10/2026)
{
  ok(SF.COST_R1 === 6 && SF.COST_R2 === 12 && SF.nodeCost("A1") === 6 && SF.nodeCost("C2") === 12, "améliorations : rang 1 = 6, rang 2 = 12");
  const S = fresh();
  const sizes = [0, 3, 6, 9].map(f => { S.floors = f; S.chPerLane = f >= 6 ? 2 : 1; return SF.handSize(S); });
  ok(sizes.join() === "4,5,6,7", "main de tuiles : 4 / 5 / 6 / 7 selon les paliers (" + sizes.join(" / ") + ")");
  const old = fresh(); old.invest = { "aggro:A1": 7 };
  SF.migrate(old);
  ok(old.upgrades.aggro.r1 === "A" && !old.invest["aggro:A1"], "ancienne partie : un nœud déjà payé 7 (≥ 6) est acquis");
}
// 31. biomasse : une tuile détruite rapporte sa durée de construction (1 / 2 / 3), une haie de départ 1, un support 1 (décision d'Oni, 30/10/2026)
{
  const gain = (name, k = "0,2") => {
    const S = fresh(); delete S.tiles["0,1"]; S.supports = {};
    const [x, y] = k.split(",").map(Number); S.tiles[k] = SF.tileStats(name, x, y); S.tiles[k].hp = 1;
    const b = S.biomass, c = { id: 81, name: "Massacreur", lane: "N", u: 0, k: 4, hp: 9, acted: false };
    S.creatures.push(c); SF.act(S, c);
    return S.tiles[k] ? "intacte" : S.biomass - b;
  };
  const g = [gain("Palissade"), gain("Muraille"), gain("Rempart"), gain("Muraille", "0,3")];
  ok(g.join() === "1,1,1,1", "toute tuile détruite rapporte 1 biomasse (Palissade, Muraille, Rempart, Muraille en couronne 3 : +" + g.join(" / +") + ")");
  const S = fresh(); S.supports = {}; const b = S.biomass, n = Object.values(S.tileDiscards).flat().length;
  const c = { id: 82, name: "Massacreur", lane: "N", u: 0, k: 4, hp: 9, acted: false }; S.creatures.push(c); SF.act(S, c);
  ok(!S.tiles["0,1"] && S.biomass - b === 1 && Object.values(S.tileDiscards).flat().length === n, "haie de départ détruite : +1 biomasse, retirée du jeu (pas de défausse)");
  const T = fresh(); const tb = T.biomass;
  const d = { id: 83, name: "Massacreur", lane: "N", u: 0, k: 4, hp: 9, acted: false };
  const sup = Object.keys(T.supports).length; delete T.tiles["1,0"]; delete T.tiles["-1,0"];
  T.creatures.push(d); SF.act(T, d);
  const fell = sup - Object.keys(T.supports).length;
  ok(fell > 0 && T.biomass - tb === 1 + fell, "support tombé : +1 chacun (" + fell + " tombé(s), +" + (T.biomass - tb) + " au total avec la haie)");
}
// 32. blocs (décision d'Oni, 30/10/2026) : une case avance d'un bloc ; les plus avancées d'abord ; ordre d'attaque choisi
{
  const S = fresh(); S.phase = "A_attack"; S.supports = {};
  delete S.tiles["0,1"];
  S.tiles["0,2"] = SF.tileStats("Palissade", 0, 2); S.tiles["0,2"].hp = 1; // tombe au premier coup
  S.tiles["0,1"] = SF.tileStats("Muraille", 0, 1);
  const a = { id: 60, name: "Écorcheur", lane: "N", u: 0, k: 3, hp: 1, acted: false }; // au contact de la Palissade
  const b = { id: 61, name: "Carapace", lane: "N", u: 0, k: 3, hp: 3, acted: false };
  const g = { id: 62, name: "Œil-sonde", lane: "N", u: 0, k: 3, hp: 2, acted: false };
  const back = { id: 63, name: "Écorcheur", lane: "N", u: -2, k: 4, hp: 1, acted: false }; // plus loin de la fusée (A)
  S.creatures.push(a, b, g, back);
  const key = SF.posKey(a);
  ok(SF.readyCases(S).join() === key, "seule la case la plus avancée de la lane peut agir (pas la colonne A)");
  ok(SF.apply(S, "essaim", "act", { key: SF.posKey(back) }) !== "", "la case de la colonne A doit attendre");
  S.fx = [];
  ok(SF.apply(S, "essaim", "act", { key, order: [61, 60] }) === "", "le bloc agit, la Carapace frappe d'abord (ordre choisi)");
  ok(!S.tiles["0,2"] && [a, b, g].every(c => c.k === 2 && c.u === 0) && S.tiles["0,1"].hp === 4 - 3, "Palissade détruite par la Carapace : le bloc (qui n'avait pas bougé) entre dans la case libérée C2 ; l'Écorcheur frappe la Muraille (4 → 1)");
  ok(S.fx.filter(e => e.t === "move").every(e => e.ids && e.ids.length === 3), "les déplacements concernent les 3 créatures du bloc (soutien compris)");
  ok(SF.readyCases(S).join() === SF.posKey(back), "ensuite seulement, la case de la colonne A peut agir");
}
// 33. Mobilité (2 cases par tour depuis le 02/11/2026) et Percée (ancien Raid) — décisions d'Oni
{
  const S = fresh(); SF.attackerDraw(S); SF.endDeploy(S); // phase A_upgrade
  const c = { id: 70, name: "Écorcheur", lane: "N", u: 1, k: 3, hp: 1, acted: false };
  const d = { id: 71, name: "Écorcheur", lane: "N", u: 0, k: 4, hp: 1, acted: false };
  S.creatures.push(c, d);
  ok(!SF.ACTIONS.moveLane && SF.speedOf(S, c) === 1, "plus de changement de lane ; sans l'amélioration : 1 case par tour");
  S.upgrades.aggro.r1 = "B";
  ok(SF.speedOf(S, c) === 2 && SF.speedOf(S, { name: "Carapace" }) === 1, "Mobilité : 2 cases par tour pour les aggros seulement");
  ok(SF.TREES.aggro.B2[0] === "Essaim agrandi" && !SF.hasMobility(S, { name: "Carapace", lane: "N", u: 0, k: 4 }), "le rang 2 côté B s'appelle « Essaim agrandi » ; les tanks n'ont pas la Mobilité");
  const T = fresh(); const before = SF.capOf(T);
  T.upgrades.aggro.r2 = "B";
  ok(SF.capOf(T) === before + 3, "Essaim agrandi : plafond de population +3 (" + before + " → " + SF.capOf(T) + ")");
  ok(!SF.hasPercee(T, { name: "Massacreur", lane: "N", u: 0, k: 4 }), "les aggros n'ont plus la percée par amélioration (seulement l'Aura Percée du Perforeur)");
}
// 34. les tourelles tirent APRÈS la construction et la fusée (décision d'Oni, 30/10/2026)
{
  // un support de niveau 1 apparaît ce tour et un palier (étage 3) est atteint : la tourelle tire déjà, avec +1 dégât
  const S = fresh(); S.phase = "D_main"; S.supports = {}; S.floors = 2; S.rocketPts = 0; S.workersBase = 3;
  S.alloc = { N: 0, E: 0, S: 0, O: 0 }; S.extraPts = 0;
  const c = { id: 95, name: "Béhémoth", lane: "N", u: 0, k: 2, hp: 5, acted: false };
  S.creatures.push(c);
  ok(SF.apply(S, "colonie", "build") === "" && S.phase === "D_fire", "construction et fusée d'abord, puis phase de tirs");
  ok(S.floors === 3 && S.supports["1,1"] === 1 && S.supports["-1,1"] === 1, "étage 3 atteint, supports de niveau 1 posés ce tour");
  ok(SF.turretDmg(S, 1) === 2 && SF.supportTargets(S, "1,1").includes(c), "la nouvelle tourelle a déjà le bonus du palier (2 dégâts) et vise le Béhémoth");
  const hp = c.hp; SF.apply(S, "colonie", "fire", { sk: "1,1", id: 95 });
  ok(c.hp === hp - 2, "tir de la nouvelle tourelle : −2");
  ok(SF.apply(S, "colonie", "endD") === "" && ["A_start", "A_famine"].includes(S.phase), "fin du tour : tirs restants automatiques, puis tour de l'essaim");
}
// 35. Famine −5, Déploiement (cartes gratuites piochées en premier), supports avant la fusée (décisions d'Oni, 30/10/2026)
{
  const S = fresh(); S.biomass = 9; S.spells = ["Famine"]; S.phase = "A_famine";
  SF.apply(S, "colonie", "famine", { play: true }); SF.apply(S, "essaim", "draw");
  ok(S.budget === 4, "Famine : biomasse 9 ÷ 2 = 4 (arrondi à l'inférieur)");
  const T = fresh(); T.upgrades.aggro = { r1: "A", r2: "C" }; T.biomass = 15;
  for (let i = 0; i < 10; i++) { const n = T.piles[1].pop(); T.creatures.push({ id: 900 + i, name: n, lane: "N", u: 0, k: 4, hp: 1 }); }
  T.log = []; SF.attackerDraw(T);
  ok(T.handA.filter(c => c.free).length === 2 && T.log.some(l => l.msg.includes("2 cartes de niveau 1 gratuites")), "Déploiement : 2 cartes gratuites même quand la pioche normale vide le niveau 1");
  const U = fresh(); U.upgrades.aggro = { r1: "A", r2: "C" }; U.piles[1] = []; U.log = []; SF.attackerDraw(U);
  ok(U.log.some(l => l.msg.includes("vide, aucune carte gratuite")), "Déploiement : message clair si la pioche de niveau 1 est vide");
  const V = fresh(); V.phase = "D_main"; V.supports = {}; V.floors = 2; V.rocketPts = 0; V.workersBase = 3;
  V.alloc = { N: 0, E: 0, S: 0, O: 0 }; V.extraPts = 0; V.fx = [];
  SF.apply(V, "colonie", "build");
  const iSup = V.fx.findIndex(e => e.t === "supUp"), iFloor = V.fx.findIndex(e => e.t === "floor");
  ok(iSup >= 0 && iFloor >= 0 && iSup < iFloor, "fin de tour : les supports apparaissent avant les étages de la fusée");
}
// 36. un bloc n'avance qu'avant une attaque, jamais après la dernière (Oni, 01/11/2026)
{
  const S = fresh(); S.phase = "A_attack"; S.supports = {};
  delete S.tiles["0,1"];
  S.tiles["0,2"] = SF.tileStats("Palissade", 0, 2); S.tiles["0,2"].hp = 1;
  S.tiles["0,1"] = SF.tileStats("Muraille", 0, 1);
  const a = { id: 64, name: "Écorcheur", lane: "N", u: 0, k: 4, hp: 1, acted: false };
  const g = { id: 65, name: "Glaneur", lane: "N", u: 0, k: 4, hp: 2, acted: false };
  S.creatures.push(a, g);
  SF.apply(S, "essaim", "act", { key: SF.posKey(a) });
  ok(!S.tiles["0,2"] && a.k === 3 && g.k === 3 && S.tiles["0,1"].hp === 4, "le seul attaquant détruit la Palissade : le bloc reste en C3 (il n'avance pas après la dernière attaque)");
}
// 37. mise en place (Oni, 01/11/2026) : haies d'épines de départ sur les couronnes 1 et 2, supports de niveau 1 et 2
{
  const S = SF.newGame();
  const starts = Object.keys(S.tiles).filter(k => S.tiles[k].start);
  ok(starts.length === 16 && starts.every(k => [1, 2].includes(SF.ring(...SF.parse(k))) && S.tiles[k].hp === 1 && S.tiles[k].ep === 1 && S.tiles[k].revealed), "16 Barbelés de départ (couronnes 1 et 2), 1 PV, Épines 1, face visible");
  ok(Object.values(S.supports).filter(l => l === 1).length === 4 && Object.values(S.supports).filter(l => l === 2).length === 4, "4 supports de niveau 1 et 4 de niveau 2 dès le départ");
  ok(SF.epinesOf(S, "1,2") === 1 && SF.epinesOf(S, "0,2") === 1, "tous les Barbelés ont Épines 1 (plus de bonus des supports de niveau 2)");
}
// 38. sortilèges non joués : gardés en main tant qu'ils ne sont pas joués, offensifs comme de soutien (Oni, 01/11/2026)
{
  const S = fresh(); SF.attackerDraw(S); SF.endDeploy(S);
  S.spells = ["Barrage", "Effort"];
  SF.apply(S, "essaim", "toAttacks");
  ok(S.phase === "A_react" && SF.apply(S, "colonie", "reactDone") === "", "fenêtre de réaction passée sans jouer Barrage");
  SF.apply(S, "essaim", "endA");
  ok(S.spells.includes("Barrage") && S.spells.includes("Effort"), "fin du tour de l'essaim : Barrage (offensif) reste en main");
  S.techBonus = 0; // plus de technologies : la main ne change pas
  SF.apply(S, "colonie", "build"); while (S.phase === "D_place") SF.apply(S, "colonie", "placeAt", { k: SF.placeTargets(S)[0] });
  SF.apply(S, "colonie", "endD");
  ok(S.spells.includes("Barrage") && S.spells.includes("Effort"), "fin du tour de la colonie : Effort (soutien) reste aussi en main, même sans technologies");
}
// 39. tanks à 1 ATQ et Égide (3 PV, Bouclier 2) — Oni, 01/11/2026
{
  ok(["Carapace", "Béhémoth", "Colosse"].map(n => SF.CREATURES[n].atq + "/" + SF.CREATURES[n].pv).join(" ") === "1/3 2/4 3/5", "tanks (11/11/2026) : 1/3, 2/4, 3/5");
  const E = SF.TILES["Égide"];
  ok(E && E.pv === 2 && !E.ren && E.shield === 1 && E.d === 2 && E.camo && E.n === 3 && E.ep === 0, "Égide : 2 PV, Bouclier (au lieu de Renforcé 2, 09/11/2026), 2 tours, camouflée, 3 exemplaires, sans Épines");
  { const G = SF.newGame(); ok(G.hand.length === 0 && Object.values(G.tileDecks).flat().length === 63, "pioches de forteresses : 63 tuiles en 3 pioches (Oni, 07/11/2026 : 6 Mines et Siphons de plus, 3 Abris blindés) ; main vide au départ"); }
  ok(["Antenne", "Laboratoire", "Observatoire", "Archives"].every(n => SF.TILES[n].tech && SF.TILES[n].n === 3), "3 exemplaires de chaque bâtiment à technologies (Oni, 02/11/2026)");
  const hit = (name, atq) => {
    const S = fresh(); S.supports = {}; delete S.tiles["0,1"]; S.tiles["0,1"] = SF.tileStats("Égide", 0, 1);
    const c = { id: 96, name, lane: "N", u: 0, k: 4, hp: 9, acted: false }; S.creatures.push(c); SF.act(S, c);
    return S.tiles["0,1"] ? S.tiles["0,1"].hp : 0;
  };
  ok(hit("Écorcheur") === 1, "Écorcheur (3 ATQ) contre l'Égide (Renforcé 2) : −1 PV (2 → 1)");
  ok(hit("Carapace") === 2, "Carapace (1 ATQ) contre l'Égide : aucun dégât");
  ok(hit("Massacreur") === 0, "Massacreur (7 ATQ) : −3 PV, l'Égide (3 PV) tombe");
}
// 40. Dortoir, Archives, améliorations des tanks, PV des aggros (Oni, 01/11/2026)
{
  const D = SF.TILES["Dortoir"], A = SF.TILES["Archives"];
  ok(D.d === 3 && D.pv === 3 && D.ren === 2 && D.temp === 1 && !D.perm && D.n === 3 && !D.camo, "Dortoir : 3 tours, 3 PV, Renforcé 2, +1 travailleur temporaire, 3 ex., face visible");
  ok(A.d === 2 && A.pv === 2 && A.shield === 1 && A.tech === 1 && A.n === 3 && !A.camo && A.ep === 0, "Archives : 2 tours, 2 PV + Bouclier (09/11/2026), +1 technologie, 3 ex., face visible");
  const S = fresh(); const w = SF.bonusWorkers(S), t = SF.tech(S);
  S.tiles["0,2"] = SF.tileStats("Dortoir", 0, 2); S.tiles["0,-2"] = SF.tileStats("Archives", 0, -2);
  ok(SF.bonusWorkers(S) === w + 1 && SF.tech(S) === t + 1, "Dortoir en jeu : +1 travailleur ; Archives : +1 technologie");
  delete S.tiles["0,2"];
  ok(SF.bonusWorkers(S) === w, "Dortoir détruit : le travailleur est perdu (temporaire)");
  S.upgrades.tank.r1 = "A"; const m1 = SF.maxHp(S, "Carapace"); S.upgrades.tank.r2 = "A";
  ok(m1 === 4 && SF.maxHp(S, "Carapace") === 4, "Carapace épaisse +1 PV (3 → 4) ; Blindage ne donne plus de PV (jeton, 11/11/2026)");
  ok(["Écorcheur", "Ravageur", "Massacreur"].map(n => SF.CREATURES[n].atq + "/" + SF.CREATURES[n].pv).join(" ") === "3/1 4/2 5/3", "aggros (11/11/2026) : 3/1, 4/2, 5/3");
}
// 41. Aura d'épines des Avant-postes, Ronceraie, Piège à 3 dégâts (Oni, 01/11/2026)
{
  const S = fresh(); S.supports = {};
  S.tiles["1,2"] = SF.tileStats("Muraille", 1, 2);
  S.tiles["0,3"] = SF.tileStats("Avant-poste du Nord", 0, 3);     // diagonale de (1,2)
  ok(SF.epinesOf(S, "1,2") === 1, "Muraille en diagonale d'un Avant-poste : Épines 1 (8 cases autour)");
  S.tiles["2,3"] = SF.tileStats("Avant-poste de l'Est", 2, 3);    // autre diagonale
  ok(SF.epinesOf(S, "1,2") === 2, "deux Avant-postes voisins : +1 chacun (Épines 2)");
  S.supports["2,2"] = 2; // coin de support de niveau 2 qui touche (1,2) par un côté
  ok(SF.epinesOf(S, "1,2") === 2, "le support de niveau 2 n'ajoute plus d'Épines (Épines 2)");
  ok(SF.epinesOf(S, "1,2", true) === 2 && !S.tiles["0,3"].camo, "Avant-postes posés face visible : l'essaim voit aussi leur aura (Épines 2)");
  const U = fresh(); U.supports = { "2,2": 2 };
  U.tiles["1,3"] = SF.tileStats("Muraille", 1, 3); U.tiles["3,1"] = SF.tileStats("Muraille", 3, 1); U.tiles["2,3"] = SF.tileStats("Muraille", 2, 3);
  ok(SF.epinesOf(U, "1,3") === 0 && SF.epinesOf(U, "3,1") === 0 && SF.epinesOf(U, "2,3") === 0, "support de niveau 2 : aucune Épines autour (Oni, 04/11/2026)");
  const old = { tiles: { "0,3": { name: "Avant-poste du Nord", camo: 1, revealed: false, ep: 0 } }, tileDiscard: [], tileDeck: [], hand: [] };
  SF.migrate(old);
  ok(old.tiles["0,3"].revealed && !old.tiles["0,3"].camo, "partie en cours : un Avant-poste caché est retourné face visible");
  const R = SF.TILES["Ronceraie"];
  ok(R.d === 3 && R.pv === 2 && R.ren === 2 && R.ep === 2 && R.camo && R.n === 3, "Ronceraie : 3 tours, 2 PV, Renforcé 2, Épines 2, camouflée, 3 ex.");
  ok(SF.TRAP_DMG === 3, "Piège : 3 dégâts");
  const T = fresh(); T.supports = {}; delete T.tiles["0,1"]; T.tiles["0,1"] = SF.tileStats("Mine supérieure", 0, 1);
  T.handA = [{ name: "Œil-sonde", free: true, uid: 990 }]; T.phase = "A_deploy"; T.budget = 0;
  SF.deploy(T, 990, "N", 1);
  const c = { id: 97, name: "Carapace", lane: "N", u: 0, k: 4, hp: 3, acted: false }; T.creatures.push(c); SF.act(T, c);
  ok(c.hp === 3, "Piège vu par la Vision d'un Œil-sonde : il ne se déclenche plus");
}
// 42. Charognard : Dépouille (remplace l'Aura Butin, Oni 12/11/2026)
{
  const mk = (name, k, hp = 1) => ({ id: Math.floor(Math.random() * 1e6) + 1000, name, lane: "N", u: 0, k, hp, acted: false });
  const S = fresh(); S.supports = {}; S.phase = "D_main"; S.round = 2;
  const dead = mk("Écorcheur", 2, 0), ph = mk("Charognard", 2, 4); S.creatures.push(dead, ph);
  const k = SF.key(...SF.toGlobal("N", 0, 2));
  SF.killCheck(S);
  ok(S.depouilles.length === 1 && S.depouilles[0] === k, "Charognard : la créature morte de sa case laisse un jeton Dépouille");
  S.hand = ["Palissade"]; S.turnPts = 5; S.spent = 0;
  ok(!SF.buildTargets(S, 0).includes(k), "Dépouille : aucun bâtiment ne peut être construit sur la case");
  const b = S.biomass; S.tiles["0,1"] = SF.tileStats("Palissade", 0, 1);
  SF.destroyTile && SF.destroyTile(S, "0,1", "", ph);
  ok(SF.CREATURES["Charognard"].capName === "Dépouille", "la Charognard n'a plus l'Aura Butin");
  const T = fresh(); T.supports = {}; const alone = mk("Écorcheur", 2, 0); T.creatures.push(alone); SF.killCheck(T);
  ok(T.depouilles.length === 0, "sans Charognard sur la case : pas de Dépouille");
  const E = fresh(); const d2 = mk("Écorcheur", 4, 0); E.creatures.push(d2, mk("Charognard", 4, 4)); SF.killCheck(E);
  ok(E.depouilles.length === 0, "case d'entrée : pas de Dépouille");
  const F = fresh(); F.phase = "D_fire"; F.firedSupports = []; F.depouilles = [k];
  const sk = Object.keys(F.supports).find(x => { const [px, py] = SF.parse(x), [dx, dy] = SF.parse(k); return F.supports[x] === 1 && Math.max(Math.abs(px - dx), Math.abs(py - dy)) === 1; });
  ok(!sk || (SF.apply(F, "colonie", "fireDep", { sk, k }) === "" && F.depouilles.length === 0 && F.firedSupports.includes(sk)), "un tir de tourelle à portée retire la Dépouille");
}
// 43. Piège avant l'attaque ; Percée limitée à la case suivante (Oni, 01/11/2026)
{
  const S = fresh(); S.supports = {}; delete S.tiles["0,1"]; S.tiles["0,1"] = SF.tileStats("Mine majeure", 0, 1);
  const t = { id: 99, name: "Carapace", lane: "N", u: 0, k: 4, hp: 5, acted: false }; S.creatures.push(t); SF.act(S, t);
  ok(t.hp === 2 && S.tiles["0,1"].hp === 1, "un tank à 5 PV survit à la Mine majeure (−3) puis frappe (1 ATQ : 2 → 1 PV)");
  const P = (setup, k = 4) => {
    const T = fresh(); T.supports = {}; for (const k of Object.keys(T.tiles)) delete T.tiles[k];
    setup(T); for (const k of Object.keys(T.tiles)) T.tiles[k].revealed = true; // tuiles déjà retournées (une tuile camouflée ne subit pas la percée)
    const m = { id: 100, name: "Massacreur", lane: "N", u: 0, k, hp: 1, acted: false }; T.creatures.push(m);
    T.creatures.push({ id: 101, name: "Perforeur", lane: "N", u: 0, k, hp: 5, acted: false }); // Aura Percée
    const w = T.workersBase; SF.actCase(T, SF.posKey(m), [100]); return { T, lost: w - T.workersBase };
  };
  let r = P(T => { T.tiles["0,3"] = SF.tileStats("Palissade", 0, 3); T.tiles["0,2"] = SF.tileStats("Palissade", 0, 2); T.tiles["0,1"] = SF.tileStats("Palissade", 0, 1); });
  ok(!r.T.tiles["0,3"] && !r.T.tiles["0,2"] && r.T.tiles["0,1"] && r.T.tiles["0,1"].hp === 2, "Percée : 7 → C3 (2 PV) détruite, 5 en trop sur C2 (détruite), pas plus loin : C1 intacte");
  r = P(T => { T.tiles["0,3"] = SF.tileStats("Palissade", 0, 3); T.tiles["0,1"] = SF.tileStats("Palissade", 0, 1); });
  ok(r.T.tiles["0,1"].hp === 2 && r.lost === 0, "Percée : case suivante (C2) vide → dégâts en trop perdus, même s'il y a un bâtiment plus loin");
  r = P(T => { T.tiles["0,1"] = SF.tileStats("Palissade", 0, 1); }, 2);
  ok(!r.T.tiles["0,1"] && r.lost === 1, "Percée : C1 détruite, la case suivante est la fusée → −1 travailleur");
}
// 44. mise à jour automatique (SF.migrate) : les haies de départ gardent Épines 1 (bug signalé par Oni, 01/11/2026)
{
  const S = SF.newGame(); const before = Object.keys(S.tiles).map(k => SF.epinesOf(S, k)).join();
  SF.migrate(S); SF.migrate(S);
  ok(Object.values(S.tiles).every(t => t.ep === 1) && Object.keys(S.tiles).map(k => SF.epinesOf(S, k)).join() === before, "après migrate (deux fois) : haies de départ toujours à Épines 1, rien ne change");
}
// 45. Sapeur : à son déploiement, détruit un bâtiment au choix de sa lane (Oni, 01/11/2026)
{
  const S = fresh(); S.phase = "A_deploy"; S.budget = 10; S.supports = {};
  S.tiles["0,2"] = SF.tileStats("Muraille", 0, 2);
  S.chantiers.N.push({ tile: "Palissade", left: 1, fresh: false });
  S.handA = [{ name: "Sapeur", free: false, uid: 801 }, { name: "Sapeur", free: false, uid: 802 }];
  ok(SF.apply(S, "essaim", "deploy", { uid: 801, lane: "N", u: 0 }) !== "", "Sapeur sans cible alors que sa lane a des bâtiments : refusé");
  ok(SF.apply(S, "essaim", "deploy", { uid: 801, lane: "N", u: 0, target: "1,0" }) !== "", "cible hors de sa lane : refusée");
  const b = S.biomass;
  ok(SF.apply(S, "essaim", "deploy", { uid: 801, lane: "N", u: 0, target: "0,2" }) === "" && !S.tiles["0,2"] && S.biomass === b + 1, "Sapeur déployé : la Muraille choisie est détruite (+1 biomasse)");
  ok(S.chantiers.N.length === 1 && S.log.every(l => !l.msg.includes("Muraille")), "le chantier n'est plus touché, et la tuile camouflée n'est pas nommée");
  delete S.tiles["0,1"]; S.budget = 10; S.biomass = 9;
  ok(SF.apply(S, "essaim", "deploy", { uid: 802, lane: "N", u: 1 }) === "", "lane sans bâtiment : le Sapeur se déploie sans cible");
}
// 46. tuiles de départ renommées « Barbelé » (Oni, 02/11/2026) ; une partie avec des « Haie d'épines » de départ est renommée
{
  const S = SF.newGame();
  ok(Object.values(S.tiles).every(t => t.name === "Barbelé" && t.start), "nouvelle partie : 16 Barbelés");
  const old = { tiles: { "0,1": { name: "Haie d'épines", start: true, ep: 2, hp: 1, max: 1 }, "0,3": { name: "Haie d'épines", ep: 2, hp: 1, max: 1, camo: 1 } }, tileDiscard: [], tileDeck: [], hand: [] };
  SF.migrate(old);
  ok(old.tiles["0,1"].name === "Barbelé" && old.tiles["0,1"].ep === 1 && old.tiles["0,3"].name === "Haie d'épines" && old.tiles["0,3"].ep === 2, "partie en cours : la haie de départ devient Barbelé (Épines 1), une Haie d'épines construite reste telle quelle");
}
// 47. Catalyseur : Aura Cuirasse (pas de dégâts d'Épines sur sa case), remplace l'Aura Instinct (Oni, 02/11/2026)
{
  const run = withCat => {
    const S = fresh(); S.supports = {}; delete S.tiles["0,1"]; S.tiles["0,1"] = SF.tileStats("Mur hérissé", 0, 1); // Épines 2
    const c = { id: 130, name: "Carapace", lane: "N", u: 0, k: 2, hp: 3, acted: false }; S.creatures.push(c);
    if (withCat) S.creatures.push({ id: 131, name: "Catalyseur", lane: "N", u: 0, k: 2, hp: 5, acted: false });
    SF.actCase(S, SF.posKey(c), [130]); return c.hp;
  };
  ok(run(false) === 1 && run(true) === 3, "Carapace contre un Mur hérissé : −2 d'Épines sans Catalyseur, rien avec");
  const T = fresh(); T.supports = {}; delete T.tiles["0,1"]; T.tiles["0,1"] = SF.tileStats("Mine supérieure", 0, 1);
  const d = { id: 132, name: "Béhémoth", lane: "N", u: 0, k: 2, hp: 7, acted: false }; T.creatures.push(d, { id: 133, name: "Catalyseur", lane: "N", u: 0, k: 2, hp: 5, acted: false });
  SF.actCase(T, SF.posKey(d), [132]);
  ok(d.hp === 2, "le piège blesse quand même (Mine supérieure : 5 dégâts, ce ne sont pas des Épines)");
  ok(SF.CREATURES["Catalyseur"].capName === "Aura Cuirasse" && !SF.ACTIONS.instinct && !SF.hasMobility(T, { name: "Carapace", lane: "N", u: 0, k: 4 }), "plus d'Aura Instinct : un tank n'a plus de Mobilité");
}
// 48. Muraille et Palissade à 4 ex., Feu nourri, support de niveau 3 à +3 travailleurs (Oni, 02/11/2026)
{
  ok(SF.TILES["Muraille"].n === 3 && SF.TILES["Palissade"].n === 3, "Muraille et Palissade : 3 exemplaires chacune");
  ok(SF.SPELLS["Feu nourri"] && SF.SPELLS["Feu nourri"].kind === "sup" && Object.values(SF.SPELLS).every(x => x.n === 1) && !SF.SPELLS["Cadence"], "Feu nourri : sort de soutien ; un seul exemplaire de chaque sortilège, Cadence retirée (09/11/2026)");
  const mk = () => {
    const S = fresh(); S.phase = "D_main";
    S.creatures.push({ id: 140, name: "Colosse", lane: "N", u: 0, k: 2, hp: 20, acted: false }); // à portée de (1,1) et (−1,1)
    return S;
  };
  const S = mk(); SF.apply(S, "colonie", "build"); SF.apply(S, "colonie", "autoFire");
  const once = 20 - S.creatures[0].hp;
  const T = mk(); T.spells = ["Feu nourri"]; SF.apply(T, "colonie", "spell", { i: 0, arg: null });
  SF.apply(T, "colonie", "build");
  const sk = "1,1";
  ok(SF.apply(T, "colonie", "fire", { sk, id: 140 }) === "" && SF.apply(T, "colonie", "fire", { sk, id: 140 }) === "" && SF.apply(T, "colonie", "fire", { sk, id: 140 }) !== "", "Feu nourri : la tourelle (1,1) tire 2 fois, pas 3");
  SF.apply(T, "colonie", "autoFire");
  ok(20 - T.creatures[0].hp === 2 * once, "Feu nourri : dégâts des tourelles doublés ce tour (" + once + " → " + (20 - T.creatures[0].hp) + ")");
  SF.apply(T, "colonie", "endD");
  ok(!T.doubleFire || T.phase !== "D_main", "l'effet ne dure qu'un tour");
  const U = fresh(); const w = SF.bonusWorkers(U); U.supports["3,3"] = 3;
  ok(SF.bonusWorkers(U) === w + 2, "support de niveau 3 : +2 travailleurs (Oni, 06/11/2026 soir)");
}
// 49. Renforcé : plusieurs PV d'un coup (règle d'origine, rétablie le 02/11/2026) ; Famine : biomasse ÷ 2 ; soutiens 2 / 4 / 6 PV (Oni, 02/11/2026)
{
  const S = fresh(); S.supports = {}; delete S.tiles["0,1"]; S.tiles["0,1"] = SF.tileStats("Rempart", 0, 1); // 4 PV, Renforcé 2
  const m = { id: 150, name: "Massacreur", lane: "N", u: 0, k: 4, hp: 1, acted: false }; S.creatures.push(m); SF.act(S, m);
  ok(S.tiles["0,1"].hp === 2, "Rempart (Renforcé 2) frappé pour 5 (Massacreur, 11/11/2026) : 2 PV perdus (4 → 2)");
  const T = fresh(); T.supports = {}; delete T.tiles["0,1"]; T.tiles["0,1"] = SF.tileStats("Rempart", 0, 1);
  const e = { id: 151, name: "Carapace", lane: "N", u: 0, k: 4, hp: 3, acted: false }; T.creatures.push(e); SF.act(T, e);
  ok(T.tiles["0,1"].hp === 4, "Rempart frappé pour 1 (moins que 2) : aucun PV perdu");
  ok([3, 6, 7, 15].map(SF.famineBudget).join() === "1,3,3,7", "Famine : budget = biomasse ÷ 2 arrondie à l'inférieur (3→1, 6→3, 7→3, 15→7)");
  ok(["Œil-sonde", "Glaneur", "Catalyseur"].every(n => SF.CREATURES[n].pv === 2) && ["Hurleur", "Charognard"].every(n => SF.CREATURES[n].pv === 4) && ["Sapeur", "Sporeur"].every(n => SF.CREATURES[n].pv === 6), "soutiens : 2 PV (niveau 1), 4 (niveau 2), 6 (niveau 3)");
}
// 50. Siphon : révélé par une attaque, −3 biomasse à l'essaim (jamais sous 3) ; pas s'il a été vu avant (Oni, 02/11/2026)
{
  ok(!SF.TILES["Siphon"] && !SF.TILES["Piège"], "le Piège et le Siphon d'origine sont remplacés (Oni, 07/11/2026)");
  ok(["mineur", "majeur", "supérieur"].every((q, i) => { const T = SF.TILES["Siphon " + q], M = SF.TILES["Mine " + q.replace("mineur", "mineure").replace("majeur", "majeure").replace("supérieur", "supérieure")];
    return T.d === i + 1 && T.pv === i + 1 && T.siphon === i + 1 && T.camo && T.n === 2 && M.d === i + 1 && M.pv === i + 1 && M.trap === [1, 3, 5][i] && M.camo && M.n === 2; }),
    "Mines (1 / 3 / 5 dégâts) et Siphons mineur / majeur / supérieur : 1 / 2 / 3 tours et PV ; camouflés ; 2 exemplaires chacun");
  const hit = (bio, setup) => {
    const S = fresh(); S.supports = {}; delete S.tiles["0,1"]; S.tiles["0,1"] = SF.tileStats("Siphon supérieur", 0, 1); S.biomass = bio;
    const c = { id: 160, name: "Carapace", lane: "N", u: 0, k: 4, hp: 3, acted: false }; S.creatures.push(c);
    if (setup) setup(S);
    SF.act(S, c); return { S, c };
  };
  let r = hit(10);
  ok(r.S.biomass === 5 && r.S.tiles["0,1"].hp === 2 && r.c.hp === 3, "Siphon supérieur révélé par l'attaque d'une Carapace : biomasse 10 → 5 (3 + 3 par tranche de 10 = 6, plancher 5), puis la Carapace frappe (3 → 2 PV)");
  r = hit(25);
  ok(r.S.biomass === 16 && SF.siphonLoss(1, 25) === 3 && SF.siphonLoss(2, 9) === 2, "biomasse 25 : Siphon supérieur 3 + 3 × 2 = 9 (25 → 16) ; mineur à 25 : 3 ; majeur à 9 : 2");
  r = hit(6);
  ok(r.S.biomass === 5 && SF.MIN_BIOMASS === 5, "biomasse 6 : elle ne descend pas sous 5 (Oni, 07/11/2026 ; avant 3)");
  r = hit(10, S => { S.tiles["0,1"].revealed = true; });
  ok(r.S.biomass === 10, "déjà vu (Vision d'un Œil-sonde) : ne se déclenche pas");
}
// 51. Une tuile encore camouflée ne subit rien de la percée ni des spores, et reste cachée (Oni, 02/11/2026)
{
  const P = (setup, extra) => {
    const T = fresh(); T.supports = {}; for (const k of Object.keys(T.tiles)) delete T.tiles[k];
    setup(T);
    const m = { id: 170, name: "Massacreur", lane: "N", u: 0, k: 4, hp: 1, acted: false }; T.creatures.push(m);
    T.creatures.push({ id: 171, name: extra || "Perforeur", lane: "N", u: 0, k: 4, hp: 6, acted: false });
    const b = T.biomass; SF.actCase(T, SF.posKey(m), [170]); return { T, dBio: T.biomass - b };
  };
  let r = P(T => { T.tiles["0,3"] = SF.tileStats("Antenne", 0, 3); T.tiles["0,2"] = SF.tileStats("Égide", 0, 2); });
  ok(!r.T.tiles["0,3"] && r.T.tiles["0,2"].hp === 2 && !r.T.tiles["0,2"].revealed, "Percée sur une Égide camouflée : aucun dégât, elle reste cachée");
  r = P(T => { T.tiles["0,3"] = SF.tileStats("Antenne", 0, 3); T.tiles["0,2"] = SF.tileStats("Égide", 0, 2); T.tiles["0,2"].revealed = true; });
  ok(!r.T.tiles["0,2"], "Percée sur une Égide déjà révélée : 6 en trop − bouclier 2 = 4 → détruite (3 PV)");
  r = P(T => { T.tiles["0,3"] = SF.tileStats("Antenne", 0, 3); T.tiles["0,2"] = SF.tileStats("Mine supérieure", 0, 2); });
  ok(r.T.tiles["0,2"].hp === 3 && !r.T.tiles["0,2"].revealed && r.T.creatures.some(c => c.id === 170), "Percée sur une Mine camouflée : il ne se déclenche pas et reste caché");
  r = P(T => { T.tiles["0,3"] = SF.tileStats("Antenne", 0, 3); T.tiles["0,2"] = SF.tileStats("Siphon supérieur", 0, 2); });
  ok(r.dBio === 1 && !r.T.tiles["0,2"].revealed, "Percée sur un Siphon camouflé : aucun effet (seulement +1 biomasse pour l'Antenne)");
  r = P(T => { T.tiles["0,3"] = SF.tileStats("Antenne", 0, 3); T.tiles["0,2"] = SF.tileStats("Égide", 0, 2); T.tiles["1,3"] = SF.tileStats("Palissade", 1, 3); T.tiles["1,3"].revealed = true; }, "Sporeur");
  ok(r.T.tiles["0,2"].hp === 2 && !r.T.tiles["0,2"].revealed && !r.T.tiles["1,3"], "Spores : la tuile camouflée voisine ne subit rien, la Palissade révélée (2 PV) tombe sous 2 dégâts");
  const clair = T => { T.upgrades.soutien.r2 = "C"; }; // Clairvoyance (un soutien est en jeu : le Perforeur / le Sporeur)
  r = P(T => { clair(T); T.tiles["0,3"] = SF.tileStats("Antenne", 0, 3); T.tiles["0,2"] = SF.tileStats("Égide", 0, 2); });
  ok(!r.T.tiles["0,2"], "Clairvoyance : l'Égide camouflée devient vulnérable à la percée (4 dégâts après bouclier → détruite)");
  r = P(T => { clair(T); T.tiles["0,3"] = SF.tileStats("Antenne", 0, 3); T.tiles["0,2"] = SF.tileStats("Égide", 0, 2); T.tiles["1,3"] = SF.tileStats("Palissade", 1, 3); }, "Sporeur");
  ok(!r.T.tiles["1,3"], "Clairvoyance : la Palissade camouflée voisine subit les spores (détruite)");
}
// 52. Déplacement : une case par tour, deux avec la Mobilité ; au contact, attaque aussitôt (Oni, 02/11/2026)
{
  const setup = () => { const S = fresh(); S.phase = "A_attack"; S.supports = {}; return S; }; // Barbelé en C1 (0,1)
  const S = setup();
  const c = { id: 180, name: "Béhémoth", lane: "N", u: 0, k: 4, hp: 5, acted: false }; S.creatures.push(c); // niveau 2 (vitesse 1), assez de PV pour survivre aux Épines
  ok(SF.apply(S, "essaim", "act", { key: SF.posKey(c) }) === "" && c.k === 3 && S.tiles["0,1"].hp === 1, "tour 1 : entrée → C3, pas encore au contact, pas d'attaque");
  c.acted = false; S.phase = "A_attack"; // le tour est passé tout seul (plus rien à faire) : on rejoue une phase d'attaque
  SF.apply(S, "essaim", "act", { key: SF.posKey(c) });
  ok(c.k === 2 && !S.tiles["0,1"], "tour 2 : C3 → C2, au contact du Barbelé (couronne 1) : il attaque aussitôt et le détruit");
  c.acted = false; S.phase = "A_attack"; const w = S.workersBase;
  SF.apply(S, "essaim", "act", { key: SF.posKey(c) });
  ok(c.k === 1 && S.workersBase === w - 1, "tour 3 : C2 → C1, au contact de la fusée : −1 travailleur");
  ok(S.killed === 1 && SF.newGame().killed === 0 && SF.newGame().version === SF.VERSION, "statistiques : travailleurs tués comptés (S.killed), version de départ notée (S.version)");
  // après une casse : le bloc qui a déjà bougé ne repart pas
  const T = setup(); T.tiles["0,2"] = SF.tileStats("Palissade", 0, 2); T.tiles["0,2"].revealed = true; T.tiles["0,2"].hp = 1;
  const x = { id: 181, name: "Écorcheur", lane: "N", u: 0, k: 4, hp: 1, acted: false }, y = { id: 182, name: "Écorcheur", lane: "N", u: 0, k: 4, hp: 1, acted: false };
  T.creatures.push(x, y); SF.apply(T, "essaim", "act", { key: SF.posKey(x), order: [181, 182] });
  ok(!T.tiles["0,2"] && x.k === 3 && y.k === 3 && T.tiles["0,1"].hp === 1, "entrée → C3 puis Palissade détruite : le bloc a déjà bougé, il reste en C3 et le 2ᵉ Écorcheur ne frappe pas");
  // Mobilité : les aggros partent devant
  const U = setup(); U.upgrades.aggro.r1 = "B";
  const m = { id: 183, name: "Écorcheur", lane: "N", u: 0, k: 4, hp: 1, acted: false }, t = { id: 184, name: "Carapace", lane: "N", u: 0, k: 4, hp: 3, acted: false };
  U.creatures.push(m, t); SF.apply(U, "essaim", "act", { key: SF.posKey(m) });
  ok(m.k === 2 && t.k === 3 && !U.tiles["0,1"], "Mobilité : l'Écorcheur fait 2 cases (C2) et détruit le Barbelé ; la Carapace ne fait qu'1 case (C3)");
  const V = setup(); V.upgrades.aggro.r1 = "B"; V.tiles["0,2"] = SF.tileStats("Palissade", 0, 2); V.tiles["0,2"].revealed = true; V.tiles["0,2"].hp = 1;
  const p = { id: 185, name: "Écorcheur", lane: "N", u: 0, k: 4, hp: 1, acted: false }, q = { id: 186, name: "Écorcheur", lane: "N", u: 0, k: 4, hp: 1, acted: false };
  V.creatures.push(p, q); SF.apply(V, "essaim", "act", { key: SF.posKey(p), order: [185, 186] });
  ok(!V.tiles["0,2"] && p.k === 2 && !V.tiles["0,1"], "Mobilité : 1 case jusqu'au contact, Palissade détruite, le 2ᵉ déplacement fait entrer le bloc en C2, le 2ᵉ Écorcheur détruit le Barbelé");
}
// 54. Auras (Oni, 02/11/2026) : au profit des autres créatures seulement, toutes cumulables ; Glaneur : Aura Mobilité 1 ;
//     Mue : Furtivité + Aura +1 PV ; Régénération s'ajoute à l'Aura Soin du Glaneur ; Provocation ; Bouclier fondu dans Renforcé
{
  const S = fresh(); S.phase = "A_attack"; S.supports = {};
  const at = (id, name, k = 4, hp = 9) => ({ id, name, lane: "N", u: 0, k, hp, acted: false });
  const e = at(200, "Écorcheur"), g = at(201, "Glaneur"), h = at(202, "Glaneur");
  S.creatures.push(e, g);
  ok(SF.speedOf(S, e) === 1 && SF.speedOf(S, g) === 1, "Glaneur (06/11/2026) : plus d'Aura Mobilité ni de vitesse 2");
  S.creatures.push(h);
  ok(SF.speedOf(S, e) === 1 && SF.speedOf(S, g) === 1, "deux Glaneurs : toujours 1 case");
  S.upgrades.aggro.r1 = "B";
  ok(SF.speedOf(S, e) === 2, "Mobilité des aggros : 1 + 1");
  const T = fresh(); T.phase = "A_attack"; T.supports = {}; // Barbelé en C1
  const x = at(210, "Carapace"), y = at(211, "Glaneur"); T.creatures.push(x, y);
  SF.apply(T, "essaim", "act", { key: SF.posKey(x) });
  ok(x.k === 3 && y.k === 3, "la Carapace et le Glaneur avancent ensemble d'une case");
  // soins cumulés
  const U = fresh(); const t1 = at(220, "Colosse", 4, 1); U.creatures.push(t1, at(221, "Glaneur"), at(222, "Glaneur")); // Colosse : 5 PV max
  U.upgrades.soutien.r2 = "A"; // Régénération : Aura Soin 2 pour chaque soutien
  SF.endAttackerTurn(U);
  ok(t1.hp === 5, "Régénération (11/11/2026) : Aura Soin total, le Colosse sur la case des soutiens remonte à 5 PV (son maximum)");
  const U2 = fresh(); const far = at(225, "Colosse", 3, 1, 1); U2.creatures.push(far, at(226, "Glaneur")); U2.upgrades.soutien.r2 = "A"; SF.endAttackerTurn(U2);
  ok(far.hp === 1, "Soin total : une créature hors de la case d'un soutien n'est pas soignée");
  // Mue : Furtivité + Aura +1 PV aux autres, cumulable ; plus de +1 PV au soutien lui-même
  const V = fresh(); V.upgrades.soutien.r1 = "A";
  const m = at(230, "Écorcheur", 4, 1), s1 = at(231, "Hurleur", 4, 2), s2 = at(232, "Œil-sonde", 4, 2);
  V.creatures.push(m, s1, s2);
  ok(SF.bonusHp(V, m) === 0 && SF.bonusHp(V, s1) === 0 && SF.maxHp(V, "Hurleur") === 4, "Mue et Hurleur : plus aucun PV bonus (11/11/2026)");
  ok(!SF.isStealthy(V, s1) && !SF.isStealthy(V, m), "Mue : plus de Furtivité pour les soutiens (Oni, 05/11/2026)");
  ok(SF.TREES.tank.B1[0] === "Provocation", "tank, côté B : « Provocation » (ancienne Protection)");
  // Bouclier → Renforcé : une ancienne partie est convertie
  const W = fresh(); W.tiles["3,0"] = { name: "Dortoir", hp: 3, max: 3, ep: 0, ren: 0, shield: 2, camo: 1, revealed: false }; SF.migrate(W);
  ok(W.tiles["3,0"].ren === 2 && !("shield" in W.tiles["3,0"]), "partie en cours : Bouclier 2 devient Renforcé 2");
  // Spores cumulables : 2 Sporeurs → 2 dégâts aux tuiles voisines
  const Z = fresh(); Z.supports = {}; for (const k of Object.keys(Z.tiles)) delete Z.tiles[k];
  Z.tiles["0,3"] = SF.tileStats("Antenne", 0, 3); Z.tiles["1,3"] = SF.tileStats("Rempart", 1, 3); Z.tiles["1,3"].revealed = true;
  const a1 = at(240, "Carapace"); Z.creatures.push(a1, at(241, "Sporeur"), at(242, "Sporeur"));
  SF.actCase(Z, SF.posKey(a1), [240]);
  ok(Z.tiles["1,3"].hp === 2, "2 Sporeurs : 2 × 2 = 4 dégâts de spores en une attaque (Rempart, Renforcé 2 : 4 → 2 PV)");
  // Frénésie : au choix, cumulable (Oni, 02/11/2026)
  const F = fresh(); F.phase = "A_attack"; F.upgrades.soutien.r2 = "B";
  const ec = at(250, "Écorcheur"), ca = at(251, "Carapace"), f1 = at(252, "Hurleur"), f2 = at(253, "Œil-sonde");
  F.creatures.push(ec, ca, f1, f2); // Écorcheur 3 (+2 Fureur) ; Carapace 1 (+2 Fureur)
  ok(SF.effAtq(F, ec) === 5 && SF.effAtq(F, ca) === 3, "Frénésie remplacée par Corrosion (09/11/2026) : plus de multiplicateur (Écorcheur 3 + 2 Fureur)");
  ok(SF.apply(F, "essaim", "frenzy", { src: 253, target: 251 }) !== "", "l'action Frénésie est refusée");
  ok(SF.apply(F, "essaim", "frenzy", { src: 253, target: 253 }) !== "" && SF.apply(F, "colonie", "frenzy", { src: 253, target: 250 }) !== "", "pas sur soi-même ; la colonie ne peut pas choisir");
  const G = fresh(); G.phase = "A_attack"; const g1 = at(260, "Hurleur"); G.creatures.push(at(261, "Écorcheur"), g1);
  ok(SF.apply(G, "essaim", "frenzy", { src: 260, target: 261 }) !== "", "sans l'amélioration Frénésie : refusé");
}
// 55. Carapace épaisse : les tanks ne subissent plus les Épines (Oni, v0.5 ; avant : Provocation)
{
  const run = prov => {
    const S = fresh(); S.supports = {}; delete S.tiles["0,1"]; S.tiles["0,1"] = SF.tileStats("Mur hérissé", 0, 1); // Épines 2
    if (prov) S.upgrades.tank.r1 = "A";
    const c = { id: 300, name: "Carapace", lane: "N", u: 0, k: 2, hp: 3, acted: false }, e = { id: 301, name: "Écorcheur", lane: "N", u: 0, k: 2, hp: 5, acted: false };
    S.creatures.push(c, e); SF.actCase(S, SF.posKey(c), [300, 301]); return [c.hp, e.hp];
  };
  ok(run(false).join() === "1,3" && run(true).join() === "3,3", "Carapace épaisse : la Carapace ne subit plus les Épines (3 PV), l'Écorcheur si (5 → 3)");
}
// 56. Départ de l'essaim (Oni, 04/11/2026) : 5 biomasse ; premier tour : une aggro, un tank, un soutien au hasard, payés
//     normalement, à la place de la pioche ; ensuite la pioche normale reprend
{
  const S = SF.newGame();
  ok(S.biomass === 5, "l'essaim commence avec 5 biomasse");
  const n1 = S.piles[1].length;
  ok(SF.apply(S, "essaim", "draw") === "" && S.handA.length === 3, "premier tour : 3 cartes en main");
  ok(["aggro", "tank", "soutien"].every(t => S.handA.filter(c => SF.CREATURES[c.name].type === t).length === 1) && S.handA.every(c => SF.CREATURES[c.name].lvl === 1 && !c.free),
    "une créature de chaque type, de niveau 1, payante : " + S.handA.map(c => c.name).join(", "));
  ok(S.piles[1].length === n1 - 3 && S.budget === 5, "cartes prises dans la pioche de niveau 1 ; budget 5");
  const seen = new Set(); for (let i = 0; i < 40; i++) { const T = SF.newGame(); SF.attackerDraw(T); seen.add(T.handA.find(c => SF.CREATURES[c.name].type === "soutien").name); }
  ok(seen.size >= 2, "le soutien est tiré au hasard (vus : " + [...seen].join(", ") + ")");
  ok(!("startHand" in S), "la main de départ ne sert qu'une fois");
  SF.endDeploy(S); SF.attackerDraw(S);
  ok(S.handA.length === 3 && S.log[0].msg.startsWith("Palier 1"), "tour suivant : pioche normale du palier (3 cartes de niveau 1)");
  // Œil-sonde : Vision permanente sur sa lane, même pour les tuiles posées après lui
  const V = fresh(); V.phase = "D_place"; V.supports = {};
  V.creatures.push({ id: 400, name: "Œil-sonde", lane: "N", u: 0, k: 4, hp: 2 });
  V.toPlace = [{ tile: "Muraille", lane: "N" }, { tile: "Muraille", lane: "E" }];
  const kN = SF.placeTargets(V).find(k => SF.cellLane(...SF.parse(k)) === "N");
  SF.placeTile(V, kN);
  ok(V.tiles[kN].revealed, "Œil-sonde en vie dans la lane Nord : la Muraille posée ensuite est aussitôt révélée");
  const kE = SF.placeTargets(V).find(k => SF.cellLane(...SF.parse(k)) === "E");
  if (kE) { SF.placeTile(V, kE); ok(!V.tiles[kE].revealed, "lane Est (sans Œil-sonde) : la tuile reste cachée"); }
}
// 57. Champ de stase (un bâtiment, Épines suspendues) et Brouillage (la créature ne bouge ni n'attaque) — Oni, 04/11/2026
{
  const mk = () => { const S = fresh(); S.supports = {}; delete S.tiles["0,1"]; S.tiles["0,1"] = SF.tileStats("Mur hérissé", 0, 1); S.tiles["0,1"].revealed = true; return S; };
  const S = mk(); S.phase = "A_react"; S.spells = ["Champ de stase"];
  const c = { id: 500, name: "Ravageur", lane: "N", u: 0, k: 2, hp: 3, acted: false }; S.creatures.push(c);
  ok(SF.apply(S, "colonie", "spell", { i: 0, arg: "N" }) !== "", "Champ de stase : une lane n'est plus une cible valable");
  ok(SF.apply(S, "colonie", "spell", { i: 0, arg: "0,1" }) === "", "Champ de stase sur le Mur hérissé");
  SF.apply(S, "colonie", "reactDone"); SF.apply(S, "essaim", "act", { key: SF.posKey(c) });
  ok(S.tiles["0,1"].hp === 2 && c.hp === 3, "le bâtiment ne perd rien et le Ravageur ne subit pas ses Épines");
  const T = mk(); T.phase = "A_react"; T.spells = ["Brouillage"];
  const d = { id: 510, name: "Écorcheur", lane: "N", u: 0, k: 4, hp: 5, acted: false }, e = { id: 511, name: "Carapace", lane: "N", u: 0, k: 4, hp: 3, acted: false };
  T.creatures.push(d, e);
  ok(SF.apply(T, "colonie", "spell", { i: 0, arg: 510 }) === "", "Brouillage sur une créature qui n'a pas été déployée ce tour");
  SF.apply(T, "colonie", "reactDone"); SF.apply(T, "essaim", "act", { key: SF.posKey(e) });
  ok(d.k === 4 && e.k === 4 && e.jammed, "Brouillage : toute la case est immobilisée (l'Écorcheur et la Carapace ; Oni, 09/11/2026)");
}
// 58. Passage automatique et travailleurs assignés d'office (Oni, 04/11/2026)
{
  const S = fresh(); S.phase = "A_attack"; S.supports = {};
  const c = { id: 600, name: "Carapace", lane: "N", u: 0, k: 4, hp: 3, acted: false }; S.creatures.push(c);
  SF.apply(S, "essaim", "act", { key: SF.posKey(c) });
  ok(S.phase === "D_main" && !SF.ACTIONS.endA.phase.includes(S.phase), "dernière case jouée : le tour passe seul à la colonie");
  const T = fresh(); SF.attackerDraw(T); SF.endDeploy(T); SF.startAttacks(T); SF.endAttackerTurn(T);
  T.hand.unshift("Rempart"); const free = SF.totalPoints(T) - SF.allocated(T);
  SF.apply(T, "colonie", "startCh", { i: 0, lane: "E" });
  ok(T.alloc.E === Math.min(3, free), "Rempart (3 points) lancé à l'Est : " + T.alloc.E + " travailleur(s) assigné(s) d'office (" + free + " libres)");
  T.hand.unshift("Palissade"); SF.apply(T, "colonie", "startCh", { i: 0, lane: "O" });
  ok(SF.allocated(T) <= SF.totalPoints(T), "jamais plus de travailleurs que disponibles");
  SF.apply(T, "colonie", "build"); while (T.phase === "D_place") SF.apply(T, "colonie", "placeAt", { k: SF.placeTargets(T)[0] });
  ok(T.phase !== "D_fire", "aucune créature à portée : pas d'étape de tirs, le tour passe à l'essaim");
}
// 59. Déplacements (Oni, v0.5, 07/11/2026) : chaque créature avance de 1 case à son maximum, au choix, sur son chemin en
//     escalier vers la fusée (jamais en arrière ni sur les côtés) ; elle doit avancer avant d'attaquer si elle le peut ;
//     attaque facultative de n'importe quel bâtiment qui touche sa case par un côté ; plus de mouvement après l'attaque
{
  const S = fresh(); S.phase = "A_attack"; S.supports = {}; // Barbelé en C1 (0,1)
  const c = { id: 800, name: "Écorcheur", lane: "N", u: 0, k: 3, hp: 5, acted: false }, h = { id: 801, name: "Carapace", lane: "N", u: 0, k: 3, hp: 3, acted: false };
  S.creatures.push(c, h);
  const R = SF.reachable(S, c);
  ok(Object.values(R).map(r => r.u + "," + r.k).join(" ") === "0,2", "vitesse 1 : seulement la case suivante du chemin (C2) ; ni retraite ni pas de côté");
  ok(SF.apply(S, "essaim", "move", { id: 800, u: 0, k: 4 }) !== "" && SF.apply(S, "essaim", "move", { id: 800, u: 1, k: 3 }) !== "", "retraite et pas de côté refusés");
  ok(SF.strikeTargets(S, c).length === 0, "pas d'attaque avant d'avoir avancé quand c'est possible");
  ok(SF.apply(S, "essaim", "move", { id: 801, u: 0, k: 1 }) !== "", "pas sur un bâtiment");
  ok(SF.apply(S, "essaim", "move", { id: 801, u: 0, k: 2 }) === "" && SF.strikeTargets(S, h).join() === "0,1", "la Carapace avance en C2 : le Barbelé (C1) est attaquable");
  ok(SF.apply(S, "essaim", "move", { id: 801, u: 0, k: 1 }) !== "", "vitesse 1 : plus de déplacement ce tour");
  ok(S.tiles["0,1"].hp === 1, "l'attaque est facultative : rien ne se passe tant qu'on ne la demande pas");
  ok(SF.apply(S, "essaim", "strike", { id: 801, target: "0,1" }) === "" && !S.tiles["0,1"] && h.acted, "la Carapace attaque et détruit le Barbelé");
  ok(c.k === 2, "l'Écorcheur a avancé avec son bloc en C2 (v0.5.9) ; le Barbelé détruit, il n'a plus rien à faire");
  ok(S.phase === "D_main", "plus aucune créature ne peut agir : le tour passe seul à la colonie");
  // déplacement de moins que le maximum, et cibles sur les 4 côtés
  const T = fresh(); T.phase = "A_attack"; T.supports = {};
  for (const k of Object.keys(T.tiles)) delete T.tiles[k];
  const m = { id: 810, name: "Massacreur", lane: "N", u: 0, k: 4, hp: 1, acted: false, spd: 3 }; T.creatures.push(m);
  ok(Object.keys(SF.reachable(T, m)).length === 3, "vitesse 3 : 3 cases de chemin au choix");
  T.tiles["-1,3"] = SF.tileStats("Muraille", -1, 3); T.tiles["1,3"] = SF.tileStats("Antenne", 1, 3);
  ok(SF.apply(T, "essaim", "move", { id: 810, u: 0, k: 3 }) === "" && m.k === 3, "il s'arrête après 1 case (C3) au lieu de 3");
  ok(SF.strikeTargets(T, m).sort().join() === "-1,3,1,3", "cibles : les bâtiments sur les côtés (B3 et D3), au choix");
  ok(SF.apply(T, "essaim", "move", { id: 810, u: 0, k: 2 }) === "" && m.k === 2, "il peut encore avancer tant qu'il n'a pas attaqué");
  ok(!SF.strikeTargets(T, m).length || SF.strikeTargets(T, m).every(t => t !== "-1,3"), "en C2, la Muraille (B3) ne touche plus sa case");
  SF.apply(T, "essaim", "move", { id: 810, u: 0, k: 1 });
  ok(SF.strikeTargets(T, m).includes("fusee"), "en C1 : la fusée est attaquable");
  // Glaneur : déplacements fixés au premier pas, Mobilité
  const U = fresh(); U.phase = "A_attack"; U.supports = {}; delete U.tiles["0,1"];
  const g = { id: 820, name: "Glaneur", lane: "N", u: 0, k: 4, hp: 2, acted: false }, e = { id: 821, name: "Écorcheur", lane: "N", u: 0, k: 4, hp: 1, acted: false };
  U.creatures.push(g, e);
  U.upgrades.soutien.r1 = "A"; // Mue : le Glaneur (soutien) donne l'Aura Mobilité 1
  ok(SF.stepsLeft(U, e) === 2 && SF.stepsLeft(U, g) === 2, "Mue : l'Écorcheur de la case du Glaneur fait 2 cases, le Glaneur aussi (v0.5)");
  SF.apply(U, "essaim", "move", { id: 821, u: 0, k: 3 });
  ok(SF.stepsLeft(U, e) === 1, "après un pas loin du Glaneur, il lui reste quand même 1 déplacement (fixé au premier pas)");
  // Tout résoudre : l'ancien comportement automatique, créature par créature
  const V = fresh(); V.phase = "A_attack"; V.supports = {};
  const v = { id: 830, name: "Massacreur", lane: "N", u: 0, k: 3, hp: 5, acted: false }; V.creatures.push(v);
  SF.apply(V, "essaim", "actAll");
  ok(v.k === 2 && !V.tiles["0,1"] && V.phase === "D_main", "Tout résoudre : avance d'une case, attaque devant, puis le tour passe");
}
// 60. Clairvoyance : les Œil-sonde sortent de la pioche ; ceux en main ou en jeu ne reviennent plus (Oni, 04/11/2026)
{
  const S = fresh(); S.phase = "A_deploy"; S.budget = 0; S.reserve = 0;
  S.upgrades.soutien.r1 = "A"; S.invest = { "soutien:C2": SF.COST_R2 - 1 };
  S.handA = [{ name: "Œil-sonde", free: false, uid: 900 }];
  const eye = { id: 901, name: "Œil-sonde", lane: "N", u: 0, k: 4, hp: 2, acted: false }; S.creatures.push(eye);
  ok(S.piles[1].includes("Œil-sonde"), "avant : des Œil-sonde dans la pioche de niveau 1");
  S.budget = 1; SF.apply(S, "essaim", "invest", { t: "soutien", s: "C2", n: 1 });
  ok(S.upgrades.soutien.r2 === "C" && !S.piles[1].includes("Œil-sonde"), "Clairvoyance acquise : plus aucun Œil-sonde dans la pioche");
  ok(S.handA.length === 1 && S.creatures.includes(eye), "celui en main et celui sur le plateau restent");
  SF.endDeploy(S);
  ok(!S.piles[1].includes("Œil-sonde"), "la carte non jouée ne revient pas dans la pioche");
  eye.hp = 0; SF.killCheck(S);
  ok(!S.piles[1].includes("Œil-sonde") && S.piles[1].length > 0, "l'Œil-sonde mort ne revient pas non plus ; les autres cartes, si");
}
// 61. Équilibrage du 05/11/2026 (Oni) : Glaneur Aura Soin 2 ; Mue = Aura Mobilité 1 + Aura +1 PV pour tous les soutiens,
//     sans Furtivité ; Mobilité donne la Furtivité aux aggros
{
  const at = (id, name, hp) => ({ id, name, lane: "N", u: 0, k: 4, hp, acted: false });
  const S = fresh(); const c = at(950, "Colosse", 1); S.creatures.push(c, at(951, "Glaneur", 2));
  SF.endAttackerTurn(S);
  ok(c.hp === 3, "Glaneur : Aura Soin 2 (Colosse 1 → 3 PV)");
  const T = fresh(); T.upgrades.soutien.r1 = "A";
  const e = at(960, "Écorcheur", 1), h = at(961, "Hurleur", 2), o = at(962, "Œil-sonde", 2); T.creatures.push(e, h, o);
  ok(SF.speedOf(T, e) === 3 && SF.speedOf(T, h) === 3, "Mue : chaque soutien donne +1 case à sa case, lui compris (Écorcheur 1 + 2 = 3, Hurleur 1 + 2 = 3)");
  ok(SF.bonusHp(T, e) === 0 && !SF.isStealthy(T, h), "Mue : plus d'Aura +1 PV (Échappée, 11/11/2026)");
  const G = fresh(); G.upgrades.soutien.r1 = "A"; const x = at(970, "Carapace", 3); G.creatures.push(x, at(971, "Glaneur", 2));
  ok(SF.speedOf(G, x) === 2, "Glaneur avec la Mue : une seule Aura Mobilité (+1), celle de la Mue");
  const U = fresh(); U.upgrades.aggro.r1 = "B"; const a = at(980, "Ravageur", 1), t = at(981, "Béhémoth", 5); U.creatures.push(a, t);
  ok(!SF.isStealthy(U, a) && SF.speedOf(U, a) === 2 && SF.speedOf(U, t) === 1, "Mobilité (v0.5) : +1 déplacement pour les aggros, plus de Furtivité");
  ok(SF.targetable(U, a) && SF.targetable(U, t), "le Ravageur et le Béhémoth peuvent être visés");
}
// 62. Oni, 06/11/2026 : déplacement automatique au choix de la créature (action actOne) ; support de niveau 3 : +3 travailleurs
{
  const S = fresh(); S.phase = "A_attack";
  const a = { id: 990, name: "Écorcheur", lane: "N", u: -2, k: 4, hp: 1, acted: false }, b = { id: 991, name: "Écorcheur", lane: "N", u: 2, k: 4, hp: 1, acted: false };
  S.creatures.push(a, b);
  ok(SF.apply(S, "essaim", "actOne", { id: 990 }) === "", "actOne : la créature choisie agit");
  ok(a.k === 3 && a.u === -2 && !b.moved && b.k === 4, "elle avance seule d'une case sur son chemin (A4 → A3) ; l'autre n'a pas bougé");
  ok(SF.apply(S, "essaim", "actOne", { id: 990 }) !== "", "une créature qui a déjà agi ne peut pas agir une seconde fois");
  ok(SF.SUP3_WORKERS === 2, "support de niveau 3 : +2 travailleurs (retour du 06/11 au soir)");
}
// 63. Oni, 06/11/2026 : créatures de niveau 3 à 2 cases de base ; déploiement et améliorations dans la même étape
{
  const S = fresh();
  const at = (id, name) => ({ id, name, lane: "N", u: 0, k: 4, hp: 6, acted: false });
  const m = at(995, "Massacreur"), b = at(996, "Béhémoth"), g = at(997, "Glaneur");
  S.creatures.push(m); ok(SF.speedOf(S, m) === 2, "Massacreur (niveau 3) : 2 cases de base");
  const T = fresh(); T.creatures.push(b); ok(SF.speedOf(T, b) === 1, "Béhémoth (niveau 2) : 1 case");
  const U = fresh(); U.upgrades.aggro.r1 = "B"; const m2 = at(998, "Massacreur"); U.creatures.push(m2); ok(SF.speedOf(U, m2) === 3, "Massacreur avec la Mobilité : 2 + 1 = 3 cases");
  const V = fresh(); SF.apply(V, "essaim", "draw"); V.reserve = 2;
  ok(V.phase === "A_deploy" && SF.apply(V, "essaim", "invest", { t: "aggro", s: "A1", n: 99 }) === "", "améliorations possibles pendant le déploiement");
  V.creatures.push(at(999, "Carapace"));
  ok(SF.apply(V, "essaim", "endDeploy") === "" && ["A_attack", "A_react"].includes(V.phase), "fin de l'étape : directement aux attaques");
}
// 64. Oni, 06/11/2026 (soir) : « Tout résoudre » fait agir les soutiens d'abord ; les créatures de leur case de départ
//     les rejoignent et profitent de leurs auras en attaquant
{
  const S = fresh(); S.phase = "A_attack"; S.supports = {}; delete S.tiles["0,1"];
  S.tiles["0,2"] = { ...SF.tileStats("Muraille", 0, 2), hp: 20, max: 20, ren: 0, ep: 0 }; // C2 : cible solide, sans Renforcé ni Épines
  const e = { id: 1990, name: "Écorcheur", lane: "N", u: 0, k: 4, hp: 9, acted: false }, h = { id: 1991, name: "Hurleur", lane: "N", u: 0, k: 4, hp: 9, acted: false };
  S.creatures.push(e, h); // l'Écorcheur est le premier de la liste : sans la règle, il partirait seul
  const atq = SF.effAtq(S, e); // 1 + Fureur tant que le Hurleur est sur sa case
  SF.apply(S, "essaim", "actAll");
  ok(h.k === 3 && e.k === 3 && S.tiles["0,2"].hp === 20 - atq, "le Hurleur avance d'abord en C3, l'Écorcheur le rejoint et frappe avec l'Aura Fureur (" + atq + " dégâts)");
}
// 65. v0.5 (Oni, 07/11/2026) : pioche au choix, soutiens parachutés, Carnage, Champ de stase, Provocation, Réincarnation,
//     coûts, main de départ sans Œil-sonde
{
  const at = (id, name, k, hp, more) => Object.assign({ id, name, lane: "N", u: 0, k, hp, acted: false }, more || {});
  ok(SF.CREATURES["Colosse"].cost === 6 && SF.CREATURES["Massacreur"].cost === 6, "Colosse et Massacreur coûtent 6");
  ok(SF.CREATURES["Catalyseur"].lvl === 1 && SF.CREATURES["Catalyseur"].pv === 2 && SF.CREATURES["Hurleur"].lvl === 2 && SF.CREATURES["Hurleur"].pv === 4,
    "Catalyseur niveau 1 (0/2), Hurleur niveau 2 (0/4)");
  // main de départ : jamais d'Œil-sonde
  let eye = 0; for (let i = 0; i < 60; i++) { const T = SF.newGame(); SF.attackerDraw(T); if (T.handA.some(c => c.name === "Œil-sonde")) eye++; }
  ok(eye === 0, "main de départ : jamais d'Œil-sonde (60 essais)");
  // pioche au choix : palier 1 = 3 cartes de niveau 1, au choix
  const P = fresh();
  ok(SF.pickRule(P).total === 3 && SF.pickRule(P).levels.join() === "1", "palier 1 : 3 cartes ; seule la pile de niveau 1 a des cartes");
  ok(SF.apply(P, "essaim", "pick", { n: [4, 0, 0] }) !== "", "plus de cartes que le palier : refusé");
  P.piles[2] = ["Ravageur", "Ravageur"];
  ok(SF.apply(P, "essaim", "pick", { n: [2, 1, 0] }) === "" && P.handA.filter(c => SF.CREATURES[c.name].lvl === 2).length === 1, "palier 1 : la pile de niveau 2 est permise dès qu'elle a des cartes (Oni, 07/11/2026)");
  P.phase = "A_start"; P.handA = [];
  ok(SF.apply(P, "essaim", "pick", { n: [2, 0, 0] }) !== "", "moins de cartes que le palier : refusé (Oni, 07/11/2026)");
  const n1 = P.piles[1].length, top = P.piles[1].slice(-3).reverse();
  ok(SF.apply(P, "essaim", "pick", { n: [3, 0, 0] }) === "" && P.handA.map(c => c.name).join() === top.join() && P.phase === "A_deploy" && P.piles[1].length === n1 - 3,
    "exactement 3 cartes : celles du dessus de la pile de niveau 1 (au hasard), étape de déploiement");
  const R = fresh(); R.piles[1] = R.piles[1].slice(0, 2);
  ok(SF.pickRule(R).total === 2 && SF.apply(R, "essaim", "pick", { n: [2, 0, 0] }) === "", "pile presque vide : le total baisse au nombre de cartes disponibles (2)");
  const Q = fresh(); Q.biomass = 9; Q.piles[2] = ["Ravageur"];
  ok(SF.pickRule(Q).total === 5 && SF.pickRule(Q).levels.join() === "1,2", "palier 2 : 5 cartes, piles 1 et 2 non vides");
  ok(SF.apply(Q, "essaim", "pick", { n: [0, 2, 0] }) !== "", "pas plus de cartes que la pile n'en contient");
  ok(SF.apply(Q, "essaim", "pick", { n: [4, 1, 0] }) === "" && Q.handA.length === 5 && Q.handA.filter(c => SF.CREATURES[c.name].lvl === 2).length === 1, "répartition libre : 4 du niveau 1, 1 du niveau 2");
  const V = SF.viewFor(Q, "essaim");
  ok([1, 2, 3].every(l => V.piles[l].every(x => x === null)), "l'essaim ne voit que le nombre de cartes de ses piles");
  // parachutage : un soutien sur une case libre de sa lane, pas une aggro ; limite de population
  const D = fresh(); D.phase = "A_deploy"; D.budget = 20; D.supports = {};
  D.handA = [{ name: "Glaneur", free: false, uid: 1 }, { name: "Écorcheur", free: false, uid: 2 }, { name: "Glaneur", free: false, uid: 3 }];
  ok(SF.apply(D, "essaim", "deploy", { uid: 2, lane: "N", u: 0, k: 2 }) !== "", "une aggro ne se parachute pas");
  ok(SF.apply(D, "essaim", "deploy", { uid: 1, lane: "N", u: 0, k: 1 }) !== "", "pas sur un bâtiment (Barbelé en C1)");
  ok(SF.apply(D, "essaim", "deploy", { uid: 1, lane: "N", u: 0, k: 2 }) === "" && D.creatures.some(c => c.name === "Glaneur" && c.k === 2 && c.u === 0), "Glaneur parachuté en C2");
  D.creatures = D.creatures.concat(Array.from({ length: SF.capOf(D) }, (_, j) => at(70 + j, "Carapace", 4, 3)));
  ok(SF.apply(D, "essaim", "deploy", { uid: 3, lane: "N", u: 1, k: 2 }) !== "", "lane pleine : parachutage refusé");
  // Carnage : les aggros attaquent 2 fois
  const C = fresh(); C.phase = "A_attack"; C.supports = {}; C.upgrades.aggro.r2 = "A";
  for (const k of Object.keys(C.tiles)) delete C.tiles[k];
  C.tiles["0,1"] = SF.tileStats("Muraille", 0, 1); Object.assign(C.tiles["0,1"], { revealed: true, ep: 0, ren: 0, hp: 20, max: 20 });
  const hp0 = C.tiles["0,1"].hp, e = at(80, "Écorcheur", 2, 5, { moved: 1 }); C.creatures.push(e, at(81, "Carapace", 4, 3));
  ok(SF.apply(C, "essaim", "strike", { id: 80, target: "0,1" }) === "" && !e.acted, "Carnage : après une attaque, l'aggro peut encore frapper");
  ok(SF.apply(C, "essaim", "strike", { id: 80, target: "0,1" }) === "" && e.acted && C.tiles["0,1"].hp === hp0 - 6, "2ᵉ attaque : 2 × 3 dégâts, puis plus rien");
  ok(SF.effAtq(C, e) === 3, "Carnage ne donne plus +2 ATQ");
  const K = fresh(); K.phase = "A_attack"; K.supports = {}; K.upgrades.aggro.r2 = "A";
  for (const k of Object.keys(K.tiles)) delete K.tiles[k];
  K.tiles["0,2"] = Object.assign(SF.tileStats("Antenne", 0, 2), { hp: 1, max: 1, ep: 0, ren: 0, camo: 0, revealed: true });
  const kk = at(85, "Écorcheur", 3, 5); K.creatures.push(kk, at(86, "Carapace", 4, 3));
  ok(SF.apply(K, "essaim", "strike", { id: 85, target: "0,2" }) === "" && !K.tiles["0,2"], "Carnage : la 1ʳᵉ attaque détruit le bâtiment devant (chemin libéré)");
  ok(SF.pathCells(K, kk).length === 0 && !SF.canAct(K, kk) && SF.apply(K, "essaim", "move", { id: 85, u: 0, k: 2 }) !== "", "après une attaque, plus de déplacement : rien d'autre à faire pour elle");
  // Champ de stase : 0 dégât au bâtiment, mais percée de toute l'attaque et spores
  const Z = fresh(); Z.phase = "A_attack"; Z.supports = {}; for (const k of Object.keys(Z.tiles)) delete Z.tiles[k];
  Z.tiles["0,2"] = SF.tileStats("Antenne", 0, 2); Z.tiles["0,1"] = SF.tileStats("Antenne", 0, 1); Z.tiles["1,2"] = SF.tileStats("Antenne", 1, 2);
  for (const k of ["0,2", "0,1", "1,2"]) { Z.tiles[k].revealed = true; Z.tiles[k].ep = 0; }
  Z.stase = ["0,2"];
  const z = at(90, "Écorcheur", 3, 5, { moved: 1 }); Z.creatures.push(z, at(91, "Perforeur", 3, 4), at(92, "Sporeur", 3, 6));
  const hpA = Z.tiles["0,1"].hp, hpB = Z.tiles["1,2"].hp;
  SF.apply(Z, "essaim", "strike", { id: 90, target: "0,2" });
  ok(Z.tiles["0,2"].hp === SF.tileStats("Antenne", 0, 2).hp, "stase : le bâtiment ne perd rien");
  ok(!Z.tiles["0,1"] || Z.tiles["0,1"].hp < hpA, "stase : toute l'attaque passe en percée à la case suivante (C1)");
  ok(!Z.tiles["1,2"] || Z.tiles["1,2"].hp < hpB, "stase : les spores touchent les tuiles voisines (D2)");
  // Provocation : −1 dégât des tourelles pour les tanks
  const shot = prov => { const T = fresh(); T.phase = "D_fire"; T.firedSupports = []; if (prov) T.upgrades.tank.r1 = "B";
    const sk = Object.keys(T.supports).find(k => T.supports[k] === 1); const [x, y] = SF.parse(sk);
    const [lane] = ["N", "E", "S", "O"].filter(l => SF.cellLane(x, y) === l);
    const t = { id: 95, name: "Colosse", lane: lane || SF.cellLane(x, y), u: 0, k: 4, hp: 7, acted: false };
    // place le Colosse sur une case voisine du support
    T.creatures.push(t);
    const cands = []; for (const l of ["N", "E", "S", "O"]) for (let u = -2; u <= 2; u++) for (let k = 1; k <= 4; k++) cands.push([l, u, k]);
    const spot = cands.find(([l, u, k]) => { t.lane = l; t.u = u; t.k = k; return SF.supportTargets(T, sk).includes(t); });
    if (!spot) return null;
    SF.fire(T, sk, 95); return 7 - t.hp; };
  ok(shot(false) === 1 && shot(true) === 0, "Provocation : la tourelle de niveau 1 fait 1 dégât au Colosse, 0 avec Provocation");
  // Réincarnation : le tank revient là où il est mort
    const R2 = fresh(); R2.supports = {}; R2.upgrades.tank.r2 = "C"; R2.creatures.push(at(98, "Carapace", 2, 0)); SF.killCheck(R2);
  ok(R2.reincQueue.length === 1 && R2.reincQueue[0].k === 2, "Réincarnation : la case de la mort est notée (C2)");
}
// 66. Colonie (Oni, 07/11/2026) : Abri blindé et Bouclier ; Mines et Siphons ; trois pioches ; pioche carte par carte
{
  ok(["Palissade", "Muraille", "Rempart", "Bastion", "Égide", "Haie d'épines", "Mur hérissé", "Ronceraie", "Ligne de front", "Réduit"].every(n => SF.tileCat(n) === "renfort")
    && ["Antenne", "Laboratoire", "Observatoire", "Archives", "Baraquement", "Dortoir", "Avant-poste du Nord", "Abri blindé"].every(n => SF.tileCat(n) === "actif")
    && ["Mine mineure", "Mine majeure", "Mine supérieure", "Siphon mineur", "Siphon majeur", "Siphon supérieur"].every(n => SF.tileCat(n) === "piege"),
    "catégories : renforts (dont les tuiles à Épines), actifs (face visible), pièges");
  const A = SF.TILES["Abri blindé"];
  ok(A.d === 2 && A.pv === 2 && A.temp === 1 && A.shield && !A.camo && A.n === 3, "Abri blindé : 2 points, 2 PV, +1 travailleur, Bouclier, face visible, 3 exemplaires");
  // Bouclier : la prochaine attaque ne fait rien (la percée passe, pas d'Épines), puis le jeton est défaussé
  const S = fresh(); S.supports = {}; for (const k of Object.keys(S.tiles)) delete S.tiles[k];
  S.tiles["0,2"] = SF.tileStats("Abri blindé", 0, 2); S.tiles["0,1"] = SF.tileStats("Antenne", 0, 1);
  S.tiles["1,2"] = SF.tileStats("Avant-poste de l'Est", 1, 2); // Aura d'épines : l'Abri a Épines 1
  ok(S.tiles["0,2"].shield === 1 && SF.epinesOf(S, "0,2") === 1, "l'Abri arrive avec son jeton Bouclier");
  const e = { id: 700, name: "Écorcheur", lane: "N", u: 0, k: 3, hp: 5, acted: false, moved: 1 };
  S.creatures.push(e, { id: 701, name: "Perforeur", lane: "N", u: 0, k: 3, hp: 4, acted: false });
  S.phase = "A_attack";
  ok(SF.apply(S, "essaim", "strike", { id: 700, target: "0,2" }) === "", "attaque de l'Écorcheur (3 dégâts, percée) sur l'Abri");
  ok(S.tiles["0,2"].hp === 2 && !S.tiles["0,2"].shield && e.hp === 4, "Bouclier : aucun dégât, jeton défaussé ; les Épines s'appliquent quand même (5 → 4, 09/11/2026)");
  ok(!S.tiles["0,1"], "comme en stase : toute l'attaque passe en percée (l'Antenne derrière tombe)");
  delete S.tiles["1,2"];
  const S2 = JSON.parse(JSON.stringify(S)); S2.phase = "A_attack"; S2.creatures[0].acted = false; S2.creatures[0].struck = 0;
  SF.apply(S2, "essaim", "strike", { id: 700, target: "0,2" });
  ok(!S2.tiles["0,2"], "sans jeton, la 2ᵉ attaque le détruit");
  const Z = fresh(); Z.supports = {}; for (const k of Object.keys(Z.tiles)) delete Z.tiles[k]; Z.phase = "A_attack";
  Z.tiles["0,2"] = Object.assign(SF.tileStats("Antenne", 0, 2), { hp: 5, max: 5 }); Z.tiles["1,2"] = SF.tileStats("Abri blindé", 1, 2);
  Z.creatures.push({ id: 710, name: "Écorcheur", lane: "N", u: 0, k: 3, hp: 5, acted: false, moved: 1 }, { id: 711, name: "Sporeur", lane: "N", u: 0, k: 3, hp: 6, acted: false });
  SF.apply(Z, "essaim", "strike", { id: 710, target: "0,2" });
  ok(Z.tiles["1,2"].hp === 2 && !Z.tiles["1,2"].shield, "spores sur un Abri blindé voisin : aucun dégât, le jeton est défaussé");
  // pioche carte par carte au début du tour de la colonie
  const G = SF.newGame(); SF.apply(G, "essaim", "draw"); SF.apply(G, "essaim", "endDeploy"); if (G.phase === "A_react") SF.apply(G, "colonie", "reactDone");
  if (G.phase === "A_attack") SF.apply(G, "essaim", "actAll");
  ok(G.phase === "D_draw" && G.hand.length === 0, "début du tour de la colonie : étape de pioche (main vide au premier tour)");
  ok(SF.apply(G, "colonie", "build") !== "" && SF.apply(G, "colonie", "tdraw", { cat: "autre" }) !== "", "construire ou piocher dans une pioche inconnue : refusé");
  ok(SF.apply(G, "colonie", "tdraw", { cat: "piege" }) === "" && SF.tileCat(G.hand[0]) === "piege", "1ʳᵉ tuile : un piège");
  SF.apply(G, "colonie", "tdraw", { cat: "actif" }); SF.apply(G, "colonie", "tdraw", { cat: "renfort" });
  ok(G.phase === "D_draw" && SF.tileCat(G.hand[1]) === "actif" && SF.tileCat(G.hand[2]) === "renfort", "chaque tuile vient de la pioche choisie");
  SF.apply(G, "colonie", "tdraw", { cat: "renfort" });
  ok(G.phase === "D_main" && G.hand.length === 4 && SF.apply(G, "colonie", "tdraw", { cat: "renfort" }) !== "", "main pleine (4) : on passe à la construction, plus de pioche");
  // Renouvellement : chaque tuile est remplacée par une tuile de la même pioche
  G.spells = ["Renouvellement"]; SF.apply(G, "colonie", "spell", { i: 0, arg: [0] });
  ok(G.hand.length === 4 && SF.tileCat(G.hand[3]) === "piege", "Renouvellement : le piège défaussé est remplacé par un piège");
  // anciennes parties : Piège et Siphon renommés, pioche unique répartie en trois
  const O = { tiles: { "0,2": { name: "Piège", hp: 2, max: 2, trap: 1, camo: 1 } }, tileDeck: ["Muraille", "Siphon", "Antenne"], tileDiscard: ["Piège"], hand: ["Siphon"], chantiers: { N: [{ tile: "Piège", left: 1 }], E: [], S: [], O: [] }, toPlace: [] };
  SF.migrate(O);
  ok(O.tiles["0,2"].name === "Mine supérieure" && O.hand[0] === "Siphon supérieur" && O.chantiers.N[0].tile === "Mine supérieure" && !O.tileDeck
    && O.tileDecks.renfort.includes("Muraille") && O.tileDecks.actif.includes("Antenne") && O.tileDecks.piege.includes("Siphon supérieur") && O.tileDiscards.piege.join() === "Mine supérieure"
    && O.tileDecks.actif.filter(n => n === "Abri blindé").length === 3 && O.tileDecks.piege.includes("Mine mineure"),
    "ancienne partie : Piège → Mine supérieure, Siphon → Siphon supérieur, trois pioches, nouvelles tuiles ajoutées");
  const AB = { tiles: { "0,2": Object.assign(SF.tileStats("Abri blindé", 0, 2)) }, tileDecks: { renfort: [], actif: [], piege: [] }, tileDiscards: { renfort: [], actif: [], piege: [] }, hand: [] };
  SF.migrate(AB);
  ok(AB.tiles["0,2"].shield === 1 && !AB.tiles["0,2"].ren, "rechargement : le jeton Bouclier de l'Abri reste un Bouclier");
}
// 68. Oni, 08/11/2026 : PV bonus perdus = seul le maximum baisse ; spores sur les 8 cases autour, fusée comprise
{
  const at = (id, name, k, hp, u = 0) => ({ id, name, lane: "N", u, k, hp, acted: false });
  // Échappée (Mue, jetons depuis le 12/11/2026) : chaque soutien sauve une seule créature (la créature recule d'une case avec 1 PV), puis son jeton est défaussé
  const S = fresh(); S.supports = {}; for (const k of Object.keys(S.tiles)) delete S.tiles[k]; S.upgrades.soutien.r1 = "A";
  const e1 = at(1, "Écorcheur", 2, 0), e2 = at(2, "Écorcheur", 2, 0), g = at(3, "Glaneur", 2, 2); g.esc = 1;
  S.creatures.push(e1, e2, g); SF.killCheck(S);
  ok(S.creatures.includes(e1) && e1.hp === 1 && e1.k === 3 && !S.creatures.includes(e2) && g.esc === 0, "Échappée : le soutien sauve la 1ʳᵉ (recule en couronne 3, 1 PV), son jeton est défaussé, la 2ᵉ meurt");
  const S2 = fresh(); S2.supports = {}; for (const k of Object.keys(S2.tiles)) delete S2.tiles[k]; S2.upgrades.soutien.r1 = "A";
  const f1 = at(4, "Écorcheur", 2, 0), f2 = at(5, "Écorcheur", 2, 0), h1 = at(6, "Glaneur", 2, 2), h2 = at(7, "Œil-sonde", 2, 2); h1.esc = 1; h2.esc = 1;
  S2.creatures.push(f1, f2, h1, h2); SF.killCheck(S2);
  ok(S2.creatures.includes(f1) && S2.creatures.includes(f2) && !h1.esc && !h2.esc, "deux soutiens avec chacun un jeton : deux créatures sauvées");
  const T = fresh(); T.supports = {}; const lone = at(10, "Écorcheur", 2, 0); T.upgrades.soutien.r1 = "A"; T.creatures.push(lone); SF.killCheck(T);
  ok(!T.creatures.includes(lone), "sans soutien sur sa case, pas d'Échappée");
  // spores : 8 cases, toutes lanes, fusée comprise
  const Z = fresh(); Z.supports = {}; for (const k of Object.keys(Z.tiles)) delete Z.tiles[k]; Z.phase = "A_attack";
  for (const k of ["0,1", "1,2", "-1,0"]) { const [x, y] = SF.parse(k); Z.tiles[k] = Object.assign(SF.tileStats("Muraille", x, y), { revealed: true }); }
  Z.creatures.push(Object.assign(at(20, "Écorcheur", 2, 5), { moved: 1 }), at(21, "Sporeur", 2, 6)); // en C2, contre le bâtiment C1
  const w = Z.workersBase;
  ok(SF.apply(Z, "essaim", "strike", { id: 20, target: "0,1" }) === "", "attaque du bâtiment C1 avec un Sporeur dans la case");
  ok(Z.workersBase === w - 1, "spores : la fusée derrière le bâtiment de la couronne 1 est touchée, −1 travailleur");
  ok(Z.tiles["1,2"].hp === 2 && Z.tiles["-1,0"].hp === 2, "spores : les cases en diagonale (D2) et sur une autre lane (Ouest) sont touchées aussi");
  const R = fresh(); R.supports = {}; for (const k of Object.keys(R.tiles)) delete R.tiles[k]; R.phase = "A_attack";
  R.tiles["1,0"] = Object.assign(SF.tileStats("Muraille", 1, 0), { revealed: true });
  R.creatures.push(Object.assign(at(30, "Écorcheur", 1, 5), { moved: 1 }), at(31, "Sporeur", 1, 6));
  const w2 = R.workersBase;
  ok(SF.apply(R, "essaim", "strike", { id: 30, target: "fusee" }) === "" && R.workersBase === w2 - 1 && R.tiles["1,0"].hp === 2,
    "attaque de la fusée avec un Sporeur : −1 travailleur, et les spores touchent le bâtiment voisin de la fusée (lane Est)");
}
// 69. Férocité donne la Furtivité aux aggros (Oni, 08/11/2026)
{
  const S = fresh(); S.upgrades.aggro.r1 = "A";
  const a = { id: 1, name: "Écorcheur", lane: "N", u: 0, k: 3, hp: 2 }, t = { id: 2, name: "Carapace", lane: "N", u: 0, k: 3, hp: 3 };
  S.creatures.push(a, t);
  ok(SF.isStealthy(S, a) && !SF.isStealthy(S, t) && SF.effAtq(S, a) === 4, "Férocité : +1 ATQ et Furtivité pour l'aggro, pas pour le tank");
  ok(!SF.targetable(S, a) && SF.targetable(S, t), "l'Écorcheur ne peut pas être visé tant que la Carapace est sur sa case");
  S.creatures.pop();
  ok(SF.targetable(S, a), "seul sur sa case, il redevient une cible");
}
// 70. Oni, 08/11/2026 : Hurleur +1 ATQ +1 PV ; Griffes donne l'Aura Mobilité 1 ; Déploiement téléporte une aggro ;
//     pioche de l'essaim carte par carte
{
  const at = (id, name, k, hp, u = 0) => ({ id, name, lane: "N", u, k, hp, acted: false });
  const S = fresh(); const e = at(1, "Écorcheur", 4, 1), h = at(2, "Hurleur", 4, 4); S.creatures.push(e, h);
  ok(SF.effAtq(S, e) === 5 && SF.bonusHp(S, e) === 0, "Hurleur (11/11/2026) : +2 ATQ aux autres créatures de sa case, plus de PV");
  const G = fresh(); G.upgrades.soutien.r1 = "B"; const c = at(3, "Carapace", 4, 3), g = at(4, "Glaneur", 4, 2); G.creatures.push(c, g);
  ok(SF.speedOf(G, c) === 2 && SF.speedOf(G, g) === 2 && SF.effAtq(G, c) === 1, "Griffes : Aura Mobilité 1 (soutien compris), plus d'ATQ");
  const T = fresh(); T.phase = "A_deploy"; T.upgrades.aggro.r2 = "C"; const a = at(5, "Ravageur", 2, 1), t = at(6, "Carapace", 2, 3); T.creatures.push(a, t);
  ok(SF.apply(T, "essaim", "teleport", { id: 6, lane: "E", u: 0 }) !== "", "téléportation : une aggro seulement");
  ok(SF.apply(T, "essaim", "teleport", { id: 5, lane: "E", u: 1 }) === "" && a.lane === "E" && a.u === 1 && a.k === 4, "le Ravageur est redéployé à l'entrée de la lane Est, colonne D");
  ok(SF.apply(T, "essaim", "teleport", { id: 5, lane: "S", u: 0 }) !== "", "une seule fois par tour");
  const N = fresh(); N.upgrades.aggro.r2 = null; N.phase = "A_deploy"; N.creatures.push(at(7, "Écorcheur", 3, 1));
  ok(SF.apply(N, "essaim", "teleport", { id: 7, lane: "E", u: 0 }) !== "", "sans l'amélioration Déploiement : refusé");
  const P = fresh(); P.biomass = 9; P.piles[2] = ["Ravageur", "Béhémoth"];
  ok(SF.apply(P, "essaim", "pickOne", { l: 2 }) === "" && P.phase === "A_start" && P.handA.length === 1 && P.pickTotal === 5, "1ʳᵉ carte piochée dans la pile 2 ; total du palier fixé (5)");
  ok(SF.apply(P, "essaim", "pickOne", { l: 3 }) !== "", "pile vide : refusé");
  for (let i = 0; i < 4; i++) SF.apply(P, "essaim", "pickOne", { l: 1 });
  ok(P.phase === "A_deploy" && P.handA.length === 5 && !("pickTotal" in P), "5 cartes : étape de déploiement");
}
// 71. Construction immédiate (Oni, 08/11/2026 ; remplace les ateliers) : on paie d'un coup et on pose aussitôt ;
//     un bâtiment par lane et par tour (2 au palier 6) ; les points restants vont à la fusée
{
  const S = fresh(); SF.attackerDraw(S); SF.endDeploy(S); SF.startAttacks(S); SF.endAttackerTurn(S);
  S.round = 2; S.turnPts = S.workersBase; // hors premier tour (un seul bâtiment au total, test 72)
  ok(S.phase === "D_main" && S.turnPts === 3 && SF.pointsLeft(S) === 3, "début du tour : 3 points de construction");
  S.hand = ["Muraille", "Palissade", "Bastion", "Antenne"];
  const t = SF.buildTargets(S, 0);
  ok(t.length > 0 && t.every(k => SF.ring(...SF.parse(k)) >= 1), "Muraille (2 points) : des cases valables sont proposées");
  const kN = t.find(k => SF.cellLane(...SF.parse(k)) === "N");
  ok(SF.apply(S, "colonie", "buildAt", { i: 0, k: kN }) === "" && S.tiles[kN].name === "Muraille" && SF.pointsLeft(S) === 1 && S.hand.length === 3, "Muraille posée aussitôt en lane Nord, 2 points payés (reste 1)");
  const k2 = SF.buildTargets(S, 0).find(k => SF.cellLane(...SF.parse(k)) === "N");
  ok(!k2, "un seul bâtiment par lane et par tour");
  ok(SF.buildTargets(S, 1).length === 0, "Bastion (3 points) : trop cher avec 1 point restant");
  const kE = SF.buildTargets(S, 0).find(k => SF.cellLane(...SF.parse(k)) === "E");
  ok(SF.apply(S, "colonie", "buildAt", { i: 0, k: kE }) === "" && SF.pointsLeft(S) === 0, "Palissade (1 point) en lane Est");
  S.hand.push("Baraquement"); const w = S.workersBase;
  SF.apply(S, "colonie", "build");
  ok(S.rocketPts + S.floors * 2 === 0 && S.workersBase === w, "fin de la construction : aucun point restant, rien pour la fusée");
  const R = fresh(); SF.attackerDraw(R); SF.endDeploy(R); SF.startAttacks(R); SF.endAttackerTurn(R);
  R.hand = ["Baraquement"]; const kb = SF.buildTargets(R, 0)[0];
  SF.apply(R, "colonie", "buildAt", { i: 0, k: kb });
  ok(SF.pointsLeft(R) === 2, "le +1 travailleur du Baraquement posé ce tour ne compte qu'au tour suivant");
  SF.apply(R, "colonie", "build");
  ok(R.floors === 1, "les 2 points restants vont à la fusée (1 étage)");
}
// 72. Blocs (Oni, 08/11/2026) : les créatures d'une case avancent ensemble, de la vitesse du plus lent ; les plus
//     rapides finissent seules ; les auras de mobilité sont comptées avant le départ
{
  const at = (id, name, k, hp) => ({ id, name, lane: "N", u: 0, k, hp, acted: false });
  const S = fresh(); S.supports = {}; for (const k of Object.keys(S.tiles)) delete S.tiles[k]; S.phase = "A_attack";
  S.upgrades.soutien.r1 = "A"; // Mue : Aura Mobilité 1 par soutien, le soutien compris
  const g1 = at(1, "Glaneur", 4, 2), g2 = at(2, "Œil-sonde", 4, 2), e = at(3, "Écorcheur", 4, 1), c = at(4, "Carapace", 4, 3);
  S.creatures.push(g1, g2, e, c);
  ok(Object.keys(SF.reachable(S, e)).length === 3, "bloc de 4 : vitesse 3 pour tous (1 + 2 soutiens), 3 cases possibles");
  ok(SF.apply(S, "essaim", "move", { id: 3, u: 0, k: 1 }) === "" && [g1, g2, e, c].every(o => o.k === 1), "le bloc entier avance ensemble jusqu'en C1");
  const T = fresh(); T.supports = {}; for (const k of Object.keys(T.tiles)) delete T.tiles[k]; T.phase = "A_attack";
  const m = at(10, "Massacreur", 4, 1), t = at(11, "Carapace", 4, 3); T.creatures.push(m, t); // vitesses 2 et 1
  ok(Object.keys(SF.reachable(T, m)).length === 1, "Massacreur (2) avec une Carapace (1) : le bloc n'avance que d'une case");
  SF.apply(T, "essaim", "move", { id: 10, u: 0, k: 3 });
  ok(m.k === 3 && t.k === 3 && Object.keys(SF.reachable(T, m)).length === 1 && Object.keys(SF.reachable(T, t)).length === 0, "ensemble en C3 ; il reste 1 case au Massacreur, plus rien à la Carapace");
  ok(SF.apply(T, "essaim", "move", { id: 10, u: 0, k: 2 }) === "" && m.k === 2 && t.k === 3, "le Massacreur finit seul son déplacement");
}
// 73. Oni, 09/11/2026 : Frappe orbitale 5, Salve 3, Double bouclier, Blindage −1 tourelle, départ au contact sans avancer
{
  const at = (id, name, k, hp) => ({ id, name, lane: "N", u: 0, k, hp, acted: false });
  const S = fresh(); S.phase = "A_react"; S.spells = ["Frappe orbitale", "Salve"]; const c = at(1, "Colosse", 3, 7), d = at(2, "Béhémoth", 3, 5); S.creatures.push(c, d);
  SF.apply(S, "colonie", "spell", { i: 1, arg: 2 });
  ok(d.hp === 2 && c.hp === 4, "Salve : 3 dégâts à 2 créatures de la case (Béhémoth 5 → 2, Colosse 7 → 4)");
  SF.apply(S, "colonie", "spell", { i: 0, arg: 1 });
  ok(!S.creatures.includes(c), "Frappe orbitale : détruit la créature visée (Oni, 09/11/2026)");
  const B = fresh(); B.phase = "D_main"; B.spells = ["Double bouclier"]; B.tiles["0,3"] = SF.tileStats("Muraille", 0, 3);
  ok(SF.apply(B, "colonie", "spell", { i: 0, arg: ["0,1", "0,3"] }) === "" && B.tiles["0,1"].shield === 1 && B.tiles["0,3"].shield === 1, "Double bouclier : deux bâtiments gagnent un jeton Bouclier");
  const F = fresh(); F.phase = "D_fire"; F.firedSupports = []; F.upgrades.tank.r1 = "B"; F.upgrades.tank.r2 = "B";
  const sk = Object.keys(F.supports).find(k => F.supports[k] === 1);
  const t = at(3, "Colosse", 4, 10); F.creatures.push(t);
  const spot = [];
  for (const l of ["N", "E", "S", "O"]) for (let u = -2; u <= 2; u++) for (let k = 1; k <= 4; k++) { t.lane = l; t.u = u; t.k = k; if (SF.supportTargets(F, sk).includes(t)) spot.push([l, u, k]); }
  [t.lane, t.u, t.k] = spot[0];
  SF.fire(F, sk, 3);
  ok(t.hp === 10, "Provocation + Masse vivante (−2) : la tourelle de niveau 1 ne fait plus rien au tank");
  const G = fresh(); G.supports = {}; for (const k of Object.keys(G.tiles)) delete G.tiles[k];
  G.tiles["1,3"] = SF.tileStats("Antenne", 1, 3); G.tiles["1,3"].revealed = true;
  const e = at(4, "Écorcheur", 3, 1); G.creatures.push(e); G.phase = "A_deploy"; SF.apply(G, "essaim", "endDeploy");
  // règle remplacée (09/11/2026) : un soutien qui accompagne une créature restée sur place reste avec elle
  const H = fresh(); H.supports = {}; for (const k of Object.keys(H.tiles)) delete H.tiles[k]; H.phase = "A_attack";
  H.tiles["0,2"] = Object.assign(SF.tileStats("Muraille", 0, 2), { revealed: true, hp: 1, max: 1 });
  const x = Object.assign(at(5, "Écorcheur", 3, 1), { moved: 1 }), g = at(6, "Hurleur", 3, 4); H.creatures.push(x, g);
  SF.apply(H, "essaim", "strike", { id: 5, target: "0,2" });
  ok(!H.tiles["0,2"] && x.k === 3, "l'Écorcheur détruit la Muraille devant lui et reste en C3 (il a attaqué)");
  if (H.phase === "A_attack") SF.apply(H, "essaim", "actAll");
  ok(g.k === 3, "« Tout résoudre » : le Hurleur reste avec l'Écorcheur au lieu d'avancer seul dans la brèche");
}
// 74. Oni, 09/11/2026 : Bouclier sur Palissade, Égide, Archives, Observatoire ; Corrosion
{
  const T = n => SF.TILES[n];
  ok(T("Palissade").pv === 1 && T("Palissade").shield && T("Observatoire").pv === 2 && T("Observatoire").shield && T("Égide").shield && !T("Égide").ren, "Palissade 1 PV, Observatoire 2 PV, Égide sans Renforcé : tous avec Bouclier");
  const S = fresh(); S.supports = {}; for (const k of Object.keys(S.tiles)) delete S.tiles[k]; S.phase = "A_attack"; S.upgrades.soutien.r2 = "B";
  S.tiles["0,2"] = Object.assign(TILESTATS("Rempart", 0, 2), { revealed: true, shield: 1 }); // Renforcé 2, 4 PV, avec un Bouclier
  S.creatures.push({ id: 1, name: "Écorcheur", lane: "N", u: 0, k: 3, hp: 1, acted: false, moved: 1 }, { id: 2, name: "Glaneur", lane: "N", u: 0, k: 3, hp: 2, acted: false });
  SF.apply(S, "essaim", "strike", { id: 1, target: "0,2" });
  ok(S.tiles["0,2"].hp === 1 && !S.tiles["0,2"].shield, "Corrosion : Bouclier détruit et Renforcé sans effet (Rempart 4 → 1 sous 3 dégâts)");
}
// 75. Oni, 09/11/2026 : Reconversion repose la tuile remplacée ; Renouvellement +1 point
{
  const S = fresh(); SF.attackerDraw(S); SF.endDeploy(S); SF.startAttacks(S); SF.endAttackerTurn(S);
  S.tiles["0,2"] = SF.tileStats("Muraille", 0, 2); S.hand = ["Bastion"]; S.spells = ["Reconversion", "Renouvellement"];
  ok(SF.apply(S, "colonie", "spell", { i: 0, arg: { hand: 0, tile: "0,2" } }) === "" && S.tiles["0,2"].name === "Bastion" && S.hand.length === 0 && S.relocate && S.relocate.name === "Muraille", "Reconversion : le Bastion remplace la Muraille, qui attend d'être reposée");
  ok(SF.apply(S, "colonie", "build") !== "" && SF.apply(S, "colonie", "spell", { i: 0, arg: [] }) !== "", "rien d'autre tant qu'elle n'est pas reposée");
  const k = SF.relocateTargets(S).find(x => SF.cellLane(...SF.parse(x)) === "E");
  ok(SF.apply(S, "colonie", "relocate", { k }) === "" && S.tiles[k].name === "Muraille" && !S.relocate, "la Muraille est reposée en lane Est");
  S.hand = ["Palissade"]; const p = SF.pointsLeft(S);
  ok(SF.apply(S, "colonie", "spell", { i: 0, arg: [0] }) === "" && SF.pointsLeft(S) === p + 1, "Renouvellement : +1 point de construction");
}
// 67. IA pour jouer en solo (Oni, 08/11/2026) : honnête, une action légale à chaque étape, une partie jusqu'au bout
{
  const IA = require("../src/ia.js");
  const S = SF.newGame(); S.hand = ["Mine supérieure"]; S.spells = ["Frappe orbitale"];
  const B = IA.belief(S, "essaim");
  ok(B.hand.length === 0 && B.spells.length === 0 && Object.values(B.tileDecks).every(d => d.every(x => x === null)), "IA de l'essaim : ni la main ni les sortilèges de la colonie, ni l'ordre des pioches");
  S.tiles["0,3"] = SF.tileStats("Mine supérieure", 0, 3);
  ok(IA.belief(S, "essaim").tiles["0,3"].name === "Palissade" && !IA.belief(S, "essaim").tiles["0,3"].trap, "une tuile camouflée inconnue est estimée (Palissade), pas lue");
  ok(IA.belief(S, "colonie").handA.length === 0, "IA de la colonie : la main de l'essaim est cachée");
  ok(IA.decide(S, "colonie") === null && IA.decide(S, "essaim").type === "draw", "elle ne joue que pendant son tour");
  SF.setRng(((a) => () => { a = (a * 16807) % 2147483647; return a / 2147483647; })(42)); // partie reproductible
  const G = SF.newGame(); let n = 0, refus = 0;
  while (!G.winner && n < 1500) {
    const side = SF.actor(G), d = IA.decide(G, side);
    if (SF.apply(G, side, d.type, d.args || {})) { refus++; const f = IA.fallback(G, side); if (SF.apply(G, side, f.type, f.args || {})) break; }
    n++;
  }
  SF.setRng(Math.random);
  ok(G.winner && refus === 0, `IA contre IA : partie terminée (victoire ${G.winner}, manche ${G.round}, ${n} actions, ${refus} coup refusé)`);
}
// 68. déplacement = maximum (Oni, 10/11/2026) : une créature de vitesse 2 peut s'arrêter après 1 case, et « Tout résoudre »
// ne la fait pas repartir ; une créature qui n'a pas bougé avance toujours au maximum
{
  const S = SF.newGame(); S.phase = "A_attack"; S.tiles = {};
  S.creatures = [{ id: 1, name: "Massacreur", lane: "N", u: 0, k: 4, hp: 1 }, { id: 2, name: "Massacreur", lane: "E", u: 0, k: 4, hp: 1 }];
  ok(SF.apply(S, "essaim", "move", { id: 1, u: 0, k: 3 }) === "" && S.creatures[0].k === 3, "vitesse 2 : arrêt après 1 case possible");
  SF.apply(S, "essaim", "actAll", {});
  ok(S.creatures[0].k === 3 && S.creatures[1].k === 2, "Tout résoudre : la créature déjà déplacée garde sa case, l'autre avance de 2");
}
// 69. Réincarnation au choix (Oni, 10/11/2026) : tous les tanks morts sont mis de côté ; un seul revient tout seul,
// plusieurs → l'essaim choisit au début de son tour, les autres retournent dans la pioche
{
  const S = SF.newGame(); S.upgrades.tank.r2 = "C"; S.tiles = {}; S.phase = "D_fire";
  S.creatures = [{ id: 1, name: "Carapace", lane: "N", u: 0, k: 3, hp: 0 }, { id: 2, name: "Colosse", lane: "E", u: 1, k: 2, hp: 0 }];
  SF.killCheck(S);
  ok(S.reincQueue.length === 2 && !S.creatures.length, "Réincarnation : les deux tanks morts sont mis de côté");
  const n2 = S.piles[1].filter(x => x === "Carapace").length;
  SF.apply(S, "colonie", "endD", {});
  ok(S.phase === "A_reinc" && SF.actor(S) === "essaim", "début du tour de l'essaim : choix du tank (étape Réincarnation)");
  ok(SF.apply(S, "essaim", "reinc", { i: 1 }) === "" && S.creatures.length === 1 && S.creatures[0].name === "Colosse" && S.creatures[0].k === 2,
    "le Colosse choisi revient là où il est mort");
  ok(S.phase === "A_start" && !S.reincQueue.length && S.piles[1].filter(x => x === "Carapace").length === n2 + 1, "la Carapace retourne dans la pioche, le tour continue");
}
// 70. Nuke et Réincarnation (Oni, 10/11/2026) : les tanks détruits par la Nuke peuvent revenir
{
  const S = SF.newGame(); S.upgrades.tank.r2 = "C"; S.reincQueue = [];
  S.creatures = [{ id: 1, name: "Béhémoth", lane: "S", u: 0, k: 2, hp: 5 }, { id: 2, name: "Ravageur", lane: "S", u: 0, k: 2, hp: 1 }];
  S.floors = 8; S.rocketPts = 0; S.workersBase = 40; S.phase = "D_main";
  SF.apply(S, "colonie", "build", {});
  ok(S.floors >= 9 && !S.creatures.length && S.reincQueue.length === 1 && S.reincQueue[0].name === "Béhémoth", "Nuke : le Béhémoth est mis de côté pour la Réincarnation, le Ravageur part en pioche");
}
// 71. Améliorations sans calcul (Oni, 11/11/2026) : Blindage (jeton), Carapace épaisse et Mines, Coup de grâce, Régénération
{
  const at = (id, name, k, hp, u = 0) => ({ id, name, lane: "N", u, k, hp, acted: false });
  const B = SF.newGame(); B.upgrades.tank.r2 = "A"; B.phase = "A_deploy"; B.budget = 9; B.handA = [{ name: "Carapace", uid: 1 }];
  ok(SF.apply(B, "essaim", "deploy", { uid: 1, lane: "N", u: 0 }) === "" && B.creatures.at(-1).blind === 1, "Blindage : le tank déployé arrive avec un jeton");
  const tk = B.creatures.at(-1); SF.damageCreature(B, tk, 2, "test");
  ok(tk.hp === 3 && !tk.blind, "le jeton annule la prochaine perte de PV, puis il est défaussé");
  SF.damageCreature(B, tk, 2, "test"); ok(tk.hp === 1, "ensuite, les dégâts passent");
  const BA = SF.newGame(); const old = at(40, "Colosse", 3, 7); BA.creatures.push(old, at(41, "Écorcheur", 3, 1));
  BA.invest = { "tank:A1": 0 }; BA.upgrades.tank.r1 = "A"; BA.invest["tank:A2"] = SF.COST_R2 - 1; BA.reserve = 5; BA.phase = "A_deploy";
  SF.apply(BA, "essaim", "invest", { t: "tank", s: "A2", n: 1 });
  ok(BA.upgrades.tank.r2 === "A" && old.blind === 1 && !BA.creatures[1].blind, "Blindage acheté : les tanks déjà en jeu reçoivent leur jeton");
  const EC = SF.newGame(); EC.upgrades.soutien.r1 = "A"; EC.handA = [{ name: "Glaneur", uid: 1 }]; EC.phase = "A_deploy"; EC.budget = 9;
  SF.apply(EC, "essaim", "deploy", { uid: 1, lane: "N", u: 0 });
  ok(EC.creatures.at(-1).esc === 1, "Mue : un soutien déployé arrive avec son jeton Échappée");
  const M = SF.newGame(); M.supports = {}; for (const k of Object.keys(M.tiles)) delete M.tiles[k]; M.upgrades.tank.r1 = "A";
  M.tiles["0,1"] = SF.tileStats("Mine majeure", 0, 1); const c = at(20, "Carapace", 2, 4); M.creatures.push(c);
  SF.hitTile(M, c, "0,1", 1, true);
  ok(c.hp === 2, "Carapace épaisse : la Mine majeure (3) ne fait que 2 dégâts");
  const G = SF.newGame(); G.supports = {}; for (const k of Object.keys(G.tiles)) delete G.tiles[k]; G.upgrades.soutien.r1 = "B";
  G.tiles["0,1"] = SF.tileStats("Muraille", 0, 1); G.tiles["0,1"].revealed = true; const e = at(30, "Écorcheur", 2, 1); G.creatures.push(e, at(31, "Œil-sonde", 2, 2));
  SF.hitTile(G, e, "0,1", 3, true);
  ok(!G.tiles["0,1"], "Coup de grâce : Muraille 4 PV − 3 = 1 PV → détruite");
  const R = SF.newGame(); R.piles[1].push("Glaneur");
  R.invest = { "soutien:A2": SF.COST_R2 - 1 }; R.upgrades.soutien.r1 = "A"; R.reserve = 5; R.phase = "A_deploy";
  SF.apply(R, "essaim", "invest", { t: "soutien", s: "A2", n: 1 });
  ok(!R.piles[1].includes("Glaneur"), "Régénération : les Glaneurs quittent la pioche");
}
// 72. Premier tour de la colonie (Oni, 12/11/2026) : un seul bâtiment au total
{
  const S = fresh(); SF.attackerDraw(S); SF.endDeploy(S); SF.startAttacks(S); SF.endAttackerTurn(S);
  S.hand = ["Palissade", "Palissade", "Palissade"]; S.turnPts = 10; S.spent = 0;
  ok(S.round === 1 && S.phase.startsWith("D_"), "le premier tour de la colonie est la manche 1");
  const k1 = SF.buildTargets(S, 0)[0];
  ok(SF.apply(S, "colonie", "buildAt", { i: 0, k: k1 }) === "" && SF.firstTurnCap(S), "premier tour : un premier bâtiment se pose");
  ok(SF.buildTargets(S, 0).length === 0, "premier tour : plus aucun bâtiment, même dans une autre lane et avec des points");
  SF.apply(S, "colonie", "build");
  while (S.phase === "D_place") SF.apply(S, "colonie", "placeAt", { k: SF.placeTargets(S)[0] });
  ok(S.round >= 1 && (S.rocketPts > 0 || S.floors > 0), "les points non dépensés vont à la fusée");
  const T = fresh(); T.round = 2; T.phase = "D_main"; T.hand = ["Palissade"]; T.turnPts = 5; T.spent = 0;
  ok(!SF.firstTurnCap(T) && SF.buildTargets(T, 0).length > 0, "dès la manche 2, la règle ne s'applique plus");
}
// 53. version du jeu : chaque version livrée a son entrée dans le journal (docs/versions.md)
{
  const journal = require("fs").readFileSync(require("path").join(__dirname, "../docs/versions.md"), "utf8");
  ok(/^\d+\.\d+\.\d+$/.test(SF.VERSION) && journal.includes("## v" + SF.VERSION + " "), "version " + SF.VERSION + " présente dans docs/versions.md");
}
console.log(fails ? `\n${fails} échec(s)` : "\nTous les tests passent.");
process.exit(fails ? 1 : 0);
