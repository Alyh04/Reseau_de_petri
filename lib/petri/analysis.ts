import { PetriNet } from "./engine";
import {
  INCIDENCE,
  INITIAL_MARKING,
  LANES,
  MAX_QUEUE,
  PLACE_INDEX,
  PLACES,
  POST,
  PRE,
  READ_ARCS,
  TOTAL_TOKENS,
  TRANSITION_INDEX,
  TRANSITIONS,
} from "./model";

/* -------------------------------------------------------------------------- */
/*  Préconditions                                                             */
/* -------------------------------------------------------------------------- */

export interface Precondition {
  readonly transition: string;
  /** Places dont le marquage doit être ≥ 1 (arcs Pre, lectures incluses). */
  readonly places: readonly string[];
  /** Sous-ensemble des places lues sans être consommées (Pre = Post = 1). */
  readonly read: readonly string[];
}

const READ_KEY = new Set(READ_ARCS.map((arc) => `${arc.transition}:${arc.place}`));

/** Préconditions lues directement dans la matrice Pre. */
export const PRECONDITIONS: readonly Precondition[] = TRANSITIONS.map((transition, t) => {
  const places = PLACES.filter((_, p) => (PRE[p]?.[t] ?? 0) > 0).map((place) => place.id);
  return {
    transition: transition.id,
    places,
    read: places.filter((placeId) => READ_KEY.has(`${transition.id}:${placeId}`)),
  };
});

/* -------------------------------------------------------------------------- */
/*  Invariants vérifiés par calcul matriciel                                  */
/* -------------------------------------------------------------------------- */

interface Invariant {
  readonly label: string;
  readonly constant: number;
  readonly verified: boolean;
}

function makeInvariant(label: string, placeIds: readonly string[]): Invariant {
  const indices = placeIds.map((id) => PLACE_INDEX[id] ?? -1);
  const constant = indices.reduce((sum, p) => sum + (INITIAL_MARKING[p] ?? 0), 0);

  let verified = indices.every((p) => p >= 0);
  for (let t = 0; t < TRANSITIONS.length && verified; t += 1) {
    const delta = indices.reduce((sum, p) => sum + (INCIDENCE[p]?.[t] ?? 0), 0);
    if (delta !== 0) verified = false;
  }

  return { label, constant, verified };
}

const LIGHT_INVARIANTS: readonly Invariant[] = [
  makeInvariant("P1+P2+P3 = 1", ["P1", "P2", "P3"]),
  makeInvariant("P4+P5+P6 = 1", ["P4", "P5", "P6"]),
  makeInvariant("P7+P8+P9 = 1", ["P7", "P8", "P9"]),
  makeInvariant("P10+P11+P12 = 1", ["P10", "P11", "P12"]),
];

const LANE_INVARIANTS: readonly Invariant[] = LANES.map((lane) =>
  makeInvariant(
    `${PLACES[lane.queue]?.id}+${PLACES[lane.circulation]?.id}+${PLACES[lane.capacity]?.id} = ${MAX_QUEUE}`,
    [PLACES[lane.queue]?.id ?? "", PLACES[lane.circulation]?.id ?? "", PLACES[lane.capacity]?.id ?? ""],
  ),
);

const MUTEX_INVARIANT = makeInvariant("P25+P26 = 1", ["P25", "P26"]);

const TOTAL_INVARIANT: Invariant = {
  label: "Σ M(p) = 37",
  constant: TOTAL_TOKENS,
  verified: (() => {
    for (let t = 0; t < TRANSITIONS.length; t += 1) {
      let delta = 0;
      for (let p = 0; p < PLACES.length; p += 1) delta += INCIDENCE[p]?.[t] ?? 0;
      if (delta !== 0) return false;
    }
    return TOTAL_TOKENS === 37;
  })(),
};

const INVARIANTS: readonly Invariant[] = [
  ...LIGHT_INVARIANTS,
  ...LANE_INVARIANTS,
  MUTEX_INVARIANT,
  TOTAL_INVARIANT,
];

