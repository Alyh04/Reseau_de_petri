# 🚦 Simulation Réseau de Petri — Carrefour à 4 directions

Simulation interactive d'un carrefour **Nord/Sud/Est/Ouest** modélisé par un réseau de Petri,
avec feux tricolores, files d'attente, flux de véhicules et analyse formelle.

Application **Next.js 16 / React 19 / TypeScript strict**, entièrement exécutée dans le
navigateur : plus de backend, plus de polling HTTP.

---

## 1. Démarrage

```bash
npm install
npm run dev
```

Ouvrir <http://localhost:3000>.

| Commande            | Rôle                                         |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Serveur de développement (Turbopack)         |
| `npm run build`     | Build de production                          |
| `npm run start`     | Serveur de production (après `build`)        |
| `npm run typecheck` | Vérification TypeScript (`tsc --noEmit`)     |

Prérequis : Node.js ≥ 20.9.

---

## 2. Architecture

```text
projet_feu_tricolor_M1/
├── app/
│   ├── layout.tsx              # Shell HTML, métadonnées, polices
│   ├── page.tsx                # Page serveur (unique route)
│   ├── globals.css             # Tokens de design + base
│   └── icon.svg                # Favicon
├── components/
│   ├── SimulationDashboard.tsx # Assemblage de l'interface (client)
│   ├── TopBar.tsx              # Titre, accès à la démarche de calcul, statut
│   ├── ControlPanel.tsx        # Démarrer / pause / reprise / arrêt / véhicules
│   ├── StatsPanel.tsx          # Files, véhicules passés, temps, attente moyenne
│   ├── RightPanel.tsx          # Légende, vitesse, phase, transition active
│   ├── PetriCanvas.tsx         # Rendu Canvas 2D du réseau (DPR, ResizeObserver)
│   ├── JournalPanel.tsx        # Journal horodaté (30 dernières entrées)
│   ├── IncidenceMatrix.tsx     # Matrice C compacte
│   ├── MarkingPanel.tsx        # Marquage courant P1…P26
│   ├── icons.tsx               # Icônes SVG inline
│   ├── calcul/
│   │   ├── CalculModal.tsx     # Modale accessible (focus trap, flèches, Escape)
│   │   ├── MarkingRow.tsx      # Ligne de marquage réutilisable
│   │   └── tabs/               # 6 onglets de la démarche de calcul
│   │       ├── DefinitionTab.tsx
│   │       ├── InitialMarkingTab.tsx
│   │       ├── IncidenceTab.tsx
│   │       ├── FiringTab.tsx
│   │       ├── PropertiesTab.tsx
│   │       └── ResolutionTab.tsx
├── hooks/
│   └── useSimulation.ts        # Boucle rAF + publication des snapshots à 10 Hz
├── lib/petri/
│   ├── types.ts                # Types partagés (marquage, phases, snapshot…)
│   ├── model.ts                # SOURCE UNIQUE : places, transitions, Pre/Post, C, M₀, phases
│   ├── engine.ts               # Moteur RdP générique (Pre/Post pré-indexés, arcs de lecture)
│   ├── simulation.ts           # Contrôleur temporel, trafic, journal, snapshot
│   └── analysis.ts             # Préconditions, BFS, invariants, cycle, propriétés calculées
├── next.config.ts
├── tsconfig.json
└── package.json
```

### Principes

- **Une seule source de vérité** : `lib/petri/model.ts` définit les 26 places, les
  18 transitions, les matrices Pre/Post, l'incidence dérivée, les marquages et les phases.
  Le canvas, la matrice, le moteur et la modale consomment ces mêmes données — aucune
  duplication.
- **Pre/Post explicites** : le moteur reçoit Pre et Post séparément, ce qui permet de
  représenter les arcs de lecture (Pre = Post = 1) que la seule matrice C ne peut pas
  distinguer d'une absence d'arc.
- **Moteur indépendant de React** : `PetriNet` et `TrafficSimulation` sont des classes
  TypeScript pures, testables hors navigateur.
- **Rendu piloté par snapshot** : la simulation tourne dans une boucle
  `requestAnimationFrame` ; React ne re-rend que 10 fois par seconde avec un instantané
  immuable, au lieu de re-rendre à chaque frame.
- **Chargement paresseux** : la modale de calcul (6 onglets, matrice complète) est chargée
  via `next/dynamic` uniquement à l'ouverture.
- **Accessibilité** : dialogue `aria-modal`, focus trap, navigation clavier des onglets
  (←/→/Home/End), fermeture par `Escape`, libellés explicites.

