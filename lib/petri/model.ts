import type {
  ArcDefinition,
  JournalClass,
  PhaseDefinition,
  PlaceDefinition,
  PlaceKind,
  Side,
  TransitionDefinition,
} from "./types";

/* -------------------------------------------------------------------------- */
/*  Modèle formel RdP = (P, T, Pre, Post, M0) — carrefour à 4 directions       */
/* -------------------------------------------------------------------------- */

const place = (id: string, label: string, kind: PlaceKind, x: number, y: number): PlaceDefinition => ({
  id,
  label,
  kind,
  x,
  y,
});

const arc = (placeId: string): ArcDefinition => ({ place: placeId, weight: 1 });

const transition = (
  id: string,
  label: string,
  short: string,
  x: number,
  y: number,
  pre: readonly ArcDefinition[],
  post: readonly ArcDefinition[],
): TransitionDefinition => ({ id, label, short, x, y, pre, post });

export const PLACES: readonly PlaceDefinition[] = [
  // Feux Nord (P1–P3)
  place("P1", "Feu Nord Rouge", "red", 0.38, 0.12),
  place("P2", "Feu Nord Vert", "green", 0.5, 0.22),
  place("P3", "Feu Nord Orange", "orange", 0.62, 0.12),
  // Feux Sud (P4–P6)
  place("P4", "Feu Sud Rouge", "red", 0.38, 0.88),
  place("P5", "Feu Sud Vert", "green", 0.5, 0.82),
  place("P6", "Feu Sud Orange", "orange", 0.62, 0.88),
  // Feux Est (P7–P9)
  place("P7", "Feu Est Rouge", "red", 0.88, 0.38),
  place("P8", "Feu Est Vert", "green", 0.82, 0.5),
  place("P9", "Feu Est Orange", "orange", 0.88, 0.62),
  // Feux Ouest (P10–P12)
  place("P10", "Feu Ouest Rouge", "red", 0.12, 0.38),
  place("P11", "Feu Ouest Vert", "green", 0.18, 0.5),
  place("P12", "Feu Ouest Orange", "orange", 0.12, 0.62),
  // Files d'attente (P13–P16)
  place("P13", "File Nord", "blue", 0.5, 0.06),
  place("P14", "File Sud", "blue", 0.5, 0.92),
  place("P15", "File Est", "blue", 0.93, 0.5),
  place("P16", "File Ouest", "blue", 0.07, 0.5),
  // Circulation (P17–P20)
  place("P17", "Circ. Nord", "blue", 0.38, 0.35),
  place("P18", "Circ. Sud", "blue", 0.62, 0.65),
  place("P19", "Circ. Est", "blue", 0.65, 0.38),
  place("P20", "Circ. Ouest", "blue", 0.35, 0.62),
  // Capacités de file (P21–P24) : MAX_QUEUE − file
  place("P21", "Cap. Nord", "blue", 0.3, 0.06),
  place("P22", "Cap. Sud", "blue", 0.7, 0.92),
  place("P23", "Cap. Est", "blue", 0.93, 0.72),
  place("P24", "Cap. Ouest", "blue", 0.07, 0.28),
  // Verrou d'exclusion mutuelle NS/EO (P25–P26)
  place("P25", "Verrou libre", "blue", 0.3, 0.5),
  place("P26", "Verrou pris", "blue", 0.7, 0.5),
] as const;

/**
 * 18 transitions :
 *  - T1–T6 : cycle tricolore NS/EO (avec verrou d'exclusion mutuelle) ;
 *  - T7–T14 : entrée/sortie de circulation (l'entrée lit le feu vert) ;
 *  - T15–T18 : arrivées de véhicules, bornées par les places de capacité.
 */
