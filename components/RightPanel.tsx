import type { CSSProperties } from "react";
import { MAX_SPEED, MIN_SPEED, PHASES } from "@/lib/petri/model";
import type { SimulationSnapshot } from "@/lib/petri/types";
import panel from "./Panel.module.css";
import styles from "./RightPanel.module.css";

interface RightPanelProps {
  snapshot: SimulationSnapshot;
  onSpeedChange: (value: number) => void;
}

export default function RightPanel({ snapshot, onSpeedChange }: RightPanelProps) {
  const speedPercent = ((snapshot.speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED)) * 100;
  const running = snapshot.running && !snapshot.paused;
  const paused = snapshot.paused;

  const statusClass = running ? styles.running : paused ? styles.paused : styles.idle;
  const statusLabel = !snapshot.running ? "Arrêté" : paused ? "En pause" : snapshot.stateLabel;

  return (
    <>
      <section className={panel.section}>
        <h2 className={panel.label}>Légende</h2>
        <ul className={styles.legendList}>
          <li className={styles.legendItem}>
            <span className={styles.legendCircle} aria-hidden="true" />
            Place
          </li>
          <li className={styles.legendItem}>
            <span className={styles.legendRect} aria-hidden="true" />
            Transition
          </li>
          <li className={styles.legendItem}>
            <span className={`${styles.legendCircle} ${styles.tokenRed}`} aria-hidden="true" />
            Feu rouge
          </li>
          <li className={styles.legendItem}>
            <span className={`${styles.legendCircle} ${styles.tokenGreen}`} aria-hidden="true" />
            Feu vert
          </li>
          <li className={styles.legendItem}>
            <span className={`${styles.legendCircle} ${styles.tokenOrange}`} aria-hidden="true" />
            Feu orange
          </li>
          <li className={styles.legendItem}>
            <span className={`${styles.legendCircle} ${styles.tokenBlue}`} aria-hidden="true" />
            File / Circulation
          </li>
        </ul>
      </section>

      <section className={panel.section}>
        <h2 className={panel.label}>Vitesse simulation</h2>
        <div className={styles.speedTrack}>
          <span>Lente</span>
          <input
            type="range"
            min={MIN_SPEED}
            max={MAX_SPEED}
            step={0.5}
            value={snapshot.speed}
            aria-label="Vitesse de la simulation"
            style={{ "--pct": `${speedPercent}%` } as CSSProperties}
            onChange={(event) => onSpeedChange(Number.parseFloat(event.target.value))}
          />
          <span>Rapide</span>
        </div>
        <div className={styles.speedValue}>×{snapshot.speed}</div>
      </section>

      <section className={panel.section}>
        <h2 className={panel.label}>État &amp; phase</h2>
        <div className={`${styles.statusPill} ${statusClass}`}>{statusLabel}</div>
        <div className={styles.phaseDots} aria-hidden="true">
          {PHASES.map((phase, index) => (
            <span
              key={`${phase.label}-${index}`}
              className={`${styles.phaseDot} ${index === snapshot.phase && running ? styles.phaseDotActive : ""}`}
            />
          ))}
        </div>
      </section>

      <section className={panel.section}>
        <h2 className={panel.label}>Transition active</h2>
        <div className={`${styles.badge} ${snapshot.activeTransition ? styles.badgeActive : ""}`}>
          {snapshot.activeTransition ?? "—"}
        </div>
      </section>
    </>
  );
}
