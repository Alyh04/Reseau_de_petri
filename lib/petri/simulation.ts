import type {
  JournalClass,
  JournalEntry,
  Side,
  SimulationSnapshot,
} from "./types";
import {
  ARRIVAL_MAX,
  ARRIVAL_MIN,
  CROSS_TIME,
  INITIAL_MARKING,
  JOURNAL_LIMIT,
  JOURNAL_VISIBLE,
  LANES,
  MAX_QUEUE,
  MAX_SPEED,
  MAX_VEHICLES_PER_PHASE,
  MIN_SPEED,
  PASS_INTERVAL,
  PHASES,
  POST,
  PRE,
  SIDE_LABELS,
  START_MARKING,
  TRANSITION_IDS,
  createInitialJournal,
  describeState,
  formatTime,
  type LaneDefinition,
} from "./model";
import { PetriNet } from "./engine";

type RandomSource = () => number;

const INITIAL_SPEED = 1;
/** Durée d'affichage (temps simulé) de la dernière transition franchie. */
const ACTIVE_HOLD = 1;

/**
 * Simulation du carrefour : le moteur RdP gère les feux, les files, les
 * capacités et la circulation ; le contrôleur temporel déclenche les phases
 * et choisit les transitions d'arrivée (non-déterminisme du réseau).
 *
 * Le moteur ne dépend ni de React ni du DOM : il est testable isolément.
 */
export class TrafficSimulation {
  private readonly net: PetriNet;
  private readonly rng: RandomSource;

  private running = false;
  private paused = false;
  private elapsed = 0;
  private phase = 0;
  private phaseElapsed = 0;
  private speed = INITIAL_SPEED;
  private vehiclesPassed = 0;
  private waitTotal = 0;
  private waitCount = 0;
  private activeTransition: string | null = null;
  private activeUntil = 0;
  private readonly activeThisTick = new Set<string>();
  private journal: JournalEntry[] = [];

  /** Horodatage d'arrivée de chaque véhicule encore dans la file (FIFO). */
  private arrivedAt: number[][] = LANES.map(() => []);
  private readonly lastEnterAt: number[] = LANES.map(() => -PASS_INTERVAL);
  private readonly crossingUntil: number[] = LANES.map(() => 0);
  private readonly passedInPhase: number[] = LANES.map(() => 0);

  constructor(rng: RandomSource = Math.random) {
    this.rng = rng;
    this.net = new PetriNet(PRE, POST, INITIAL_MARKING);
    this.fillArrivalBuffers();
  }

  get marking(): readonly number[] {
    return this.net.marking;
  }

  get isRunning(): boolean {
    return this.running;
  }

  get isPaused(): boolean {
    return this.paused;
  }

  reset(): void {
    this.resetState(INITIAL_MARKING, "reset", true);
  }

  start(): void {
    this.resetState(START_MARKING, "start", false);
    this.running = true;
    this.paused = false;
  }

  pause(): void {
    if (!this.running || this.paused) return;
    this.paused = true;
    this.addLog("PAUSE : Simulation suspendue", "ev");
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.addLog("REPRISE : Simulation reprise", "ok");
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    this.paused = false;
    this.addLog("ARRÊT : Simulation stoppée", "ev");
  }

  setSpeed(value: number): void {
    if (!Number.isFinite(value)) return;
    this.speed = Math.min(MAX_SPEED, Math.max(MIN_SPEED, value));
  }

  /** Ajoute un véhicule dans une file via la transition d'arrivée du côté. */
  addVehicle(side: Side): boolean {
    const index = LANES.findIndex((lane) => lane.side === side);
    if (index < 0) return false;

    const lane = LANES[index];
    if (this.net.tokensAt(lane.queue) >= MAX_QUEUE) {
      this.addLog(`File pleine (max ${MAX_QUEUE}) — côté ${SIDE_LABELS[side]}`, "warn");
      return false;
    }
    if (!this.net.fire(lane.arrival)) {
      this.addLog(`Capacité indisponible — côté ${SIDE_LABELS[side]}`, "warn");
      return false;
    }

    this.arrivedAt[index].push(this.elapsed);
    this.addLog(`Véhicule ajouté manuellement côté ${SIDE_LABELS[side]}`, "ok");
    return true;
  }