export const TRANSITIONS: readonly TransitionDefinition[] = [
  transition("T1", "NS : Rouge → Vert", "NS R→V", 0.5, 0.14, [
    arc("P1"), arc("P4"), arc("P7"), arc("P10"), arc("P25"),
  ], [
    arc("P2"), arc("P5"), arc("P7"), arc("P10"), arc("P26"),
  ]),
  transition("T2", "NS : Vert → Orange", "NS V→O", 0.5, 0.31, [
    arc("P2"), arc("P5"),
  ], [
    arc("P3"), arc("P6"),
  ]),
  transition("T3", "NS : Orange → Rouge", "NS O→R", 0.5, 0.4, [
    arc("P3"), arc("P6"), arc("P26"),
  ], [
    arc("P1"), arc("P4"), arc("P25"),
  ]),
  transition("T4", "EO : Rouge → Vert", "EO R→V", 0.68, 0.5, [
    arc("P7"), arc("P10"), arc("P1"), arc("P4"), arc("P25"),
  ], [
    arc("P8"), arc("P11"), arc("P1"), arc("P4"), arc("P26"),
  ]),
  transition("T5", "EO : Vert → Orange", "EO V→O", 0.77, 0.5, [
    arc("P8"), arc("P11"),
  ], [
    arc("P9"), arc("P12"),
  ]),
  transition("T6", "EO : Orange → Rouge", "EO O→R", 0.86, 0.5, [
    arc("P9"), arc("P12"), arc("P26"),
  ], [
    arc("P7"), arc("P10"), arc("P25"),
  ]),
  transition("T7", "Nord : Entrée circulation", "N entrée", 0.38, 0.25, [
    arc("P13"), arc("P2"),
  ], [
    arc("P17"), arc("P2"),
  ]),
  transition("T8", "Nord : Sortie carrefour", "N sortie", 0.38, 0.45, [
    arc("P17"),
  ], [
    arc("P21"),
  ]),
  transition("T9", "Sud : Entrée circulation", "S entrée", 0.62, 0.75, [
    arc("P14"), arc("P5"),
  ], [
    arc("P18"), arc("P5"),
  ]),
  transition("T10", "Sud : Sortie carrefour", "S sortie", 0.62, 0.55, [
    arc("P18"),
  ], [
    arc("P22"),
  ]),
  transition("T11", "Est : Entrée circulation", "E entrée", 0.75, 0.38, [
    arc("P15"), arc("P8"),
  ], [
    arc("P19"), arc("P8"),
  ]),
  transition("T12", "Est : Sortie carrefour", "E sortie", 0.55, 0.38, [
    arc("P19"),
  ], [
    arc("P23"),
  ]),
  transition("T13", "Ouest : Entrée circulation", "O entrée", 0.25, 0.62, [
    arc("P16"), arc("P11"),
  ], [
    arc("P20"), arc("P11"),
  ]),
  transition("T14", "Ouest : Sortie carrefour", "O sortie", 0.45, 0.62, [
    arc("P20"),
  ], [
    arc("P24"),
  ]),
  transition("T15", "Nord : Arrivée véhicule", "N arrivée", 0.4, 0.06, [
    arc("P21"),
  ], [
    arc("P13"),
  ]),
  transition("T16", "Sud : Arrivée véhicule", "S arrivée", 0.6, 0.92, [
    arc("P22"),
  ], [
    arc("P14"),
  ]),
  transition("T17", "Est : Arrivée véhicule", "E arrivée", 0.93, 0.6, [
    arc("P23"),
  ], [
    arc("P15"),
  ]),
  transition("T18", "Ouest : Arrivée véhicule", "O arrivée", 0.07, 0.4, [
    arc("P24"),
  ], [
    arc("P16"),
  ]),
] as const;

export const PLACE_NAMES: readonly string[] = PLACES.map((p) => p.id);
export const TRANSITION_IDS: readonly string[] = TRANSITIONS.map((t) => t.id);

export const PLACE_INDEX: Readonly<Record<string, number>> = Object.fromEntries(
  PLACES.map((p, index) => [p.id, index]),
);

