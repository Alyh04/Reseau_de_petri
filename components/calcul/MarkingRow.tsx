import { PLACE_NAMES } from "@/lib/petri/model";
import styles from "./CalculModal.module.css";

interface MarkingRowProps {
  marking: readonly number[];
  highlight?: boolean;
}

export default function MarkingRow({ marking, highlight = false }: MarkingRowProps) {
  return (
    <div className={`${styles.markingRow} ${highlight ? styles.markingRowHi : ""}`}>
      {marking.map((value, index) => (
        <div
          key={PLACE_NAMES[index] ?? index}
          className={`${styles.markingCell} ${value > 0 ? styles.markingCellHi : ""}`}
        >
          <div className={styles.markingName}>{PLACE_NAMES[index]}</div>
          <div className={styles.markingValue}>{value}</div>
        </div>
      ))}
    </div>
  );
}