---

## 3. Modèle du réseau de Petri

Réseau **RdP = (P, T, Pre, Post, M₀)** — 26 places, 18 transitions.

### Places

| Groupe               | Places     | Rôle                                                  |
| -------------------- | ---------- | ----------------------------------------------------- |
| Feux Nord            | P1–P3      | Rouge / Vert / Orange                                 |
| Feux Sud             | P4–P6      | Rouge / Vert / Orange                                 |
| Feux Est             | P7–P9      | Rouge / Vert / Orange                                 |
| Feux Ouest           | P10–P12    | Rouge / Vert / Orange                                 |
| Files d'attente      | P13–P16    | Nord / Sud / Est / Ouest (0 à 8 véhicules)            |
| Circulation          | P17–P20    | Véhicules engagés dans le carrefour                   |
| Capacités de file    | P21–P24    | Jetons libres : `MAX_QUEUE − file`                    |
| Verrou d'exclusion   | P25–P26    | `P25` libre / `P26` pris par l'axe en phase de vert   |

### Transitions

| Groupe              | Transitions | Rôle                                            |
| ------------------- | ----------- | ----------------------------------------------- |
| Cycle tricolore NS  | T1–T3       | Rouge → Vert → Orange → Rouge, verrou P25/P26   |
| Cycle tricolore EO  | T4–T6       | Rouge → Vert → Orange → Rouge, verrou P25/P26   |
| Flux véhicules      | T7–T14      | Entrée (lit le feu vert) / sortie par axe       |
| Arrivées            | T15–T18     | Un véhicule entre dans la file si capacité > 0  |

Les entrées T7/T9/T11/T13 consomment un jeton de file et **lisent** le feu vert
correspondant (arc Pre = Post = 1). Les sorties T8/T10/T12/T14 rendent un jeton de
capacité (P21–P24), ce qui donne l'invariant `file + circulation + capacité = 8`.
T1/T4 exigent le verrou libre P25 et le remplacent par P26 ; T3/T6 rendent P25. Le
sous-réseau des feux ne comporte donc que 5 états accessibles et interdit tout vert
NS/EO simultané.

### Cycle des phases

| Phase                  | Durée | Transition franchie |
| ---------------------- | ----: | ------------------- |
| NS Vert / EO Rouge     |   5 s | T2                  |
| NS Orange / EO Rouge   |   2 s | T3                  |
| Tout rouge             |   1 s | T4                  |
| NS Rouge / EO Vert     |   5 s | T5                  |
| NS Rouge / EO Orange   |   2 s | T6                  |
| Tout rouge             |   1 s | T1                  |

### Marquages

```text
M₀        = [1,0,0, 1,0,0, 1,0,0, 1,0,0, 3,3,3,3, 0,0,0,0, 5,5,5,5, 1,0]
M_départ  = [0,1,0, 0,1,0, 1,0,0, 1,0,0, 3,3,3,3, 0,0,0,0, 5,5,5,5, 0,1]
```

`M₀` est le marquage initial formel. La simulation démarre sur `M_départ` afin que le
cycle complet NS/EO puisse s'exécuter immédiatement, sans attendre un premier tour de
feux. Les deux marquages sont définis dans `model.ts`.

### Franchissement

```text
Condition :  M(p) ≥ Pre(p, T)   pour toute place p
Après tir :  M'(p) = M(p) − Pre(p, T) + Post(p, T)
Soit :       M' = M + C · v     avec C = Post − Pre
```

Le moteur pré-indexe les arcs `Pre` et `Post` par transition : un test de
franchissabilité ne parcourt que les places réellement connectées.

### Propriétés calculées

`lib/petri/analysis.ts` ne code aucune conclusion en dur : les propriétés sont
recalculées à l'import, à partir des matrices et d'un BFS du sous-réseau des feux.

- **P-invariants** : 10 invariants vérifiés par `C·y = 0` — 4 triples de feux,
  4 invariants de voie (`file + circulation + capacité = 8`), `P25 + P26 = 1` et la
  conservation globale de 37 jetons.
- **Sûreté** : les 5 états accessibles des feux sont énumérés ; aucun ne contient un
  vert NS et un vert EO simultanés.
- **Vivacité** : L3 prouvée par BFS pour T1–T6 ; T7–T18 sont franchissables au moins
  une fois (L1) dans le cycle de démonstration. Leur répétition dépend du contrôleur
  temporel et du trafic, elle n'est pas revendiquée comme L3 structurelle.
- **Bornitude** : `k = 8`, borne déduite des invariants de voie (feux et verrou
  1-bornés).