export const TRANSITION_INDEX: Readonly<Record<string, number>> = Object.fromEntries(
  TRANSITIONS.map((t, index) => [t.id, index]),
);

/* -------------------------------------------------------------------------- */
/*  Matrices Pre / Post / incidence                                           */
/* -------------------------------------------------------------------------- */

function buildMatrices(): {
  pre: readonly (readonly number[])[];
  post: readonly (readonly number[])[];
} {
  const transitionCount = TRANSITIONS.length;

  const pre = PLACES.map(() => Array<number>(transitionCount).fill(0));
  const post = PLACES.map(() => Array<number>(transitionCount).fill(0));

  TRANSITIONS.forEach((item, t) => {
    for (const entry of item.pre) {
      const p = PLACE_INDEX[entry.place];
      if (p === undefined) throw new Error(`Place inconnue dans Pre(${item.id}) : ${entry.place}`);
      pre[p][t] += entry.weight;
    }
    for (const entry of item.post) {
      const p = PLACE_INDEX[entry.place];
      if (p === undefined) throw new Error(`Place inconnue dans Post(${item.id}) : ${entry.place}`);
      post[p][t] += entry.weight;
    }
  });

  return {
    pre: pre.map((row) => Object.freeze(row)),
    post: post.map((row) => Object.freeze(row)),
  };
}

const MATRICES = buildMatrices();

/** Pre : places × transitions. */
export const PRE: readonly (readonly number[])[] = Object.freeze(MATRICES.pre);
/** Post : places × transitions. */
export const POST: readonly (readonly number[])[] = Object.freeze(MATRICES.post);

/**
 * Matrice d'incidence C = Post − Pre.
 * Un arc de lecture (Pre = Post = 1) est un self-loop : il vaut 0 dans C.
 */
export const INCIDENCE: readonly (readonly number[])[] = PLACES.map((_, p) =>
  Object.freeze((POST[p] ?? []).map((value, t) => value - (PRE[p]?.[t] ?? 0))),
);

export interface ReadArc {
  readonly place: string;
  readonly transition: string;
}

/** Arcs de lecture (feu vert) : présents dans Pre et Post, donc invisibles dans C. */
export const READ_ARCS: readonly ReadArc[] = TRANSITIONS.flatMap((item) => {
  const postPlaces = new Set(item.post.map((entry) => entry.place));
  return item.pre
    .filter((entry) => postPlaces.has(entry.place))
    .map((entry) => ({ place: entry.place, transition: item.id }));
});

/* -------------------------------------------------------------------------- */
/*  Marquages                                                                 */
/* -------------------------------------------------------------------------- */

export const MAX_QUEUE = 8;
const INITIAL_QUEUE = 3;
const INITIAL_CAPACITY = MAX_QUEUE - INITIAL_QUEUE;

const INITIAL_LIGHTS: readonly number[] = [
  1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
];
const START_LIGHTS: readonly number[] = [
  0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0,
];

function buildMarking(
  lights: readonly number[],
  mutexFree: number,
  mutexHeld: number,
): readonly number[] {
  return Object.freeze([
    ...lights, // P1–P12
    ...Array<number>(4).fill(INITIAL_QUEUE), // P13–P16
    0, 0, 0, 0, // P17–P20
    ...Array<number>(4).fill(INITIAL_CAPACITY), // P21–P24
    mutexFree, // P25
    mutexHeld, // P26
  ]);
}

/** État initial : tous les feux rouges, files à 3, capacités à 5, verrou libre. */
export const INITIAL_MARKING: readonly number[] = buildMarking(INITIAL_LIGHTS, 1, 0);

/** État de démarrage : NS vert, EO rouge, verrou pris par NS. */
export const START_MARKING: readonly number[] = buildMarking(START_LIGHTS, 0, 1);

