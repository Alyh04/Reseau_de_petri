"use client";

import { useCallback, useEffect, useState } from "react";
import { createInitialSnapshot, TrafficSimulation } from "@/lib/petri/simulation";
import type { ControlAction, Side, SimulationSnapshot } from "@/lib/petri/types";

const TICK_MS = 100;
const MAX_FRAME_MS = 250;
const MAX_TICKS_PER_FRAME = 10;

/**
 * Pilote la simulation hors de React (boucle rAF) et publie un snapshot à 10 Hz.
 * React ne se contente que de rendre l'état : le moteur reste testable et isolé.
 */
export function useSimulation() {
  const [simulation] = useState(() => new TrafficSimulation());
  const [snapshot, setSnapshot] = useState<SimulationSnapshot>(createInitialSnapshot);

  const publish = useCallback(() => {
    setSnapshot(simulation.snapshot());
  }, [simulation]);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    let accumulator = 0;

    const loop = (now: number) => {
      const delta = Math.min(now - last, MAX_FRAME_MS);
      last = now;

      if (!document.hidden) {
        if (!simulation.isRunning || simulation.isPaused) {
          accumulator = 0;
        } else {
          accumulator += delta;

          let ticks = 0;
          while (accumulator >= TICK_MS && ticks < MAX_TICKS_PER_FRAME) {
            simulation.tick(TICK_MS / 1000);
            accumulator -= TICK_MS;
            ticks += 1;
          }
          if (accumulator > TICK_MS * MAX_TICKS_PER_FRAME) accumulator = 0;
          if (ticks > 0) publish();
        }
      }

      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [publish, simulation]);

  const control = useCallback(
    (action: ControlAction, value?: number) => {
      switch (action) {
        case "start":
          simulation.start();
          break;
        case "pause":
          simulation.pause();
          break;
        case "resume":
          simulation.resume();
          break;
        case "stop":
          simulation.stop();
          break;
        case "reset":
          simulation.reset();
          break;
        case "speed":
          simulation.setSpeed(value ?? 1);
          break;
      }
      publish();
    },
    [publish, simulation],
  );

  const addVehicle = useCallback(
    (side: Side) => {
      const added = simulation.addVehicle(side);
      publish();
      return added;
    },
    [publish, simulation],
  );

  return { snapshot, control, addVehicle };
}