- **Absence de blocage** : aucun état mort parmi les états de feux accessibles ; T1–T6
  ne dépendent ni des files ni de la circulation.
- **T-invariant** : le cycle de 18 tirs `T1·T7·T8·T15·T9·T10·T16·T2·T3·T4·T11·T12·T17·T13·T14·T18·T5·T6`
  est rejoué par le moteur et revient exactement à M₀. L'onglet Franchissement affiche
  chaque marquage intermédiaire.

---

## 4. Comportement de la simulation

- **10 ticks/seconde** (100 ms), avancés par `requestAnimationFrame` et mis en pause
  automatique lorsque l'onglet est masqué.
- **Vitesse réglable** de ×0,5 à ×5 (le facteur s'applique au temps simulé).
- **Arrivées aléatoires** de véhicules via T15–T18 : intervalle tiré uniformément entre
  0,7 s et 2,1 s (moyenne ≈ 1,4 s, soit ≈ 0,71 véh/s toutes directions). Le débit
  dépasse volontairement la capacité de service (≈ 0,5 véh/s) afin que les files se
  remplissent et que la saturation soit visible ; les arrivées sont plafonnées par les
  places de capacité et les files restent bornées à 8.
- **Passage** : au plus 2 véhicules par direction et par phase de vert, espacés d'au
  moins 0,9 s ; un véhicule reste 0,8 s en circulation (P17–P20) avant sa sortie
  (T8/T10/T12/T14).
- **Attente moyenne** : mesurée réellement par une FIFO d'horodatages d'arrivée, et non
  tirée aléatoirement. En saturation prolongée elle augmente, ce qui est le comportement
  attendu d'un carrefour surchargé.
- **Ajout manuel** d'un véhicule côté Nord / Sud / Est / Ouest.
- **Journal** horodaté, limité aux 100 dernières entrées (30 affichées).

---

## 5. Démarche de calcul (modale)

Six onglets, tous alimentés par le modèle réel :

1. **Définition** — 26 places, 18 transitions, préconditions Pre (arcs de lecture
   signalés), règle de tir.
2. **Marquage M₀** — grille des 26 places + états initial et de démarrage.
3. **Matrice C** — matrice d'incidence 26 × 18 avec code couleur produits/consommés et
   note sur les self-loops.
4. **Franchissement** — cycle de 18 tirs calculé par le vrai moteur (`M' = M + C·v`),
   pas figé.
5. **Propriétés** — accessibilité, vivacité, bornitude, blocage, 10 P-invariants,
   T-invariant, sûreté.
6. **Résolution** — problème, modélisation, preuves et conclusion.

La séquence de franchissement est rejouée à l'import par `PetriNet` : si le modèle change,
la démonstration ne peut pas se désynchroniser.

### Limite assumée

Le RdP garantit la sûreté, les bornes et le cycle des feux. Le débit (2 véhicules par
phase, intervalle de 0,9 s, traversée de 0,8 s) et le choix aléatoire de la direction
d'arrivée appartiennent à un **contrôleur temporel** au-dessus du réseau : ce sont des
contraintes opérationnelles, pas des propriétés structurelles du RdP.

---

## 6. Migration depuis l'ancienne version

| Avant (petri-traffic)                     | Après (projet_feu_tricolor_M1)              |
| ----------------------------------------- | ------------------------------------------- |
| Backend Python/Flask + API REST            | Moteur TypeScript exécuté côté client        |
| Polling `GET /api/state` toutes les 200 ms | Boucle `requestAnimationFrame` à 10 Hz       |
| React 18 + CRA, styles globaux `App.css`   | Next.js 16 App Router + CSS Modules          |
| Modèle dupliqué (backend, canvas, modale)  | `lib/petri/model.ts` unique                  |
| Modale toujours chargée                    | `next/dynamic` à l'ouverture                 |
| Composants monolithiques                   | Composants ciblés + onglets séparés          |

Le concept, la logique métier et les fonctionnalités sont conservés ; les redondances,
le code mort et la dépendance à un serveur ont été supprimés.

---

## 7. Technologies

| Couche      | Technologie                                  |
| ----------- | -------------------------------------------- |
| Framework   | Next.js 16.3 (App Router, Turbopack)         |
| UI          | React 19.3, CSS Modules                      |
| Langage     | TypeScript 5.9 (strict)                      |
| Rendu       | Canvas 2D, DPR plafonné à 2, ResizeObserver  |
| Simulation  | Réseau de Petri maison, boucle rAF           |
