import { useMemo } from "react";
import { useStore } from "@xyflow/react";
import { NODES } from "@/components/systemTopology";

const FOCUS_ZOOM = 1.3;
const FOCUS_RADIUS = 180;
const NODE_HALF_W = 80;
const NODE_HALF_H = 32;

export function useFocusedNode(): string | null {
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
    for (const n of NODES) {
      const d = Math.hypot(n.x + NODE_HALF_W - fx, n.y + NODE_HALF_H - fy);
      if (d < bestDist) {
        bestDist = d;
        best = n.id;
      }
    }
    return bestDist < FOCUS_RADIUS ? best : null;
  }, [transform, width, height]);
}
