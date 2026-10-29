import { PLACE_NAMES } from "@/lib/petri/model";
import styles from "./MarkingPanel.module.css";

interface MarkingPanelProps {
  marking: readonly number[];
}

export default function MarkingPanel({ marking }: MarkingPanelProps) {
  return (
    <section className={styles.root} aria-label="Marquage des jetons">
      <h2 className={styles.head}>Marquage (jetons)</h2>
      <div className={styles.body}>
        {PLACE_NAMES.map((place, index) => {
          const value = marking[index] ?? 0;
          return (
            <div key={place} className={styles.row}>
              <span>{place} =</span>
              <span className={`${styles.value} ${value > 0 ? styles.highlight : ""}`}>{value}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