const VERIFIED_INVARIANTS = INVARIANTS.filter((invariant) => invariant.verified).length;
const STRUCTURAL_BOUND = Math.max(1, ...LANE_INVARIANTS.map((invariant) => invariant.constant));

/* -------------------------------------------------------------------------- */
/*  Graphe d'accessibilité du sous-réseau feux (P1–P12, P25, P26 ; T1–T6)     */
/* -------------------------------------------------------------------------- */

const FIRE_PLACE_IDS = [...PLACES.slice(0, 12).map((place) => place.id), "P25", "P26"];
const FIRE_PLACES = FIRE_PLACE_IDS.map((id) => PLACE_INDEX[id] ?? -1);
const FIRE_TRANSITIONS = ["T1", "T2", "T3", "T4", "T5", "T6"].map(
  (id) => TRANSITION_INDEX[id] ?? -1,
);

const FIRE_PRE = FIRE_PLACES.map((p) => FIRE_TRANSITIONS.map((t) => PRE[p]?.[t] ?? 0));
const FIRE_POST = FIRE_PLACES.map((p) => FIRE_TRANSITIONS.map((t) => POST[p]?.[t] ?? 0));

interface FireGraph {
  readonly states: readonly (readonly number[])[];
  readonly successors: readonly (readonly number[])[];
}

function isLocalEnabled(state: readonly number[], t: number): boolean {
  for (let p = 0; p < FIRE_PLACES.length; p += 1) {
    if ((FIRE_PRE[p]?.[t] ?? 0) > (state[p] ?? 0)) return false;
  }
  return true;
}

function exploreFireGraph(): FireGraph {
  const initial = FIRE_PLACES.map((p) => INITIAL_MARKING[p] ?? 0);
  const indexOf = new Map<string, number>();
  const states: number[][] = [];
  const successors: number[][] = [];

  const register = (state: number[]): number => {
    const key = state.join(",");
    const known = indexOf.get(key);
    if (known !== undefined) return known;
    const id = states.length;
    indexOf.set(key, id);
    states.push(state);
    successors.push([]);
    return id;
  };

  register(initial);

  for (let cursor = 0; cursor < states.length; cursor += 1) {
    const state = states[cursor] ?? [];
    for (let t = 0; t < FIRE_TRANSITIONS.length; t += 1) {
      if (!isLocalEnabled(state, t)) continue;
      const next = state.map(
        (value, p) => value - (FIRE_PRE[p]?.[t] ?? 0) + (FIRE_POST[p]?.[t] ?? 0),
      );
      const target = register(next);
      const row = successors[cursor];
      if (row && !row.includes(target)) row.push(target);
    }
  }

  return { states, successors };
}

const FIRE_GRAPH = exploreFireGraph();
export const FIRE_STATE_COUNT = FIRE_GRAPH.states.length;
const FIRE_DEADLOCK_FREE = FIRE_GRAPH.successors.every((row) => row.length > 0);

/** Transitions T1–T6 qui peuvent être tirées depuis tout état accessible (L3). */
const LIVE_FIRE_TRANSITIONS: readonly number[] = FIRE_TRANSITIONS.filter((_, t) => {
  return FIRE_GRAPH.states.every((_, start) => {
    const seen = new Set<number>([start]);
    const queue = [start];
    while (queue.length > 0) {
      const current = queue.pop();
      if (current === undefined) break;
      if (isLocalEnabled(FIRE_GRAPH.states[current] ?? [], t)) return true;
      for (const next of FIRE_GRAPH.successors[current] ?? []) {
        if (seen.has(next)) continue;
        seen.add(next);
        queue.push(next);
      }
    }
    return false;
  });
});

const localIndex = (placeId: string): number => FIRE_PLACES.indexOf(PLACE_INDEX[placeId] ?? -1);
const LOCAL_NS_GREEN = [localIndex("P2"), localIndex("P5")];
const LOCAL_EO_GREEN = [localIndex("P8"), localIndex("P11")];

