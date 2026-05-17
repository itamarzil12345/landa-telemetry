import { useEffect, useRef, useState } from "react";
import {
  BaseEdge,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import { PARTICLE_DURATION_MS, type Particle } from "@/hooks/useSystemEvents";

type EdgeKind = "data" | "trigger";

function packetLabel(sensorId: string | null, kind: EdgeKind) {
  if (!sensorId) return null;
  const suffix = sensorId.replace(/^sensor-/, "");
  return kind === "trigger" ? `notify-${suffix}` : `pkt-${suffix}`;
}

function ParticleSvg({
  p,
  pathD,
  kind,
}: {
  p: Particle;
  pathD: string;
  kind: EdgeKind;
}) {
  const pathElRef = useRef<SVGPathElement | null>(null);
  const lastPathDRef = useRef<string | null>(null);
  if (!pathElRef.current || lastPathDRef.current !== pathD) {
    const el = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    el.setAttribute("d", pathD);
    pathElRef.current = el;
    lastPathDRef.current = pathD;
  }

  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let raf = 0;
    let alive = true;
    const tick = () => {
      if (!alive) return;
      const elapsed = Date.now() - p.startedAt;
      if (elapsed < 0) {
        setCoords(null);
        raf = requestAnimationFrame(tick);
        return;
      }
      if (elapsed >= PARTICLE_DURATION_MS) {
        setCoords(null);
        return;
      }
      const progress = elapsed / PARTICLE_DURATION_MS;
      const len = pathElRef.current!.getTotalLength();
      const pt = pathElRef.current!.getPointAtLength(len * progress);
      setCoords({ x: pt.x, y: pt.y });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [p.id, p.startedAt]);

  if (!coords) return null;
  const label = packetLabel(p.sensorId, kind);
  const isTrigger = kind === "trigger";
  return (
    <g>
      <circle
        cx={coords.x}
        cy={coords.y}
        r={isTrigger ? 3.5 : 6}
        fill={isTrigger ? "var(--muted-foreground)" : "var(--primary)"}
        opacity={isTrigger ? 0.85 : 1}
        style={{
          filter: isTrigger ? undefined : "drop-shadow(0 0 8px var(--primary))",
        }}
      />
      {label && !isTrigger && (
        <text
          x={coords.x}
          y={coords.y - 12}
          fontSize={10}
          fontFamily="ui-monospace, monospace"
          fill="var(--primary)"
          textAnchor="middle"
        >
          {label}
        </text>
      )}
    </g>
  );
}

export function FlowEdge(props: EdgeProps) {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
    borderRadius: 18,
  });

  const data = props.data as
    | { particles?: Particle[]; kind?: EdgeKind; label?: string }
    | undefined;
  const particles = data?.particles ?? [];
  const kind: EdgeKind = data?.kind ?? "data";
  const edgeLabel = data?.label;
  const isTrigger = kind === "trigger";

  return (
    <>
      <BaseEdge
        id={props.id}
        path={path}
        style={{
          stroke: isTrigger ? "var(--muted-foreground)" : "var(--muted-foreground)",
          strokeWidth: isTrigger ? 1.2 : 1.6,
          strokeOpacity: isTrigger ? 0.4 : 0.55,
          strokeDasharray: isTrigger ? "5 4" : undefined,
        }}
      />
      {edgeLabel && (
        <g transform={`translate(${labelX}, ${labelY})`}>
          <rect
            x={-(edgeLabel.length * 3.4 + 6)}
            y={-8}
            width={edgeLabel.length * 6.8 + 12}
            height={16}
            rx={8}
            fill="var(--background)"
            stroke="var(--border)"
            strokeWidth={1}
          />
          <text
            fontSize={10}
            fontFamily="ui-monospace, monospace"
            fill={isTrigger ? "var(--muted-foreground)" : "var(--primary)"}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {edgeLabel}
          </text>
        </g>
      )}
      {particles.map((p) => (
        <ParticleSvg key={p.id} p={p} pathD={path} kind={kind} />
      ))}
    </>
  );
}
