import { useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { SystemNode, type SystemNodeData } from "@/components/SystemNode";
import { FlowEdge } from "@/components/FlowEdge";
import { EDGES, NODES } from "@/components/systemTopology";
import { useSystemEvents } from "@/hooks/useSystemEvents";
import { useFocusedNode } from "@/hooks/useFocusedNode";

const nodeTypes = { system: SystemNode };
const edgeTypes = { flow: FlowEdge };

interface Props {
  onNodeClick?: (nodeId: string) => void;
}

function SystemFlowInner({ onNodeClick }: Props) {
  const { particles } = useSystemEvents();
  const focusedNodeId = useFocusedNode();

  const particlesByEdge = useMemo(() => {
    const map = new Map<string, typeof particles>();
    for (const p of particles) {
      const arr = map.get(p.edgeId) ?? [];
      arr.push(p);
      map.set(p.edgeId, arr);
    }
    return map;
  }, [particles]);

  const decoratedNodes: Node<SystemNodeData>[] = useMemo(
    () =>
      NODES.map((n) => ({
        id: n.id,
        type: "system",
        position: { x: n.x, y: n.y },
        data: {
          label: n.label,
          caption: n.caption,
          icon: n.icon,
          badge: n.badge,
          active: false,
          focused: n.id === focusedNodeId,
        },
      })),
    [focusedNodeId],
  );

  const edges: Edge[] = useMemo(
    () =>
      EDGES.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        type: "flow",
        data: {
          particles: particlesByEdge.get(e.id) ?? [],
          kind: e.kind ?? "data",
          label: e.label,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "var(--border)",
          width: 14,
          height: 14,
        },
      })),
    [particlesByEdge],
  );

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={decoratedNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2.5}
        onNodeClick={(_, node) => {
          if (node.id === "frontend") return;
          onNodeClick?.(node.id);
        }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border)" />
      </ReactFlow>
    </div>
  );
}

export function SystemFlow({ onNodeClick }: Props) {
  return (
    <div className="h-full w-full">
      <ReactFlowProvider>
        <SystemFlowInner onNodeClick={onNodeClick} />
      </ReactFlowProvider>
    </div>
  );
}