export const SAFETY_VIOLATIONS = FIRE_GRAPH.states.filter((state) => {
  const nsGreen = LOCAL_NS_GREEN.some((p) => (state[p] ?? 0) > 0);
  const eoGreen = LOCAL_EO_GREEN.some((p) => (state[p] ?? 0) > 0);
  return nsGreen && eoGreen;
}).length;

const LIGHT_VIOLATIONS = FIRE_GRAPH.states.filter((state) => {
  const sums = [
    ["P1", "P2", "P3"],
    ["P4", "P5", "P6"],
    ["P7", "P8", "P9"],
    ["P10", "P11", "P12"],
  ].map((group) => group.reduce((sum, id) => sum + (state[localIndex(id)] ?? 0), 0));
  return sums.some((sum) => sum !== 1);
}).length;

/* -------------------------------------------------------------------------- */
/*  Cycle de franchissement : 18 tirs qui ramènent exactement à M₀           */
/* -------------------------------------------------------------------------- */

export interface FiringStep {
  readonly transition: number;
  readonly label: string;
  readonly desc: string;
  readonly marking: readonly number[];
}

const CYCLE: readonly string[] = [
  "T1",
  "T7",
  "T8",
  "T15",
  "T9",
  "T10",
  "T16",
  "T2",
  "T3",
  "T4",
  "T11",
  "T12",
  "T17",
  "T13",
  "T14",
  "T18",
  "T5",
  "T6",
];

const CYCLE_DESCRIPTIONS: Readonly<Record<string, string>> = {
  T1: "NS : Rouge → Vert (tout rouge)",
  T7: "Nord : entrée circulation (feu vert)",
  T8: "Nord : sortie carrefour",
  T15: "Nord : arrivée véhicule",
  T9: "Sud : entrée circulation (feu vert)",
  T10: "Sud : sortie carrefour",
  T16: "Sud : arrivée véhicule",
  T2: "NS : Vert → Orange",
  T3: "NS : Orange → Rouge (tout rouge)",
  T4: "EO : Rouge → Vert",
  T11: "Est : entrée circulation (feu vert)",
  T12: "Est : sortie carrefour",
  T17: "Est : arrivée véhicule",
  T13: "Ouest : entrée circulation (feu vert)",
  T14: "Ouest : sortie carrefour",
  T18: "Ouest : arrivée véhicule",
  T5: "EO : Vert → Orange",
  T6: "EO : Orange → Rouge (tout rouge)",
};

