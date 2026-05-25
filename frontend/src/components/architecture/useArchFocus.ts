import { useMemo } from "react";
import { useStore } from "@xyflow/react";
import { ARCH_NODES } from "./architectureData";

// At/above this zoom, the closest node to viewport-center "expands" inline.
const FOCUS_ZOOM = 0.95;
// Max distance (in node coordinates) from viewport center to the node's center.
const FOCUS_RADIUS = 260;
// Architecture nodes are w-[280px]. Height varies; ~90px in compact form.
const NODE_HALF_W = 140;
const NODE_HALF_H = 60;

export function useArchFocus(): string | null {
  const transform = useStore((s) => s.transform);
  const width = useStore((s) => s.width);
  const height = useStore((s) => s.height);

  return useMemo(() => {
    const zoom = transform[2];
    if (zoom < FOCUS_ZOOM || !width || !height) return null;
    const fx = (width / 2 - transform[0]) / zoom;
    const fy = (height / 2 - transform[1]) / zoom;
    let best: string | null = null;
    let bestDist = Infinity;
    for (const n of ARCH_NODES) {
      const d = Math.hypot(n.x + NODE_HALF_W - fx, n.y + NODE_HALF_H - fy);
      if (d < bestDist) {
        bestDist = d;
        best = n.id;
      }
    }
    return bestDist < FOCUS_RADIUS ? best : null;
  }, [transform, width, height]);
}
