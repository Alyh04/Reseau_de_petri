import {
  INITIAL_MARKING,
  MAX_QUEUE,
  PLACES,
  START_MARKING,
  TOTAL_TOKENS,
} from "@/lib/petri/model";
import styles from "../CalculModal.module.css";

export default function InitialMarkingTab() {
  return (
    <section className={styles.section}>
      <h3 className={styles.h3}>Marquage initial M₀ — État de départ du système</h3>

      <div className={styles.m0Row}>
        {PLACES.map((place, index) => {
          const value = INITIAL_MARKING[index] ?? 0;
          return (
            <div key={place.id} className={`${styles.m0Cell} ${value > 0 ? styles.m0Active : ""}`}>
              <div className={styles.m0Place}>{place.id}</div>
              <div className={styles.m0Value}>{value}</div>
              <div className={styles.m0Label}>{place.label}</div>
            </div>
          );
        })}
      </div>

      <div className={styles.formulaBox}>
        <p className={styles.formulaLine}>
          <b>M₀ = [{INITIAL_MARKING.join(", ")}]</b>
        </p>
        <p className={styles.formulaNote}>
          Feux : tous rouges (Nord/Sud/Est/Ouest). Files : 3 véhicules chacune. Circulation : vide.
          Capacités P21–P24 : {MAX_QUEUE} − 3 = {MAX_QUEUE - 3}. Verrou : libre (P25 = 1, P26 = 0).
          Total conservé : {TOTAL_TOKENS} jetons.
        </p>
      </div>

      <div className={styles.formulaBox}>
        <p className={styles.formulaLine}>
          <b>M<sub>départ</sub> = [{START_MARKING.join(", ")}]</b>
        </p>
        <p className={styles.formulaNote}>
          État chargé au lancement de la simulation : NS vert, EO rouge, files à 3 véhicules,
          capacités restantes à {MAX_QUEUE - 3}, verrou pris par NS (P25 = 0, P26 = 1). Il permet
          d&apos;exécuter immédiatement les phases NS puis EO.
        </p>
      </div>
    </section>
  );
}
