"use client";

import { useCallback, useEffect, useRef } from "react";
import { PLACES, TRANSITIONS, VISUAL_ARCS } from "@/lib/petri/model";
import type { PlaceDefinition, TransitionDefinition } from "@/lib/petri/types";
import styles from "./PetriCanvas.module.css";

type Node = PlaceDefinition | TransitionDefinition;

const NODES = new Map<string, Node>([
  ...PLACES.map((place) => [place.id, place] as const),
  ...TRANSITIONS.map((transition) => [transition.id, transition] as const),
]);

const COLORS = {
  arc: "rgba(0, 0, 0, 0.22)",
  arcHi: "#d97706",
  placeRing: "rgba(0, 0, 0, 0.22)",
  transBody: "#e2e8f0",
  transBorder: "rgba(0, 0, 0, 0.28)",
  transHi: "#d97706",
  labelId: "#334155",
  labelTransition: "#5a6b82",
  places: {
    red: "#dc2626",
    green: "#16a34a",
    orange: "#ea580c",
    blue: "#2563eb",
  } as const,
};

interface PetriCanvasProps {
  marking: readonly number[];
  activeTransition: string | null;
}

function isPlace(node: Node): node is PlaceDefinition {
  return "kind" in node;
}

function nodeCenter(node: Node, width: number, height: number) {
  return { x: node.x * width, y: node.y * height };
}

