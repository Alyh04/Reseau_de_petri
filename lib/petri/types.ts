export type PlaceKind = "red" | "green" | "orange" | "blue";

export type JournalClass = "info" | "ok" | "ev" | "warn";

export type Side = "nord" | "sud" | "est" | "ouest";

export type ControlAction = "start" | "pause" | "resume" | "stop" | "reset" | "speed";

export interface PlaceDefinition {
  readonly id: string;
  readonly label: string;
  readonly kind: PlaceKind;
  readonly x: number;
  readonly y: number;
}

export interface ArcDefinition {
  readonly place: string;
  readonly weight: number;
}

export interface TransitionDefinition {
  readonly id: string;
  readonly label: string;
  /** Libellé compact affiché sur le canvas. */
  readonly short: string;
  readonly x: number;
  readonly y: number;
  /** Arcs entrants (Pre). Un arc présent aussi dans Post est un arc de lecture. */
  readonly pre: readonly ArcDefinition[];
  /** Arcs sortants (Post). */
  readonly post: readonly ArcDefinition[];
}

export interface PhaseDefinition {
  readonly label: string;
  readonly duration: number;
  /** Index de la transition franchie à la fin de la phase. */
  readonly fires: number;
  readonly log: string;
  readonly logClass: JournalClass;
}

export interface JournalEntry {
  readonly time: string;
  readonly msg: string;
  readonly cls: JournalClass;
}

export interface SimulationSnapshot {
  readonly marking: readonly number[];
  readonly running: boolean;
  readonly paused: boolean;
  readonly elapsed: number;
  readonly phase: number;
  readonly vehiclesPassed: number;
  readonly avgWait: number;
  readonly journal: readonly JournalEntry[];
  readonly stateLabel: string;
  readonly activeTransition: string | null;
  readonly speed: number;
}
