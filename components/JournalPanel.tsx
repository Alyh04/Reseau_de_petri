"use client";

import { useEffect, useRef } from "react";
import type { JournalEntry } from "@/lib/petri/types";
import styles from "./JournalPanel.module.css";

interface JournalPanelProps {
  journal: readonly JournalEntry[];
}

export default function JournalPanel({ journal }: JournalPanelProps) {
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const body = bodyRef.current;
    if (body) body.scrollTop = body.scrollHeight;
  }, [journal]);

  return (
    <section className={styles.root} aria-label="Journal de simulation">
      <h2 className={styles.head}>Journal de simulation</h2>
      <div className={styles.body} ref={bodyRef} role="log" aria-live="off">
        {journal.map((entry, index) => (
          <p key={`${entry.time}-${index}`} className={`${styles.line} ${styles[entry.cls]}`}>
            <span className={styles.time}>[{entry.time}]</span> {entry.msg}
          </p>
        ))}
      </div>
    </section>
  );
}
