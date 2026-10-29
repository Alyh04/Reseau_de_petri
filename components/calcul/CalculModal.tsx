"use client";

import { useEffect, useRef, useState } from "react";
import DefinitionTab from "./tabs/DefinitionTab";
import FiringTab from "./tabs/FiringTab";
import IncidenceTab from "./tabs/IncidenceTab";
import InitialMarkingTab from "./tabs/InitialMarkingTab";
import PropertiesTab from "./tabs/PropertiesTab";
import ResolutionTab from "./tabs/ResolutionTab";
import styles from "./CalculModal.module.css";

const TABS = [
  { id: "definition", label: "Définition" },
  { id: "marquage", label: "Marquage M₀" },
  { id: "matrice", label: "Matrice C" },
  { id: "franchissement", label: "Franchissement" },
  { id: "proprietes", label: "Propriétés" },
  { id: "resolution", label: "Résolution" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface CalculModalProps {
  onClose: () => void;
}

export default function CalculModal({ onClose }: CalculModalProps) {
  const [tab, setTab] = useState<TabId>("definition");
  const boxRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !boxRef.current) return;

      const focusable = boxRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [onClose]);

  const onTabKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const current = TABS.findIndex((item) => item.id === tab);
    let next = current;

    if (event.key === "ArrowRight") next = (current + 1) % TABS.length;
    else if (event.key === "ArrowLeft") next = (current - 1 + TABS.length) % TABS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = TABS.length - 1;
    else return;

    event.preventDefault();
    const nextTab = TABS[next];
    setTab(nextTab.id);
    document.getElementById(`calc-tab-${nextTab.id}`)?.focus();
  };

  return (
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={styles.box}
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="calc-title"
        aria-describedby="calc-subtitle"
      >
        <header className={styles.header}>
          <div>
            <h2 className={styles.title} id="calc-title">
              📐 Démarche de calcul — Réseau de Petri
            </h2>
            <p className={styles.sub} id="calc-subtitle">
              Modélisation · Analyse · Résolution du carrefour à 4 directions (NS/EO)
            </p>
          </div>
          <button ref={closeRef} type="button" className={styles.close} onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </header>

        <div className={styles.tabs} role="tablist" aria-label="Sections de la démarche de calcul" onKeyDown={onTabKeyDown}>
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`calc-tab-${item.id}`}
              aria-selected={tab === item.id}
              aria-controls="calc-panel"
              tabIndex={tab === item.id ? 0 : -1}
              className={`${styles.tab} ${tab === item.id ? styles.tabActive : ""}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div
          className={styles.content}
          role="tabpanel"
          id="calc-panel"
          aria-labelledby={`calc-tab-${tab}`}
          tabIndex={0}
        >
          {tab === "definition" && <DefinitionTab />}
          {tab === "marquage" && <InitialMarkingTab />}
          {tab === "matrice" && <IncidenceTab />}
          {tab === "franchissement" && <FiringTab />}
          {tab === "proprietes" && <PropertiesTab />}
          {tab === "resolution" && <ResolutionTab />}
        </div>
      </div>
    </div>
  );
}