function sameMarking(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

function buildFiringSequence(): { steps: readonly FiringStep[]; closed: boolean } {
  const net = new PetriNet(PRE, POST, INITIAL_MARKING);
  let closed = true;

  const steps = CYCLE.map((id) => {
    const transition = TRANSITION_INDEX[id] ?? -1;
    if (transition < 0 || !net.fire(transition)) {
      closed = false;
      return {
        transition,
        label: id,
        desc: `Transition ${id} non franchissable`,
        marking: net.getMarking(),
      };
    }
    return {
      transition,
      label: id,
      desc: CYCLE_DESCRIPTIONS[id] ?? TRANSITIONS[transition].label,
      marking: net.getMarking(),
    };
  });

  if (closed) closed = sameMarking(net.marking, INITIAL_MARKING);
  return { steps, closed };
}

const SEQUENCE_RESULT = buildFiringSequence();

/** Séquence de 18 tirs validée par le vrai moteur (retour exact à M₀). */
export const FIRING_SEQUENCE: readonly FiringStep[] = SEQUENCE_RESULT.steps;
export const CYCLE_CLOSED: boolean = SEQUENCE_RESULT.closed;
export const CYCLE_TRANSITIONS: readonly string[] = CYCLE;

/** Vecteur de comptage du cycle : C · x = 0 (T-invariant). */
export const T_INVARIANT: readonly number[] = (() => {
  const counts = Array<number>(TRANSITIONS.length).fill(0);
  for (const id of CYCLE) {
    const t = TRANSITION_INDEX[id];
    if (t !== undefined) counts[t] += 1;
  }
  return counts;
})();

const T_INVARIANT_VERIFIED: boolean = (() => {
  for (let p = 0; p < PLACES.length; p += 1) {
    let delta = 0;
    for (let t = 0; t < TRANSITIONS.length; t += 1) {
      delta += (INCIDENCE[p]?.[t] ?? 0) * (T_INVARIANT[t] ?? 0);
    }
    if (delta !== 0) return false;
  }
  return CYCLE_CLOSED;
})();

/* -------------------------------------------------------------------------- */
/*  Propriétés : résultats calculés, jamais codés en dur                      */
/* -------------------------------------------------------------------------- */

export type PropertyStatus = "ok" | "warn" | "err";

export interface PropertyAnalysis {
  readonly name: string;
  readonly icon: string;
  readonly status: PropertyStatus;
  readonly result: string;
  readonly detail: string;
  readonly formula: string;
}

const ALL_FIRE_LIVE = LIVE_FIRE_TRANSITIONS.length === FIRE_TRANSITIONS.length;
const CYCLE_FORMULA = `M₀ --(${CYCLE.join("·")})--> M₀`;

export const PROPERTIES: readonly PropertyAnalysis[] = [
  {
    name: "Accessibilité",
    icon: "🔍",
    status: CYCLE_CLOSED ? "ok" : "err",
    result: CYCLE_CLOSED
      ? `Vérifiée (${FIRE_STATE_COUNT} états de feux)`
      : "Cycle invalide",
    detail: CYCLE_CLOSED
      ? `Le graphe d'accessibilité du sous-réseau feux (P1–P12, P25, P26) contient ${FIRE_STATE_COUNT} marquages accessibles depuis M₀. La séquence de ${CYCLE.length} tirs part de M₀ et y revient exactement, vérifié par le moteur Pre/Post.`
      : "La séquence de démonstration ne ramène pas le réseau à M₀ : le modèle doit être corrigé.",
    formula: CYCLE_FORMULA,
  },
  {
    name: "Vivacité",
    icon: "⚡",
    status: ALL_FIRE_LIVE ? "warn" : "err",
    result: ALL_FIRE_LIVE
      ? "L3 (feux) · L1 (données)"
      : `${LIVE_FIRE_TRANSITIONS.length}/${FIRE_TRANSITIONS.length} transitions L3`,
    detail: ALL_FIRE_LIVE
      ? `Le BFS prouve que, depuis chacun des ${FIRE_STATE_COUNT} états de feux accessibles, chacune des 6 transitions T1–T6 peut être rendue franchissable (L3). Les transitions de données T7–T18 sont démontrées franchissables au moins une fois (L1) dans le cycle de ${CYCLE.length} tirs ; leur vivacité dépend du contrôleur temporel et du trafic, elle n'est donc pas revendiquée comme L3 structurelle.`
      : "Au moins une transition de feu n'est pas réactivables depuis tous les états accessibles : le cycle des feux est incomplet.",
    formula: "∀M ∈ R(M₀), ∀T ∈ {T1…T6}, ∃σ : M[σ⟩ et T ∈ σ",
  },
  {
    name: "Bornitude",
    icon: "📦",
    status: INVARIANTS.every((invariant) => invariant.verified) ? "ok" : "err",
    result: `k-borné (k = ${STRUCTURAL_BOUND})`,
    detail: `Les ${VERIFIED_INVARIANTS} P-invariants vérifiés donnent les bornes structurelles : file + circulation + capacité = ${MAX_QUEUE} (P13–P24), donc chaque place de trafic est bornée par ${STRUCTURAL_BOUND} ; les feux et le verrou sont 1-bornés. Aucune borne n'est postulée sans vérification matricielle.`,
    formula: `∀M ∈ R(M₀), ∀p ∈ P : M(p) ≤ ${STRUCTURAL_BOUND}`,
  },
  {
    name: "Absence de blocage",
    icon: "🚫",
    status: FIRE_DEADLOCK_FREE && CYCLE_CLOSED ? "ok" : "err",
    result: FIRE_DEADLOCK_FREE ? `Sans blocage (${FIRE_STATE_COUNT} états)` : "État mort détecté",
    detail: FIRE_DEADLOCK_FREE
      ? `Aucun des ${FIRE_STATE_COUNT} marquages accessibles du sous-réseau feux n'est un état mort. Comme T1–T6 ne consomment que des places de feux et le verrou, au moins une transition reste toujours franchissable, indépendamment du remplissage des files. Le cycle complet de ${CYCLE.length} tirs confirme la reprise perpétuelle.`
      : "Le BFS a trouvé un marquage accessible sans transition franchissable : le réseau peut se bloquer.",
    formula: "∄M ∈ R(M₀) : En(M) = ∅",
  },
  {
    name: "Invariants de place (P-invariants)",
    icon: "⚖️",
    status: INVARIANTS.every((invariant) => invariant.verified) ? "ok" : "err",
    result: `${VERIFIED_INVARIANTS} P-invariants vérifiés`,
    detail: `Vérifiés par C·y = 0 sur les ${TRANSITIONS.length} transitions : 4 invariants de feux (un seul feu actif par direction), 4 invariants de voie (file + circulation + capacité = ${MAX_QUEUE}), l'exclusion mutuelle P25+P26 = 1 et la conservation globale de ${TOTAL_TOKENS} jetons.`,
    formula: `P1+P2+P3 = 1 ; … ; P13+P17+P21 = ${MAX_QUEUE} ; … ; P25+P26 = 1 ; Σ M(p) = ${TOTAL_TOKENS}`,
  },
  {
    name: "Invariants de transition (T-invariants)",
    icon: "🔄",
    status: T_INVARIANT_VERIFIED ? "ok" : "err",
    result: T_INVARIANT_VERIFIED
      ? `T-invariant de ${CYCLE.length} tirs (retour à M₀)`
      : "T-invariant non vérifié",
    detail: T_INVARIANT_VERIFIED
      ? `Le vecteur de comptage du cycle vérifie C·x = 0 pour les ${PLACES.length} places, et le moteur confirme un retour exact au marquage initial. Le cycle couvre les 6 phases de feux, les 4 entrées, les 4 sorties et les 4 arrivées.`
      : "Le cycle de démonstration ne vérifie pas C·x = 0 ou ne revient pas à M₀.",
    formula: `x = (${T_INVARIANT.join(", ")}) ; C·x = 0 ; M₀[σ⟩M₀`,
  },
  {
    name: "Sûreté (anti-collision)",
    icon: "🛡️",
    status: SAFETY_VIOLATIONS === 0 && LIGHT_VIOLATIONS === 0 ? "ok" : "err",
    result:
      SAFETY_VIOLATIONS === 0 && LIGHT_VIOLATIONS === 0
        ? `Vérifiée sur ${FIRE_STATE_COUNT} états`
        : `${SAFETY_VIOLATIONS + LIGHT_VIOLATIONS} violation(s)`,
    detail:
      SAFETY_VIOLATIONS === 0 && LIGHT_VIOLATIONS === 0
        ? `Le BFS exhaustif des ${FIRE_STATE_COUNT} états de feux ne contient aucun marquage avec un vert NS (P2 ou P5) et un vert EO (P8 ou P11) simultanés, ni aucune direction sans exactement un feu actif. Structurellement, T1 et T4 exigent P25 (verrou libre) et le remplacent par P26 (verrou pris).`
        : "Le graphe d'accessibilité contient un marquage où deux directions incompatibles sont vertes ou une direction n'a pas exactement un feu actif.",
    formula:
      "∀M ∈ R(M₀) : ¬(M(P2)+M(P5) > 0 ∧ M(P8)+M(P11) > 0) ; M(P25)+M(P26) = 1",
  },
];