/** 4 feux + 4 files × 8 + 1 verrou = 37 jetons conservés par tout tir. */
export const TOTAL_TOKENS = INITIAL_MARKING.reduce((sum, value) => sum + value, 0);

/* -------------------------------------------------------------------------- */
/*  Phases, files et constantes de simulation                                 */
/* -------------------------------------------------------------------------- */

export const PHASES: readonly PhaseDefinition[] = [
  {
    label: "NS Vert / EO Rouge",
    duration: 5,
    fires: TRANSITION_INDEX.T2,
    log: "T2: NS Vert → Orange",
    logClass: "ok",
  },
  {
    label: "NS Orange / EO Rouge",
    duration: 2,
    fires: TRANSITION_INDEX.T3,
    log: "T3: NS Orange → Rouge (tout rouge)",
    logClass: "ev",
  },
  {
    label: "Tout Rouge",
    duration: 1,
    fires: TRANSITION_INDEX.T4,
    log: "T4: EO Rouge → Vert",
    logClass: "ok",
  },
  {
    label: "NS Rouge / EO Vert",
    duration: 5,
    fires: TRANSITION_INDEX.T5,
    log: "T5: EO Vert → Orange",
    logClass: "ok",
  },
  {
    label: "NS Rouge / EO Orange",
    duration: 2,
    fires: TRANSITION_INDEX.T6,
    log: "T6: EO Orange → Rouge (tout rouge)",
    logClass: "ev",
  },
  {
    label: "Tout Rouge",
    duration: 1,
    fires: TRANSITION_INDEX.T1,
    log: "T1: NS Rouge → Vert",
    logClass: "ok",
  },
] as const;

export interface LaneDefinition {
  readonly side: Side;
  readonly label: string;
  readonly queue: number;
  readonly green: number;
  readonly circulation: number;
  readonly capacity: number;
  readonly enter: number;
  readonly exit: number;
  readonly arrival: number;
}

const laneIndex = (placeId: string): number => PLACE_INDEX[placeId] ?? 0;
const transitionIndex = (transitionId: string): number => TRANSITION_INDEX[transitionId] ?? 0;

export const LANES: readonly LaneDefinition[] = [
  {
    side: "nord",
    label: "Nord",
    queue: laneIndex("P13"),
    green: laneIndex("P2"),
    circulation: laneIndex("P17"),
    capacity: laneIndex("P21"),
    enter: transitionIndex("T7"),
    exit: transitionIndex("T8"),
    arrival: transitionIndex("T15"),
  },
  {
    side: "sud",
    label: "Sud",
    queue: laneIndex("P14"),
    green: laneIndex("P5"),
    circulation: laneIndex("P18"),
    capacity: laneIndex("P22"),
    enter: transitionIndex("T9"),
    exit: transitionIndex("T10"),
    arrival: transitionIndex("T16"),
  },
  {
    side: "est",
    label: "Est",
    queue: laneIndex("P15"),
    green: laneIndex("P8"),
    circulation: laneIndex("P19"),
    capacity: laneIndex("P23"),
    enter: transitionIndex("T11"),
    exit: transitionIndex("T12"),
    arrival: transitionIndex("T17"),
  },
  {
    side: "ouest",
    label: "Ouest",
    queue: laneIndex("P16"),
    green: laneIndex("P11"),
    circulation: laneIndex("P20"),
    capacity: laneIndex("P24"),
    enter: transitionIndex("T13"),
    exit: transitionIndex("T14"),
    arrival: transitionIndex("T18"),
  },
] as const;

export const QUEUE_INDEX_BY_SIDE: Readonly<Record<Side, number>> = LANES.reduce<
  Record<Side, number>
>(
  (acc, lane) => {
    acc[lane.side] = lane.queue;
    return acc;
  },
  { nord: 0, sud: 0, est: 0, ouest: 0 },
);

