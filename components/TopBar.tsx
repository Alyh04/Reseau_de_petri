import { PLACES, TRANSITIONS } from "@/lib/petri/model";
import type { SimulationSnapshot } from "@/lib/petri/types";
import { CalculIcon } from "./icons";
import styles from "./TopBar.module.css";

interface TopBarProps {
  snapshot: SimulationSnapshot;
  onOpenCalcul: () => void;
}

export default function TopBar({ snapshot, onOpenCalcul }: TopBarProps) {
  const running = snapshot.running && !snapshot.paused;
  const paused = snapshot.paused;

  const statusClass = running ? styles.dotRunning : paused ? styles.dotPaused : styles.dotIdle;
  const statusLabel = running ? "Simulation active" : paused ? "En pause" : "Moteur prêt";

  return (
    <header className={styles.root}>
      <span className={styles.icon} aria-hidden="true">
        🚦
      </span>
      <h1 className={styles.title}>
        Simulation Réseau de Petri — Carrefour à 4 Directions (NS/EO)
      </h1>

      <span className={styles.tag}>
        {PLACES.length} places · {TRANSITIONS.length} transitions
      </span>

      <button type="button" className={`${styles.button} ${styles.calcButton}`} onClick={onOpenCalcul}>
        <CalculIcon />
        Démarche de calcul
      </button>

      <div className={styles.status} role="status" aria-live="polite">
        <span className={`${styles.dot} ${statusClass}`} aria-hidden="true" />
        <span>{statusLabel}</span>
      </div>
    </header>
  );
}
