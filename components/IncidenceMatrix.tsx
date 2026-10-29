import { memo } from "react";
import { INCIDENCE, PLACE_NAMES, TRANSITION_IDS } from "@/lib/petri/model";
import styles from "./IncidenceMatrix.module.css";

function IncidenceMatrix() {
  return (
    <section className={styles.root} aria-label="Matrice d'incidence">
      <h2 className={styles.head}>Matrice d&apos;incidence</h2>
      <div className={styles.body}>
        <table className={styles.table}>
          <caption className={styles.caption}>
            Matrice d&apos;incidence du réseau de Petri : {PLACE_NAMES.length} places en lignes,{" "}
            {TRANSITION_IDS.length} transitions en colonnes.
          </caption>
          <thead>
            <tr>
              <th scope="col" className={styles.corner} />
              {TRANSITION_IDS.map((transition) => (
                <th scope="col" key={transition}>
                  {transition}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INCIDENCE.map((row, placeIndex) => (
              <tr key={PLACE_NAMES[placeIndex]}>
                <th scope="row">{PLACE_NAMES[placeIndex]}</th>
                {row.map((value, transitionIndex) => (
                  <td
                    key={`${placeIndex}-${transitionIndex}`}
                    className={value < 0 ? styles.neg : value > 0 ? styles.pos : styles.zero}
                  >
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default memo(IncidenceMatrix);