export const SIDE_LABELS: Readonly<Record<Side, string>> = LANES.reduce<Record<Side, string>>(
  (acc, lane) => {
    acc[lane.side] = lane.label;
    return acc;
  },
  { nord: "", sud: "", est: "", ouest: "" },
);

export const JOURNAL_LIMIT = 100;
export const JOURNAL_VISIBLE = 30;
export const MIN_SPEED = 0.5;
export const MAX_SPEED = 5;

/** Au plus 2 véhicules par direction et par phase de vert. */
export const MAX_VEHICLES_PER_PHASE = 2;
/** Intervalle minimal entre deux entrées d'une même file (secondes simulées). */
export const PASS_INTERVAL = 0.9;
/** Temps de traversée du carrefour (le véhicule reste visible dans P17–P20). */
export const CROSS_TIME = 0.8;
/** Intervalle d'arrivée moyen d'un véhicule, toutes directions confondues. */
export const ARRIVAL_MIN = 0.7;
export const ARRIVAL_MAX = 2.1;

/* -------------------------------------------------------------------------- */
/*  Journal, libellés d'état                                                  */
/* -------------------------------------------------------------------------- */

/** Horodatage HH:MM:SS utilisé par le journal et l'interface. */
export function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((value) => String(value).padStart(2, "0")).join(":");
}

/** Journal initial déterministe : identique côté serveur et client. */
export function createInitialJournal(): readonly {
  time: string;
  msg: string;
  cls: JournalClass;
}[] {
  return [
    { time: "00:00:00", msg: "Initialisation du réseau à 4 directions…", cls: "info" },
    { time: "00:00:00", msg: `${PLACES.length} places / ${TRANSITIONS.length} transitions — OK`, cls: "ok" },
    { time: "00:00:00", msg: "Moteur RdP générique piloté par Pre/Post — OK", cls: "ok" },
    { time: "00:00:00", msg: "État initial chargé avec succès !", cls: "ok" },
  ];
}

/**
 * Libellé déduit du marquage réel — jamais de l'index de phase.
 * Garantit que l'affichage reste cohérent après reset ou arrêt.
 */
export function describeState(marking: readonly number[]): string {
  const at = (placeId: string): number => marking[PLACE_INDEX[placeId]] ?? 0;

  const nsGreen = at("P2") > 0 || at("P5") > 0;
  const nsOrange = at("P3") > 0 || at("P6") > 0;
  const eoGreen = at("P8") > 0 || at("P11") > 0;
  const eoOrange = at("P9") > 0 || at("P12") > 0;

  const ns = nsGreen ? "Vert" : nsOrange ? "Orange" : "Rouge";
  const eo = eoGreen ? "Vert" : eoOrange ? "Orange" : "Rouge";

  if (ns === "Rouge" && eo === "Rouge") return "Tout rouge";
  return `NS ${ns} / EO ${eo}`;
}

/* -------------------------------------------------------------------------- */
/*  Arcs du schéma (déduits de Pre/Post, y compris les arcs de lecture)       */
/* -------------------------------------------------------------------------- */

export interface VisualArc {
  readonly from: string;
  readonly to: string;
  /** Arc de lecture (Pre = Post = 1) : ne consomme pas de jeton. */
  readonly dashed?: boolean;
}

function buildVisualArcs(): VisualArc[] {
  const arcs: VisualArc[] = [];

  for (let t = 0; t < TRANSITIONS.length; t += 1) {
    const transitionId = TRANSITIONS[t].id;
    for (let p = 0; p < PLACES.length; p += 1) {
      const pre = PRE[p]?.[t] ?? 0;
      const post = POST[p]?.[t] ?? 0;
      if (pre > 0) {
        arcs.push({ from: PLACES[p].id, to: transitionId, dashed: post > 0 });
      } else if (post > 0) {
        arcs.push({ from: transitionId, to: PLACES[p].id });
      }
    }
  }

  return arcs;
}

export const VISUAL_ARCS: readonly VisualArc[] = buildVisualArcs();
