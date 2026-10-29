import { INCIDENCE, PLACES, READ_ARCS, TRANSITIONS } from "@/lib/petri/model";
import styles from "../CalculModal.module.css";

export default function IncidenceTab() {
  return (
    <section className={styles.section}>
      <h3 className={styles.h3}>
        Matrice d&apos;incidence C = Post − Pre ({PLACES.length} × {TRANSITIONS.length})
      </h3>
      <p className={styles.paragraph}>
        C[p][t] = nombre de jetons <b className={styles.pos}>produits</b> moins{" "}
        <b className={styles.neg}>consommés</b> lors du franchissement.
      </p>
      <p className={styles.paragraph}>
        Les <b>{READ_ARCS.length} arcs de lecture</b> (conditions « feu vert » des entrées
        T7/T9/T11/T13) sont des self-loops Pre = Post = 1 : leur case d&apos;incidence vaut 0,
        pourtant la condition M(p) ≥ 1 est bien testée par le moteur. La colonne C ne suffit donc
        pas à reconstruire Pre et Post.
      </p>

      <div className={styles.matrixWrap}>
        <table className={styles.table}>
          <caption className={styles.caption}>
            Matrice d&apos;incidence du réseau : {PLACES.length} places en lignes,{" "}
            {TRANSITIONS.length} transitions en colonnes.
          </caption>
          <thead>
            <tr>
              <th className={styles.corner} scope="col">
                Place / Trans.
              </th>
              {TRANSITIONS.map((transition) => (
                <th key={transition.id} className={styles.transHead} scope="col">
                  {transition.id}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PLACES.map((place, row) => (
              <tr key={place.id}>
                <th className={styles.placeHead} scope="row">
                  {place.id} <span className={styles.placeLabel}>{place.label}</span>
                </th>
                {TRANSITIONS.map((transition, column) => {
                  const value = INCIDENCE[row]?.[column] ?? 0;
                  return (
                    <td
                      key={transition.id}
                      className={value < 0 ? styles.neg : value > 0 ? styles.pos : styles.zero}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
