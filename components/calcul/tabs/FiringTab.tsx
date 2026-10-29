"use client";

import { useState } from "react";
import { FIRING_SEQUENCE } from "@/lib/petri/analysis";
import { INITIAL_MARKING, TRANSITION_IDS } from "@/lib/petri/model";
import MarkingRow from "../MarkingRow";
import styles from "../CalculModal.module.css";

export default function FiringTab() {
  const [step, setStep] = useState(-1);
  const active = step >= 0 ? FIRING_SEQUENCE[step] : null;
  const before = step > 0 ? FIRING_SEQUENCE[step - 1]?.marking : INITIAL_MARKING;

  return (
    <section className={styles.section}>
      <h3 className={styles.h3}>Séquence de franchissement — Calcul M&apos; = M + C·v</h3>
      <p className={styles.paragraph}>Sélectionnez un tir pour visualiser le calcul détaillé.</p>

      <div className={styles.fireLayout}>
        <div className={styles.fireList}>
          <button
            type="button"
            className={`${styles.fireStep} ${styles.fireInit} ${step === -1 ? styles.fireActive : ""}`}
            aria-pressed={step === -1}
            onClick={() => setStep(-1)}
          >
            <span className={styles.fireNum}>M₀</span>
            <span className={styles.fireDesc}>État initial</span>
            <span className={styles.fireMark}>[{INITIAL_MARKING.join(", ")}]</span>
          </button>

          {FIRING_SEQUENCE.map((item, index) => (
            <button
              key={`${item.label}-${index}`}
              type="button"
              className={`${styles.fireStep} ${step === index ? styles.fireActive : ""}`}
              aria-pressed={step === index}
              onClick={() => setStep(index)}
            >
              <span className={`${styles.fireNum} ${styles.fireNumTransition}`}>{item.label}</span>
              <span className={styles.fireDesc}>{item.desc}</span>
              <span className={styles.fireMark}>[{item.marking.join(", ")}]</span>
            </button>
          ))}
        </div>

        <div className={styles.fireDetail} aria-live="polite">
          {active === null ? (
            <div className={styles.placeholder}>
              <div aria-hidden="true">👆</div>
              <p>Sélectionnez un tir pour voir le calcul détaillé</p>
            </div>
          ) : (
            <>
              <h4 className={styles.fireTitle}>Calcul détaillé — Tir de {active.label}</h4>
              <p className={styles.fireFormula}>M&apos; = M + C · v (v_T = 1)</p>

              <p className={styles.fireSection}>Marquage avant :</p>
              <MarkingRow marking={before ?? INITIAL_MARKING} />

              <p className={styles.fireSection}>Vecteur de tir v</p>
              <div className={styles.markingRow}>
                {TRANSITION_IDS.map((id) => (
                  <div
                    key={id}
                    className={`${styles.markingCell} ${id === active.label ? styles.markingCellHi : ""}`}
                  >
                    <div className={styles.markingName}>{id}</div>
                    <div className={styles.markingValue}>{id === active.label ? "1" : "0"}</div>
                  </div>
                ))}
              </div>

              <p className={styles.fireSection}>Marquage après :</p>
              <MarkingRow marking={active.marking} highlight />

              <p className={styles.fireNote}>{active.desc}</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
