import { PROPERTIES, type PropertyStatus } from "@/lib/petri/analysis";
import styles from "../CalculModal.module.css";

const BADGES: Readonly<Record<PropertyStatus, { symbol: string; label: string }>> = {
  ok: { symbol: "✓", label: "Vérifié" },
  warn: { symbol: "⚠", label: "À vérifier" },
  err: { symbol: "✗", label: "Non vérifié" },
};

function Badge({ status }: { status: PropertyStatus }) {
  const badge = BADGES[status];
  const className =
    status === "ok" ? styles.badgeOk : status === "warn" ? styles.badgeWarn : styles.badgeErr;

  return (
    <span className={`${styles.badge} ${className}`} title={badge.label} aria-label={badge.label}>
      {badge.symbol}
    </span>
  );
}

export default function PropertiesTab() {
  return (
    <section className={styles.section}>
      <h3 className={styles.h3}>Analyse des propriétés formelles du réseau</h3>

      <div className={styles.propertyList}>
        {PROPERTIES.map((property) => (
          <article key={property.name} className={styles.propertyCard}>
            <header className={styles.propertyHeader}>
              <span className={styles.propertyIcon} aria-hidden="true">
                {property.icon}
              </span>
              <span className={styles.propertyName}>{property.name}</span>
              <Badge status={property.status} />
              <span className={styles.propertyResult}>{property.result}</span>
            </header>
            <p className={styles.propertyDetail}>{property.detail}</p>
            <p className={styles.propertyFormula}>{property.formula}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
