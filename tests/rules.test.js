// Tests ciblés des règles du livret v0.3 (scénarios précis, pas de simulation de parties)
const SF = require("../src/engine.js");
let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log("ÉCHEC :", msg); } else console.log("ok   :", msg); };
const fresh = () => { const S = SF.newGame(); S.log = []; return S; };

// 1. chemin sans diagonale : A3 → B3 → B2 → C2 → C1 → fusée (lane Nord, colonne A = u -2)
{
  const steps = []; let u = -2, k = 4;
  while (k !== 0) { [u, k] = SF.nextStep(u, k); steps.push(k === 0 ? "F" : "ABCDE"[u + 2] + k); }
  ok(steps.join(" ") === "A3 B3 B2 C2 C1 F", "chemin colonne A : " + steps.join(" "));
  steps.length = 0; u = 1; k = 4;
  while (k !== 0) { [u, k] = SF.nextStep(u, k); steps.push(k === 0 ? "F" : "ABCDE"[u + 2] + k); }
  ok(steps.join(" ") === "D3 D2 C2 C1 F", "chemin colonne D : " + steps.join(" "));
}
// 2. une créature traverse les cases vides et frappe la haie de départ (2 PV) ; Épines 1 en retour
{
  const S = fresh(); SF.attackerDraw(S);
  S.creatures.push({ id: 900, name: "Écorcheur", lane: "N", u: -2, k: 4, hp: 1, new: true, acted: false });
  SF.act(S, S.creatures[0]);
  ok(!S.tiles["0,1"], "Écorcheur (3 ATQ) détruit la haie de départ Nord (2 PV)");
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
  S.tiles["0,1"] = SF.tileStats("Piège", 0, 1);
  S.creatures.push({ id: 902, name: "Carapace", lane: "N", u: 0, k: 4, hp: 3, new: true, acted: false });
  SF.act(S, S.creatures[0]);
  const c = S.creatures[0];
  ok(S.tiles["0,1"].revealed && S.tiles["0,1"].hp === 1, "piège révélé, 2 → 1 PV");
  ok(c && c.hp === 1, "Carapace : 2 dégâts du piège, pas d'Épines (3 → 1 PV)");
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
// 6. fusée : 3 points par étage, +1 travailleur, palier 3 = +2 technologies
{
  const S = fresh(); SF.attackerDraw(S); SF.endDeploy(S); SF.startAttacks(S); SF.endAttackerTurn(S);
  S.workersBase = 9; S.extraPts = 0;
  SF.endDefenderTurn(S);
  ok(S.floors === 3 && S.workersBase === 12 && SF.tech(S) >= 2, "9 points → 3 étages, +3 travailleurs, +2 technologies");
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
  ok([3, 4, 7, 10, 13].map(t).join() === "1,2,3,4,5", "paliers 3 / 4 / 7 / 10 / 13");
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
  ok(SF.effAtq(S, e) === 4 && SF.effAtq(S, h) === 0 && SF.effAtq(S, far) === 3, "Fureur : même case seulement ; le Hurleur lui-même a 0 ATQ");
}
// 11. améliorations payées en plusieurs fois
{
  const S = fresh(); SF.attackerDraw(S);
  S.budget = 3; S.reserve = 2;
  ok(SF.invest(S, "aggro", "A1", 2) && S.budget === 1 && S.reserve === 2, "déploiement : l'investissement prend d'abord le budget");
  ok(SF.nodeState(S, "aggro", "B1") === "closed", "commencer à investir dans A1 ferme B1");
  ok(!SF.invest(S, "aggro", "B1", 1), "investir dans B1 refusé");
  ok(SF.invest(S, "aggro", "A1", 99) && SF.invested(S, "aggro", "A1") === 5 && S.budget === 0 && S.reserve === 0, "Tout investir : budget puis réserve (5 / 8)");
  ok(SF.nodeState(S, "aggro", "A2") === "needR1" && !SF.invest(S, "aggro", "A2", 1), "rang 2 bloqué tant que le rang 1 n'est pas acquis");
  SF.endDeploy(S); S.reserve = 4;
  const n2 = S.piles[2].length;
  ok(SF.invest(S, "aggro", "A1", 99) && S.upgrades.aggro.r1 === "A" && S.reserve === 1, "étape Améliorations : 3 points de plus → Férocité acquise, 1 reste en réserve");
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
  ok(["Œil-sonde","Glaneur","Hurleur"].every(n => SF.CREATURES[n].pv === 2 && SF.CREATURES[n].atq === 0), "soutiens N1 : 0 ATQ / 2 PV");
  ok(["Phéromone","Perforeur","Catalyseur"].every(n => SF.CREATURES[n].pv === 5 && SF.CREATURES[n].atq === 0), "soutiens N2 : 0 ATQ / 5 PV");
  ok(["Sapeur","Sporeur"].every(n => SF.CREATURES[n].pv === 8 && SF.CREATURES[n].atq === 0), "soutiens N3 : 0 ATQ / 8 PV");
  const g = { id: 1, name: "Glaneur", lane: "N", u: 0, k: 4, hp: 2, new: true, acted: false };
  const h = { id: 2, name: "Hurleur", lane: "N", u: 0, k: 4, hp: 2, new: true, acted: false };
  S.creatures.push(g, h);
  SF.act(S, g);
  ok(S.tiles["0,1"].hp === 2 && g.hp === 2 && g.k === 2, "le Glaneur avance jusqu'au mur, ne le frappe pas et ne prend pas d'Épines");
  ok(SF.effAtq(S, g) === 0, "un soutien reste à 0 ATQ même sous l'Aura Fureur d'un autre Hurleur");
}
// 14. Camouflage : toutes les forteresses sauf Antenne, Laboratoire, Observatoire, Baraquement, Dortoir
{
  const S = fresh(); SF.attackerDraw(S);
  for (const n of Object.keys(SF.TILES).filter(n => !["Antenne", "Laboratoire", "Observatoire", "Baraquement", "Dortoir"].includes(n))) ok(!SF.tileStats(n, 0, 2).revealed && SF.tileStats(n, 0, 2).camo === 1, n + " posé camouflé");
  for (const n of ["Antenne", "Laboratoire", "Observatoire", "Baraquement", "Dortoir"]) ok(SF.tileStats(n, 0, 2).revealed && !SF.tileStats(n, 0, 2).camo, n + " posé face visible");
  S.tiles["0,1"] = SF.tileStats("Muraille", 0, 1);
  const c = { id: 950, name: "Carapace", lane: "N", u: 0, k: 4, hp: 3, new: true, acted: false };
  S.creatures.push(c); SF.act(S, c);
  ok(S.tiles["0,1"] === undefined || S.tiles["0,1"].revealed, "la Muraille est révélée à la première attaque");
  ok(c.hp === 3, "Muraille : ni piège ni Épines, la Carapace ne perd rien");
  ok(SF.pubName("Muraille") === "tuile camouflée" && SF.pubName("Dortoir") === "Dortoir", "le journal ne nomme pas une tuile camouflée");
}
// 15. Griffes : Aura +1 ATQ aux autres créatures de la case, non cumulable, cumulable avec Fureur
{
  const S = fresh(); S.upgrades.soutien.r1 = "B";
  const g1 = { id: 1, name: "Glaneur", lane: "N", u: 0, k: 4, hp: 2 }, g2 = { id: 2, name: "Œil-sonde", lane: "N", u: 0, k: 4, hp: 2 };
  const e = { id: 3, name: "Écorcheur", lane: "N", u: 0, k: 4, hp: 1 };
  S.creatures.push(g1, g2, e);
  ok(SF.effAtq(S, e) === 4, "Écorcheur 3 + 1 (Griffes, 2 soutiens : non cumulable)");
  S.creatures.push({ id: 4, name: "Hurleur", lane: "N", u: 0, k: 4, hp: 2 });
  ok(SF.effAtq(S, e) === 5, "+ Fureur : 3 + 1 + 1");
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
  ok([3, 4, 7, 10, 13].map(b => { S.biomass = b; return SF.capOf(S); }).join() === "1,2,3,4,5", "plafonds 1 / 2 / 3 / 4 / 5");
}
// 19. Cadence : +2 points
{
  const S = fresh(); SF.attackerDraw(S); SF.endDeploy(S); SF.startAttacks(S); SF.endAttackerTurn(S);
  const p0 = SF.totalPoints(S); S.spells = ["Cadence"]; SF.useSpell(S, 0);
  ok(SF.totalPoints(S) === p0 + 2, "Cadence : +2 points (" + p0 + " → " + SF.totalPoints(S) + ")");
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
  ok(SF.apply(S, "essaim", "endDeploy") === "" && SF.apply(S, "essaim", "toAttacks") === "", "fin de déploiement puis passage aux attaques");
  ok(S.phase === "A_attack" || S.phase === "A_react", "phase d'attaque (ou de réaction si la colonie tient un sortilège offensif)");
}
// 22. fenêtre de réaction : ouverte seulement si la colonie tient un sortilège offensif autre que Famine
{
  const S = fresh(); SF.apply(S, "essaim", "draw"); SF.apply(S, "essaim", "endDeploy");
  S.spells = ["Barrage"];
  SF.apply(S, "essaim", "toAttacks");
  ok(S.phase === "A_react", "Barrage en main → fenêtre de réaction");
  ok(SF.apply(S, "essaim", "endA") !== "", "l'essaim ne peut pas agir pendant la réaction");
  ok(SF.apply(S, "colonie", "spell", { i: 0, arg: "N" }) === "" && S.spells.length === 0, "la colonie joue Barrage");
  ok(SF.apply(S, "colonie", "reactDone") === "" && S.phase === "A_attack", "fin de la réaction");
  const T = fresh(); SF.apply(T, "essaim", "draw"); SF.apply(T, "essaim", "endDeploy"); T.spells = ["Famine", "Effort"];
  SF.apply(T, "essaim", "toAttacks");
  ok(T.phase === "A_attack", "Famine ou sort de soutien seuls : pas de fenêtre de réaction");
}
// 23. Renouvellement : indices invalides refusés (sinon pioche gratuite)
{
  const S = fresh(); SF.attackerDraw(S); SF.endDeploy(S); SF.startAttacks(S); SF.endAttackerTurn(S);
  S.spells = ["Renouvellement"]; const n = S.hand.length, deck = S.tileDeck.length;
  ok(SF.apply(S, "colonie", "spell", { i: 0, arg: ["a", "b"] }) !== "" && S.tileDeck.length === deck && S.spells.length === 1, "indices non numériques refusés");
  ok(SF.apply(S, "colonie", "spell", { i: 0, arg: [0, 0] }) !== "", "indice en double refusé");
  ok(SF.apply(S, "colonie", "spell", { i: 0, arg: [0] }) === "" && S.hand.length === n, "défausser 1 tuile et en repiocher 1");
}
// 24. fenêtre Famine : ouverte aussi quand le tour de la colonie se termine par la pose d'un bâtiment
{
  const S = fresh(); SF.attackerDraw(S); SF.endDeploy(S); SF.startAttacks(S); SF.endAttackerTurn(S);
  S.hand.unshift("Palissade");
  SF.apply(S, "colonie", "startCh", { i: 0, lane: "N" }); S.alloc.N = 1;
  SF.apply(S, "colonie", "toFire");
  const deck = S.spellDeck; S.spellDeck = [...deck.filter(s => s !== "Famine"), "Famine"]; S.techBonus = 3; // pioche 1 sortilège : Famine
  SF.apply(S, "colonie", "endD");
  ok(S.phase === "D_place", "pose du bâtiment achevé");
  ok(SF.apply(S, "colonie", "placeAt", { k: "0,2" }) === "" && S.spells.includes("Famine") && S.phase === "A_famine", "après la pose : fenêtre Famine ouverte");
  ok(SF.apply(S, "colonie", "famine", { play: true }) === "" && S.phase === "A_start" && S.famine === 2, "Famine jouée : budget −2");
}
// 25. vue filtrée : rien de caché n'est envoyé à l'autre camp
{
  const S = fresh(); SF.attackerDraw(S);
  S.tiles["0,2"] = SF.tileStats("Piège", 0, 2);
  S.chantiers.E.push({ tile: "Muraille", left: 2, fresh: true }); S.chantiers.S.push({ tile: "Antenne", left: 1, fresh: true });
  S.toPlace.push({ tile: "Rempart", lane: "O" }); S.spells = ["Famine", "Effort"];
  const A = SF.viewFor(S, "essaim"), txt = JSON.stringify(A);
  ok(A.hand.length === S.hand.length && A.hand.every(x => x === null), "essaim : main de la colonie réduite à son nombre");
  ok(A.spells.length === 2 && A.spells.every(x => x === null), "essaim : sortilèges réduits à leur nombre");
  ok(A.tiles["0,2"].name === null && A.tiles["0,2"].hp === null && !txt.includes("Piège"), "essaim : tuile camouflée sans nom ni PV");
  ok(A.chantiers.E[0].tile === null && A.chantiers.S[0].tile === "Antenne", "essaim : chantier camouflé sans nom, Antenne visible");
  ok(A.toPlace[0].tile === null && !txt.includes("Muraille") && !txt.includes("Rempart"), "essaim : tuile à poser camouflée sans nom");
  ok(A.handA.length && A.handA[0].name, "essaim : voit sa propre main");
  ok([1, 2, 3].every(l => A.piles[l].every(x => x === null)) && A.tileDeck.every(x => x === null) && A.spellDeck.every(x => x === null), "personne ne voit l'ordre des pioches");
  const C = SF.viewFor(S, "colonie");
  ok(C.handA.length === S.handA.length && C.handA.every(x => x === null), "colonie : main de l'essaim réduite à son nombre");
  ok(C.tiles["0,2"].name === "Piège" && C.hand[0] === S.hand[0], "colonie : voit ses tuiles et sa main");
  S.upgrades.soutien.r2 = "C"; S.creatures.push({ id: 90, name: "Glaneur", lane: "N", u: 0, k: 4, hp: 2 });
  ok(SF.viewFor(S, "essaim").tiles["0,2"].name === "Piège", "Clairvoyance : la tuile camouflée est visible pour l'essaim");
}
// 26. événements visuels (animations) : produits seulement à la demande, et filtrés pour l'essaim
{
  const S = fresh(); SF.attackerDraw(S);
  SF.apply(S, "essaim", "endDeploy");
  ok(!("fx" in S), "sans demande, le moteur ne garde aucun événement dans l'état");
  const T = fresh(); T.tiles["1,2"] = SF.tileStats("Muraille", 1, 2); T.tiles["0,2"] = SF.tileStats("Piège", 0, 2);
  const c = { id: 50, name: "Écorcheur", lane: "N", u: 0, k: 4, hp: 1, acted: false }; T.creatures.push(c);
  T.phase = "A_attack"; T.fx = [];
  SF.apply(T, "essaim", "act", { id: 50 });
  ok(T.fx.some(e => e.t === "move") && T.fx.some(e => e.t === "hit" && e.k === "0,2"), "déplacement (C3) puis attaque du piège en C2");
  ok(T.fx.some(e => e.t === "dmg" && e.id === 50) && T.fx.some(e => e.t === "die" && e.id === 50), "piège et Épines : dégâts puis mort de la créature");
  const hidden = SF.fxFor(T, "essaim", [{ t: "hit", id: null, k: "1,2", n: 1, hp: 3 }]);
  ok(hidden[0].hp === null && hidden[0].n === null, "PV d'une tuile camouflée encore cachée non transmis à l'essaim");
  ok(SF.fxFor(T, "colonie", [{ t: "hit", id: null, k: "1,2", n: 1, hp: 3 }])[0].hp === 3, "la colonie reçoit les PV de ses tuiles");
}
// 27. Épines (décision d'Oni, 30/10/2026) : seulement la Haie de départ (1), la Haie d'épines et le Mur hérissé (2)
{
  const withEp = Object.keys(SF.TILES).filter(n => SF.TILES[n].ep > 0).sort();
  ok(withEp.join() === ["Haie d'épines", "Mur hérissé"].sort().join() && SF.TILES["Haie d'épines"].ep === 2 && SF.TILES["Mur hérissé"].ep === 2, "seules la Haie d'épines et le Mur hérissé ont des Épines (2)");
  const S = fresh();
  ok(S.tiles["0,1"].name === "Haie de départ" && S.tiles["0,1"].ep === 1 && S.tiles["0,1"].hp === 2, "les 4 haies de départ : 2 PV, Épines 1");
  // support de niveau 2 en (1,2) / (-1,2)… : il touche les murs (0,2) et (1,1) côté fusée
  S.supports["1,2"] = 2;
  S.tiles["0,2"] = SF.tileStats("Muraille", 0, 2);
  const touching = SF.supportWalls(1, 2);
  const tk = touching.find(k => k === "0,2");
  ok(!tk || SF.epinesOf(S, "0,2") === 0, "support de niveau 2 : pas d'Épines ajoutées à une Muraille (0 Épines)");
  S.tiles["0,2"] = SF.tileStats("Haie d'épines", 0, 2);
  ok(!tk || SF.epinesOf(S, "0,2") === 3, "support de niveau 2 : +1 à une Haie d'épines (2 → 3)");
  const old = { tiles: { "0,1": { name: "Mur de départ", ep: 1 }, "0,2": { name: "Muraille", ep: 1 } }, tileDiscard: ["Mur de départ", "Muraille"], tileDeck: [], hand: [] };
  SF.migrate(old);
  ok(old.tiles["0,1"].name === "Haie de départ" && old.tiles["0,2"].ep === 0 && old.tileDiscard.join() === "Muraille", "ancienne partie : Mur de départ renommé, Épines mises à jour");
}
// 28. fusée : coût d'un étage 3 / 4 / 5 / 6 selon le palier (étages 1-3, 4-6, 7-9, 10-12)
{
  const S = fresh();
  const costs = [];
  for (let f = 0; f < 12; f++) { S.floors = f; costs.push(SF.floorCost(S)); }
  ok(costs.join("") === "333444555666", "coût par étage : " + costs.join(" "));
  const T = fresh(); T.phase = "D_fire"; T.floors = 2; T.rocketPts = 0; T.workersBase = 6;
  T.alloc = { N: 0, E: 0, S: 0, O: 0 }; T.extraPts = 0;
  SF.endDefenderTurn(T);
  ok(T.floors === 3 && T.rocketPts === 3, "6 points avec 2 étages : étage 3 (3 points), 3 points gardés, pas assez pour l'étage 4 (4 points)");
}
console.log(fails ? `\n${fails} échec(s)` : "\nTous les tests passent.");
process.exit(fails ? 1 : 0);
