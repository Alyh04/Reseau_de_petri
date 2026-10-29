import {
  CYCLE_TRANSITIONS,
  FIRE_STATE_COUNT,
  SAFETY_VIOLATIONS,
} from "@/lib/petri/analysis";
import { MAX_QUEUE, PLACES, TOTAL_TOKENS, TRANSITIONS } from "@/lib/petri/model";
import styles from "../CalculModal.module.css";

export default function ResolutionTab() {
  return (
    <section className={styles.section}>
      <h3 className={styles.h3}>Résolution du problème de gestion du carrefour à 4 directions</h3>

      <div className={styles.resolutionGrid}>
        <article className={`${styles.resCard} ${styles.resProblem}`}>
          <h4 className={styles.resTitle}>🎯 Problème posé</h4>
          <p>Gérer 4 directions (Nord/Sud/Est/Ouest) sans collision entre axes conflictuels :</p>
          <ul className={styles.resList}>
            <li>Éviter les verts simultanés NS et EO</li>
            <li>Respecter le cycle tricolore (Rouge → Vert → Orange → Rouge)</li>
            <li>Assurer la vivacité et l&apos;absence de blocage</li>
            <li>Gérer 4 files d&apos;attente bornées et la traversée du carrefour</li>
          </ul>
        </article>

        <article className={`${styles.resCard} ${styles.resModel}`}>
          <h4 className={styles.resTitle}>🏗️ Modélisation RdP adoptée</h4>
          <ul className={styles.resList}>
            <li>
              <b>{PLACES.length} places</b> : 12 feux (R/V/O × 4) + 4 files + 4 circulation + 4
              capacités + 2 verrou
            </li>
            <li>
              <b>{TRANSITIONS.length} transitions</b> : T1–T6 phases de feux, T7–T14 entrées/sorties,
              T15–T18 arrivées de véhicules
            </li>
            <li>
              <b>Pre / Post explicites</b> : les conditions « feu vert » sont des arcs de lecture
              (Pre = Post = 1), invisibles dans C mais bien vérifiés au tir
            </li>
            <li>
              <b>Exclusion mutuelle</b> : le verrou P25/P26 est consommé par T1/T4 et rendu par
              T3/T6
            </li>
            <li>
              <b>Capacités</b> : P21–P24 valent {MAX_QUEUE} − file et garantissent des files bornées
            </li>
          </ul>
        </article>

        <article className={`${styles.resCard} ${styles.resProof}`}>
          <h4 className={styles.resTitle}>✅ Preuves formelles</h4>
          <div className={styles.proofStep}>
            <span className={styles.proofNum}>1</span>
            <p>
              <b>Sûreté :</b> T1 et T4 exigent les 4 feux rouges (P1, P4, P7, P10) et le verrou
              libre P25 ; ils rendent P26. Le BFS exhaustif des {FIRE_STATE_COUNT} états de feux
              relève {SAFETY_VIOLATIONS} marquage(s) avec vert NS et vert EO simultanés.
            </p>
          </div>
          <div className={styles.proofStep}>
            <span className={styles.proofNum}>2</span>
            <p>
              <b>Conservation :</b> chaque direction vérifie R+V+O = 1, chaque voie vérifie
              file + circulation + capacité = {MAX_QUEUE}, et P25+P26 = 1. Le total de{" "}
              {TOTAL_TOKENS} jetons est invariant.
            </p>
          </div>
          <div className={styles.proofStep}>
            <span className={styles.proofNum}>3</span>
            <p>
              <b>Vivacité :</b> le BFS prouve la vivacité L3 des 6 transitions de feux ; le cycle de{" "}
              {CYCLE_TRANSITIONS.length} tirs (T1 → … → T6) est rejoué par le moteur et revient
              exactement à M₀.
            </p>
          </div>
          <div className={styles.proofStep}>
            <span className={styles.proofNum}>4</span>
            <p>
              <b>Bornitude :</b> les P-invariants de voie bornent chaque place de trafic par{" "}
              {MAX_QUEUE}, les feux et le verrou par 1. Aucun marquage accessible ne dépasse ces
              bornes.
            </p>
          </div>
        </article>

        <article className={`${styles.resCard} ${styles.resResult}`}>
          <h4 className={styles.resTitle}>🏆 Conclusion</h4>
          <p>
            Le réseau modélise formellement un carrefour à 4 directions avec alternance NS/EO,
            phase tout-rouge intermédiaire, files bornées et exclusion mutuelle structurelle.
          </p>
          <p>
            Les propriétés <b>accessibilité, vivacité des feux, bornitude, absence de blocage,
            P-invariants, T-invariant et sûreté</b> sont calculées par analyse matricielle et BFS,
            puis affichées dans l&apos;onglet Propriétés.
          </p>
          <p>
            Le débit (2 véhicules par phase, intervalle de 0,9 s, traversée de 0,8 s) relève du
            contrôleur temporel, pas du RdP : c&apos;est une contrainte opérationnelle assumée.
          </p>
          <p className={styles.resHighlight}>
            Système sûr, vivant et sans collision entre axes conflictuels ✓
          </p>
        </article>
      </div>
    </section>
  );
}