  /**
   * Avance la simulation d'un pas de temps réel `dt` (en secondes).
   * Le facteur de vitesse est appliqué au temps simulé.
   */
  tick(dt: number): void {
    if (!this.running || this.paused || dt <= 0) return;

    const simDt = dt * this.speed;
    this.elapsed += simDt;
    this.phaseElapsed += simDt;
    this.activeThisTick.clear();

    this.spawnVehicle(simDt);
    this.processExits();
    this.processEntries();

    // Une seule phase est normalement franchie par pas de 100 ms ; la boucle
    // protège contre les grands écarts (onglet en arrière-plan, vitesse élevée).
    let guard = 0;
    while (this.phaseElapsed >= PHASES[this.phase].duration && guard < PHASES.length * 4) {
      this.phaseElapsed -= PHASES[this.phase].duration;
      this.advancePhase();
      this.processEntries();
      guard += 1;
    }

    if (this.activeThisTick.size > 0) {
      this.activeTransition = [...this.activeThisTick].join("+");
      this.activeUntil = this.elapsed + ACTIVE_HOLD;
    } else if (this.elapsed >= this.activeUntil) {
      this.activeTransition = null;
    }
  }

  private resetState(
    marking: readonly number[],
    announce: "reset" | "start",
    resetSpeed: boolean,
  ): void {
    this.net.reset(marking);
    this.running = false;
    this.paused = false;
    this.elapsed = 0;
    this.phase = 0;
    this.phaseElapsed = 0;
    if (resetSpeed) this.speed = INITIAL_SPEED;
    this.vehiclesPassed = 0;
    this.waitTotal = 0;
    this.waitCount = 0;
    this.activeTransition = null;
    this.activeUntil = 0;
    this.activeThisTick.clear();
    this.journal = [...createInitialJournal()];

    for (let index = 0; index < LANES.length; index += 1) {
      this.lastEnterAt[index] = -PASS_INTERVAL;
      this.crossingUntil[index] = 0;
      this.passedInPhase[index] = 0;
    }
    this.arrivedAt = LANES.map(() => []);
    this.fillArrivalBuffers();

    if (announce === "start") {
      this.addLog("DÉMARRAGE : Carrefour 4 directions — NS Vert", "ok");
    }
  }

  /** Cale les FIFO d'attente sur le nombre de jetons réellement présents. */
  private fillArrivalBuffers(): void {
    this.arrivedAt = LANES.map((lane, index) => {
      const existing = this.arrivedAt[index] ?? [];
      const count = this.net.tokensAt(lane.queue);
      if (existing.length === count) return existing;
      return Array.from({ length: count }, () => 0);
    });
  }

  private advancePhase(): void {
    const phase = PHASES[this.phase];
    const transitionId = TRANSITION_IDS[phase.fires] ?? `T${phase.fires + 1}`;

    if (this.net.fire(phase.fires)) {
      this.activeThisTick.add(transitionId);
      this.addLog(phase.log, phase.logClass);
    } else {
      this.addLog(`Transition ${transitionId} non franchissable — phase ${this.phase}`, "warn");
    }

    this.phase = (this.phase + 1) % PHASES.length;
    this.passedInPhase.fill(0);
  }

  /** Arrivée aléatoire d'un véhicule, choisie parmi les 4 transitions d'arrivée. */
  private spawnVehicle(simDt: number): void {
    const meanInterval = ARRIVAL_MIN + this.rng() * (ARRIVAL_MAX - ARRIVAL_MIN);
    if (this.rng() >= simDt / meanInterval) return;

    const index = Math.min(LANES.length - 1, Math.floor(this.rng() * LANES.length));
    const lane = LANES[index];
    if (this.net.tokensAt(lane.queue) >= MAX_QUEUE) return;
    if (!this.net.fire(lane.arrival)) return;

    this.arrivedAt[index].push(this.elapsed);
    this.activeThisTick.add(TRANSITION_IDS[lane.arrival]);
    this.addLog(`Nouveau véhicule en attente ${lane.label}`, "ev");
  }

