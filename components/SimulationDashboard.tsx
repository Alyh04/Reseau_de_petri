"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useSimulation } from "@/hooks/useSimulation";
import ControlPanel from "./ControlPanel";
import IncidenceMatrix from "./IncidenceMatrix";
import JournalPanel from "./JournalPanel";
import MarkingPanel from "./MarkingPanel";
import PetriCanvas from "./PetriCanvas";
import RightPanel from "./RightPanel";
import StatsPanel from "./StatsPanel";
import TopBar from "./TopBar";
import styles from "./SimulationDashboard.module.css";

const CalculModal = dynamic(() => import("./calcul/CalculModal"), { ssr: false });

export default function SimulationDashboard() {
  const { snapshot, control, addVehicle } = useSimulation();
  const [calculOpen, setCalculOpen] = useState(false);

  return (
    <div className={styles.shell}>
      <TopBar snapshot={snapshot} onOpenCalcul={() => setCalculOpen(true)} />

      <div className={styles.body}>
        <aside className={`${styles.panel} ${styles.left}`} aria-label="Contrôles et statistiques">
          <ControlPanel
            running={snapshot.running}
            paused={snapshot.paused}
            onControl={control}
            onAddVehicle={addVehicle}
          />
          <StatsPanel snapshot={snapshot} />
        </aside>

        <main className={styles.center}>
          <div className={styles.centerHead}>
            <h2 className={styles.centerTitle}>Simulation — Démarrage des jetons</h2>
            <p className={styles.centerSub}>{snapshot.stateLabel}</p>
          </div>
          <div className={styles.canvasWrap}>
            <PetriCanvas marking={snapshot.marking} activeTransition={snapshot.activeTransition} />
          </div>
        </main>

        <aside className={`${styles.panel} ${styles.right}`} aria-label="Légende, vitesse et phase">
          <RightPanel snapshot={snapshot} onSpeedChange={(value) => control("speed", value)} />
        </aside>
      </div>

      <div className={styles.bottom}>
        <JournalPanel journal={snapshot.journal} />
        <IncidenceMatrix />
        <MarkingPanel marking={snapshot.marking} />
      </div>

      {calculOpen ? <CalculModal onClose={() => setCalculOpen(false)} /> : null}
    </div>
  );
}
