import {
  BaseEdge,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";

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

  const active = Boolean(
    (props.data as { active?: boolean } | undefined)?.active,
  );

  return (
    <>
      <BaseEdge
        id={props.id}
        path={path}
        style={{
          stroke: active ? "var(--primary)" : "var(--border)",
          strokeWidth: active ? 2 : 1.4,
          strokeOpacity: active ? 0.95 : 0.55,
          transition: "stroke 240ms, stroke-opacity 240ms, stroke-width 240ms",
        }}
      />
      {active && (
        <>
          <circle
            r={3.5}
            fill="var(--primary)"
            style={{ filter: "drop-shadow(0 0 6px var(--primary))" }}
          >
            <animateMotion dur="1.4s" repeatCount="indefinite">
              <mpath href={`#${props.id}`} />
            </animateMotion>
          </circle>
          <circle r={2.5} fill="var(--primary)" opacity={0.7}>
            <animateMotion
              dur="1.4s"
              begin="-0.7s"
              repeatCount="indefinite"
            >
              <mpath href={`#${props.id}`} />
            </animateMotion>
          </circle>
        </>
      )}
    </>
  );
}