  /** Sortie de circulation après le temps de traversée (P17–P20 visibles). */
  private processExits(): void {
    for (let index = 0; index < LANES.length; index += 1) {
      const lane = LANES[index];
      if (this.net.tokensAt(lane.circulation) <= 0) continue;
      if (this.elapsed < this.crossingUntil[index]) continue;
      if (!this.net.fire(lane.exit)) continue;

      this.crossingUntil[index] = 0;
      this.vehiclesPassed += 1;
      this.activeThisTick.add(TRANSITION_IDS[lane.exit]);
      this.addLog(`${lane.label} : véhicule sorti du carrefour`, "ok");
    }
  }

  /**
   * Entrées dans le carrefour : feu vert (arc de lecture), file non vide,
   * capacité de circulation libre, cooldown et plafond par phase.
   */
  private processEntries(): void {
    for (let index = 0; index < LANES.length; index += 1) {
      const lane = LANES[index];

      if (this.passedInPhase[index] >= MAX_VEHICLES_PER_PHASE) continue;
      if (this.net.tokensAt(lane.green) <= 0) continue;
      if (this.net.tokensAt(lane.queue) <= 0) continue;
      if (this.net.tokensAt(lane.circulation) > 0) continue;
      if (this.elapsed < this.lastEnterAt[index] + PASS_INTERVAL) continue;
      if (!this.net.fire(lane.enter)) continue;

      this.lastEnterAt[index] = this.elapsed;
      this.crossingUntil[index] = this.elapsed + CROSS_TIME;
      this.passedInPhase[index] += 1;
      this.activeThisTick.add(TRANSITION_IDS[lane.enter]);
      this.recordWait(index);
      this.addLog(`${lane.label} : véhicule engagé`, "ev");
    }
  }

  /** Attente réelle : temps entre l'arrivée dans la file et l'entrée. */
  private recordWait(index: number): void {
    const buffer = this.arrivedAt[index];
    const arrived = buffer.shift() ?? this.elapsed;
    this.waitTotal += Math.max(0, this.elapsed - arrived);
    this.waitCount += 1;
  }

  private addLog(msg: string, cls: JournalClass = "info"): void {
    this.journal.push({ time: formatTime(this.elapsed), msg, cls });
    if (this.journal.length > JOURNAL_LIMIT) this.journal.shift();
  }

  private get avgWait(): number {
    if (this.waitCount === 0) return 0;
    return Math.round((this.waitTotal / this.waitCount) * 10) / 10;
  }

  snapshot(): SimulationSnapshot {
    return {
      marking: this.net.getMarking(),
      running: this.running,
      paused: this.paused,
      elapsed: Math.round(this.elapsed * 10) / 10,
      phase: this.phase,
      vehiclesPassed: this.vehiclesPassed,
      avgWait: this.avgWait,
      journal: this.journal.slice(-JOURNAL_VISIBLE),
      stateLabel: describeState(this.net.marking),
      activeTransition: this.activeTransition,
      speed: this.speed,
    };
  }
}

/** Snapshot déterministe utilisé pour le rendu serveur (aucun accès au DOM). */
export function createInitialSnapshot(): SimulationSnapshot {
  return {
    marking: [...INITIAL_MARKING],
    running: false,
    paused: false,
    elapsed: 0,
    phase: 0,
    vehiclesPassed: 0,
    avgWait: 0,
    journal: createInitialJournal(),
    stateLabel: describeState(INITIAL_MARKING),
    activeTransition: null,
    speed: INITIAL_SPEED,
  };
}
