import type { ControlAction, Side } from "@/lib/petri/types";
import { PauseIcon, PlayIcon, ResetIcon, StopIcon } from "./icons";
import panel from "./Panel.module.css";
import styles from "./ControlPanel.module.css";

interface ControlPanelProps {
  running: boolean;
  paused: boolean;
  onControl: (action: ControlAction, value?: number) => void;
  onAddVehicle: (side: Side) => boolean;
}

export default function ControlPanel({ running, paused, onControl, onAddVehicle }: ControlPanelProps) {
  return (
    <>
      <section className={panel.section}>
        <h2 className={panel.label}>Contrôles</h2>
        <div className={styles.group}>
          <button
            type="button"
            className={`${styles.button} ${styles.start}`}
            onClick={() => onControl("start")}
            disabled={running}
          >
            <span className={styles.iconBox}>
              <PlayIcon />
            </span>
            Démarrer
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.pause}`}
            onClick={() => onControl("pause")}
            disabled={!running || paused}
          >
            <span className={styles.iconBox}>
              <PauseIcon />
            </span>
            Pause
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.resume}`}
            onClick={() => onControl("resume")}
            disabled={!paused}
          >
            <span className={styles.iconBox}>
              <PlayIcon />
            </span>
            Reprendre
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.stop}`}
            onClick={() => onControl("stop")}
            disabled={!running}
          >
            <span className={styles.iconBox}>
              <StopIcon />
            </span>
            Arrêter
          </button>
          <button type="button" className={styles.button} onClick={() => onControl("reset")}>
            <span className={styles.iconBox}>
              <ResetIcon />
            </span>
            Réinitialiser
          </button>
        </div>
      </section>

      <section className={panel.section}>
        <h2 className={panel.label}>Ajouter un véhicule</h2>
        <div className={styles.vehicleRow}>
          <button type="button" className={`${styles.vehicle} ${styles.nord}`} onClick={() => onAddVehicle("nord")}>
            ↑ Nord
          </button>
          <button type="button" className={`${styles.vehicle} ${styles.sud}`} onClick={() => onAddVehicle("sud")}>
            ↓ Sud
          </button>
        </div>
        <div className={`${styles.vehicleRow} ${styles.vehicleRowSpaced}`}>
          <button type="button" className={`${styles.vehicle} ${styles.est}`} onClick={() => onAddVehicle("est")}>
            → Est
          </button>
          <button type="button" className={`${styles.vehicle} ${styles.ouest}`} onClick={() => onAddVehicle("ouest")}>
            ← Ouest
          </button>
        </div>
      </section>
    </>
  );
}
