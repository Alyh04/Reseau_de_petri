import { PRECONDITIONS } from "@/lib/petri/analysis";
import { PLACES, TRANSITIONS } from "@/lib/petri/model";
import styles from "../CalculModal.module.css";

export default function DefinitionTab() {
  return (
    <section className={styles.section}>
      <h3 className={styles.h3}>Définition formelle du Réseau de Petri RdP = (P, T, Pre, Post, M₀)</h3>

      <div className={styles.defGrid}>
        <article className={styles.card}>
          <h4 className={styles.cardTitle}>P — Ensemble des places ({PLACES.length})</h4>
          <ul className={styles.defList}>
            {PLACES.map((place) => (
              <li key={place.id} className={styles.defItem}>
                <span className={styles.tag}>{place.id}</span>
                <span className={styles.defLabel}>{place.label}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className={styles.card}>
          <h4 className={styles.cardTitle}>T — Ensemble des transitions ({TRANSITIONS.length})</h4>
          <ul className={styles.defList}>
            {TRANSITIONS.map((transition) => (
              <li key={transition.id} className={styles.defItem}>
                <span className={`${styles.tag} ${styles.tagTransition}`}>{transition.id}</span>
                <span className={styles.defLabel}>{transition.label}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className={styles.card}>
          <h4 className={styles.cardTitle}>Pre — Préconditions</h4>
          <ul className={styles.defList}>
            {PRECONDITIONS.map((pre) => (
              <li key={pre.transition} className={styles.defItem}>
                <span className={`${styles.tag} ${styles.tagTransition}`}>{pre.transition}</span>
                <span className={styles.defLabel}>
                  nécessite {pre.places.join(" + ")} &gt; 0
                  {pre.read.length > 0 && (
                    <>
                      {" "}
                      — dont lues sans consommation : <b>{pre.read.join(", ")}</b>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <p className={styles.formulaNote}>
            Un arc de lecture vérifie la condition M(p) ≥ 1 sans retirer de jeton : il figure à la
            fois dans Pre et dans Post, donc sa colonne d&apos;incidence est nulle.
          </p>
        </article>

        <article className={styles.card}>
          <h4 className={styles.cardTitle}>Règle de franchissement</h4>
          <div className={styles.formulaBox}>
            <p className={styles.formulaLine}>
              Condition : <b>M(p) ≥ Pre(p,T)</b> pour toute place p
            </p>
            <p className={styles.formulaLine}>
              Après tir : <b>M&apos;(p) = M(p) − Pre(p,T) + Post(p,T)</b>
            </p>
            <p className={styles.formulaLine}>
              Équivalent : <b>M&apos; = M + C·v</b>
            </p>
            <p className={styles.formulaNote}>
              où C = Post − Pre est la matrice d&apos;incidence et v le vecteur de tir
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}
