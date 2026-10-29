import { LANES, MAX_QUEUE, formatTime } from "@/lib/petri/model";
import type { SimulationSnapshot } from "@/lib/petri/types";
import panel from "./Panel.module.css";
import styles from "./StatsPanel.module.css";

interface StatsPanelProps {
  snapshot: SimulationSnapshot;
}

export default function StatsPanel({ snapshot }: StatsPanelProps) {
  const { marking } = snapshot;

  return (
    <section className={panel.section}>
      <h2 className={panel.label}>Statistiques</h2>
      <dl className={styles.grid}>
        {LANES.map((lane) => {
          const value = marking[lane.queue] ?? 0;
          return (
            <div key={lane.side} className={styles.row}>
              <dt className={styles.key}>File {lane.label}</dt>
              <dd className={`${styles.value} ${styles.blue} ${value >= MAX_QUEUE ? styles.full : ""}`}>
                {value}
              </dd>
            </div>
          );
        })}

        <div className={styles.row}>
          <dt className={styles.key}>Passés</dt>
          <dd className={`${styles.value} ${styles.green}`}>{snapshot.vehiclesPassed}</dd>
        </div>
        <div className={styles.row}>
          <dt className={styles.key}>Temps</dt>
          <dd className={`${styles.value} ${styles.mono}`}>{formatTime(snapshot.elapsed)}</dd>
        </div>
        <div className={styles.row}>
          <dt className={styles.key}>Moy. attente</dt>
          <dd className={styles.value}>{snapshot.avgWait} s</dd>
        </div>
      </dl>
    </section>
  );
}
