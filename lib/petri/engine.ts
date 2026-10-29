/**
 * Moteur générique de réseau de Petri.
 * Pre et Post sont fournis explicitement (et non déduits de C) afin de gérer
 * les arcs de lecture : un self-loop Pre = Post = 1 est franchissable si la
 * place est marquée, mais ne consomme pas de jeton.
 */

interface Arc {
  readonly place: number;
  readonly weight: number;
}

function validateMatrix(name: string, matrix: readonly (readonly number[])[], places: number, transitions: number): void {
  if (matrix.length !== places) {
    throw new Error(`${name} : ${matrix.length} lignes pour ${places} places.`);
  }
  for (let p = 0; p < matrix.length; p += 1) {
    const row = matrix[p];
    if (row.length !== transitions) {
      throw new Error(`${name} : ligne ${p} de longueur ${row.length} au lieu de ${transitions}.`);
    }
    for (const weight of row) {
      if (!Number.isInteger(weight) || weight < 0) {
        throw new Error(`${name} : poids invalide (${weight}) ligne ${p}.`);
      }
    }
  }
}

function buildArcs(matrix: readonly (readonly number[])[], transition: number): Arc[] {
  const arcs: Arc[] = [];
  for (let p = 0; p < matrix.length; p += 1) {
    const weight = matrix[p]?.[transition] ?? 0;
    if (weight > 0) arcs.push({ place: p, weight });
  }
  return arcs;
}

export class PetriNet {
  readonly placeCount: number;
  readonly transitionCount: number;

  private readonly pre: readonly (readonly Arc[])[];
  private readonly post: readonly (readonly Arc[])[];
  private mark: number[];

  constructor(
    preMatrix: readonly (readonly number[])[],
    postMatrix: readonly (readonly number[])[],
    initialMarking: readonly number[],
  ) {
    if (preMatrix.length !== initialMarking.length || postMatrix.length !== initialMarking.length) {
      throw new Error("Pre, Post et marquage initial n'ont pas la même dimension.");
    }

    this.placeCount = preMatrix.length;
    this.transitionCount = preMatrix[0]?.length ?? 0;

    if (postMatrix[0]?.length !== this.transitionCount) {
      throw new Error("Pre et Post n'ont pas le même nombre de transitions.");
    }

    validateMatrix("Pre", preMatrix, this.placeCount, this.transitionCount);
    validateMatrix("Post", postMatrix, this.placeCount, this.transitionCount);

    this.pre = Array.from({ length: this.transitionCount }, (_, t) => buildArcs(preMatrix, t));
    this.post = Array.from({ length: this.transitionCount }, (_, t) => buildArcs(postMatrix, t));
    this.mark = [...initialMarking];
  }

  /** Marquage courant (lecture seule, sans copie). */
  get marking(): readonly number[] {
    return this.mark;
  }

  getMarking(): number[] {
    return [...this.mark];
  }

  reset(marking: readonly number[]): void {
    if (marking.length !== this.placeCount) {
      throw new Error("Dimension de marquage invalide.");
    }
    this.mark = [...marking];
  }

  isEnabled(transition: number): boolean {
    const arcs = this.pre[transition];
    if (!arcs) return false;
    for (const { place, weight } of arcs) {
      if (this.mark[place] < weight) return false;
    }
    return true;
  }

  fire(transition: number): boolean {
    if (!this.isEnabled(transition)) return false;

    for (const { place, weight } of this.pre[transition]) {
      this.mark[place] -= weight;
    }
    for (const { place, weight } of this.post[transition]) {
      this.mark[place] += weight;
    }
    return true;
  }

  tokensAt(place: number): number {
    return this.mark[place] ?? 0;
  }

  addTokens(place: number, count = 1): number {
    if (!Number.isInteger(place) || place < 0 || place >= this.placeCount || count <= 0) {
      return 0;
    }
    this.mark[place] += count;
    return this.mark[place];
  }
}
