import { useEffect, useRef } from "react";
import {
  BaseEdge,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import { PARTICLE_DURATION_MS, type Particle } from "@/hooks/useSystemEvents";

const DUR_SEC = (PARTICLE_DURATION_MS / 1000).toFixed(3);

export function FlowEdge(props: EdgeProps) {
  const [path] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
    borderRadius: 18,
  });

  const data = props.data as { particles?: Particle[] } | undefined;
  const particles = data?.particles ?? [];

  // Pin animation begin time per particle so re-renders don't restart SMIL.
  const beginRef = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    const ids = new Set(particles.map((p) => p.id));
    for (const id of [...beginRef.current.keys()]) {
      if (!ids.has(id)) beginRef.current.delete(id);
    }
  }, [particles]);
  const getBegin = (p: Particle) => {
    let begin = beginRef.current.get(p.id);
    if (begin === undefined) {
      const elapsedSec = (Date.now() - p.startedAt) / 1000;
      begin = `${(-elapsedSec).toFixed(3)}s`;
      beginRef.current.set(p.id, begin);
    }
    return begin;
  };

  return (
    <>
      <BaseEdge
        id={props.id}
        path={path}
        style={{
          stroke: "var(--muted-foreground)",
          strokeWidth: 1.6,
          strokeOpacity: 0.45,
        }}
      />
      {particles.map((p) => {
        const begin = getBegin(p);
        const packetLabel = p.sensorId
          ? `pkt-${p.sensorId.replace(/^sensor-/, "")}`
          : null;
        return (
          <g key={p.id}>
            <circle
              r={6}
              fill="var(--primary)"
              style={{ filter: "drop-shadow(0 0 8px var(--primary))" }}
            >
              <animateMotion
                dur={`${DUR_SEC}s`}
                begin={begin}
                repeatCount="1"
                fill="freeze"
              >
                <mpath href={`#${props.id}`} />
              </animateMotion>
            </circle>
            {packetLabel && (
              <text
                fontSize={10}
                fontFamily="ui-monospace, monospace"
                fill="var(--primary)"
                textAnchor="middle"
                dy={-12}
              >
                {packetLabel}
                <animateMotion
                  dur={`${DUR_SEC}s`}
                  begin={begin}
                  repeatCount="1"
                  fill="freeze"
                >
                  <mpath href={`#${props.id}`} />
                </animateMotion>
              </text>
            )}
          </g>
        );
      })}
    </>
  );
}