/** Point d'intersection entre le bord du nœud et la droite qui le relie à une cible. */
function edgePoint(node: Node, targetX: number, targetY: number, width: number, height: number, radius: number) {
  const center = nodeCenter(node, width, height);
  const dx = targetX - center.x;
  const dy = targetY - center.y;

  if (isPlace(node)) {
    const angle = Math.atan2(dy, dx);
    return {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    };
  }

  const halfWidth = 8;
  const halfHeight = 18;
  const scale = Math.min(
    halfWidth / (Math.abs(dx) || 0.001),
    halfHeight / (Math.abs(dy) || 0.001),
  );
  return { x: center.x + dx * scale, y: center.y + dy * scale };
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options: { color: string; width: number; dashed: boolean },
) {
  ctx.save();
  ctx.strokeStyle = options.color;
  ctx.fillStyle = options.color;
  ctx.lineWidth = options.width;
  ctx.setLineDash(options.dashed ? [3, 3] : []);

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = 7;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(angle - 0.4), y2 - head * Math.sin(angle - 0.4));
  ctx.lineTo(x2 - head * Math.cos(angle + 0.4), y2 - head * Math.sin(angle + 0.4));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawTokens(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  count: number,
  color: string,
) {
  const tokenRadius = Math.max(3.5, radius / 4.6);
  const positions =
    count === 1
      ? [[0, 0]]
      : count === 2
        ? [
            [-tokenRadius, 0],
            [tokenRadius, 0],
          ]
        : count === 3
          ? [
              [0, -tokenRadius],
              [tokenRadius * 0.9, tokenRadius * 0.6],
              [-tokenRadius * 0.9, tokenRadius * 0.6],
            ]
          : [
              [-tokenRadius * 0.8, -tokenRadius * 0.8],
              [tokenRadius * 0.8, -tokenRadius * 0.8],
              [-tokenRadius * 0.8, tokenRadius * 0.8],
              [tokenRadius * 0.8, tokenRadius * 0.8],
            ];

  ctx.fillStyle = color;
  for (const [dx, dy] of positions) {
    ctx.beginPath();
    ctx.arc(cx + dx, cy + dy, tokenRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  if (count > 4) {
    const badgeX = cx + radius * 0.55;
    const badgeY = cy - radius * 0.55;
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, 8, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = 'bold 7px "JetBrains Mono", Consolas, monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(count), badgeX, badgeY);
    ctx.textBaseline = "alphabetic";
  }
}

export default function PetriCanvas({ marking, activeTransition }: PetriCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ marking, activeTransition });
  stateRef.current = { marking, activeTransition };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    const width = parent?.clientWidth ?? canvas.clientWidth;
    const height = parent?.clientHeight ?? canvas.clientHeight;
    if (width < 10 || height < 10) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const radius = Math.max(14, Math.min(20, Math.min(width, height) * 0.032));
    const active = stateRef.current.activeTransition
      ? new Set(stateRef.current.activeTransition.split("+"))
      : null;
    const markingState = stateRef.current.marking;

    // 1. Arcs
    for (const arc of VISUAL_ARCS) {
      const from = NODES.get(arc.from);
      const to = NODES.get(arc.to);
      if (!from || !to) continue;

      const fromCenter = nodeCenter(from, width, height);
      const toCenter = nodeCenter(to, width, height);
      const start = edgePoint(from, toCenter.x, toCenter.y, width, height, radius);
      const end = edgePoint(to, fromCenter.x, fromCenter.y, width, height, radius);
      const highlighted = Boolean(active && (active.has(arc.from) || active.has(arc.to)));

      drawArrow(ctx, start.x, start.y, end.x, end.y, {
        color: highlighted ? COLORS.arcHi : COLORS.arc,
        width: highlighted ? 2 : 1.1,
        dashed: Boolean(arc.dashed),
      });
    }

    // 2. Transitions
    for (const transition of TRANSITIONS) {
      const { x: cx, y: cy } = nodeCenter(transition, width, height);
      const highlighted = Boolean(active?.has(transition.id));

      if (highlighted) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = COLORS.transHi;
      }

      ctx.fillStyle = highlighted ? "rgba(245, 158, 11, 0.22)" : COLORS.transBody;
      ctx.strokeStyle = highlighted ? COLORS.transHi : COLORS.transBorder;
      ctx.lineWidth = highlighted ? 2 : 1;
      ctx.fillRect(cx - 8, cy - 18, 16, 36);
      ctx.strokeRect(cx - 8, cy - 18, 16, 36);
      ctx.shadowBlur = 0;

      ctx.textAlign = "center";
      ctx.fillStyle = highlighted ? COLORS.transHi : COLORS.labelId;
      ctx.font = 'bold 9px Inter, -apple-system, "Segoe UI", sans-serif';
      ctx.fillText(transition.id, cx, cy - 22);

      if (width > 560) {
        ctx.fillStyle = COLORS.labelTransition;
        ctx.font = '8px Inter, -apple-system, "Segoe UI", sans-serif';
        ctx.fillText(transition.short, cx, cy + 26);
      }
    }

    // 3. Places
    for (let index = 0; index < PLACES.length; index += 1) {
      const place = PLACES[index];
      const { x: cx, y: cy } = nodeCenter(place, width, height);
      const count = markingState[index] ?? 0;
      const color = COLORS.places[place.kind];

      if (count > 0 && place.kind !== "blue") {
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 5, 0, Math.PI * 2);
        ctx.fillStyle = `${color}26`;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = "#f4f6f9";
      ctx.fill();
      ctx.strokeStyle = COLORS.placeRing;
      ctx.lineWidth = 1.4;
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.fillStyle = COLORS.labelId;
      ctx.font = 'bold 9px Inter, -apple-system, "Segoe UI", sans-serif';
      ctx.fillText(place.id, cx, cy - radius - 5);

      ctx.fillStyle = color;
      ctx.font = '8px Inter, -apple-system, "Segoe UI", sans-serif';
      ctx.fillText(place.label, cx, cy + radius + 10);

      if (count > 0) {
        drawTokens(ctx, cx, cy, radius, count, color);
      }
    }
  }, []);

  useEffect(() => {
    draw();

    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    const observer = new ResizeObserver(draw);
    if (parent) observer.observe(parent);
    window.addEventListener("resize", draw);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", draw);
    };
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw, marking, activeTransition]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      role="img"
      aria-label="Schéma du réseau de Petri : places, transitions, arcs et jetons du carrefour."
    >
      Schéma du réseau de Petri du carrefour à quatre directions.
    </canvas>
  );
}
