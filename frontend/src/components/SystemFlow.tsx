import { useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { SystemNode, type SystemNodeData } from "@/components/SystemNode";
import { FlowEdge } from "@/components/FlowEdge";
import { EDGES, NODES } from "@/components/systemTopology";
import { useSystemEvents } from "@/hooks/useSystemEvents";

const nodeTypes = { system: SystemNode };
const edgeTypes = { flow: FlowEdge };

interface Props {
  onNodeClick?: (nodeId: string) => void;
}

export function SystemFlow({ onNodeClick }: Props) {
  const { activeEdges } = useSystemEvents();

  const nodes: Node<SystemNodeData>[] = useMemo(
    () =>
      NODES.map((n) => ({
        id: n.id,
        type: "system",
        position: { x: n.x, y: n.y },
        data: { label: n.label, caption: n.caption, icon: n.icon, badge: n.badge, active: false },
        draggable: false,
      })),
    [],
  );

  const decoratedNodes = nodes.map((n) => ({
    ...n,
    data: {
      ...n.data,
      active: [...activeEdges].some((e) => e.startsWith(`${n.id}->`) || e.endsWith(`->${n.id}`)),
    },
  }));

  const edges: Edge[] = useMemo(
    () =>
      EDGES.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        type: "flow",
        data: { active: activeEdges.has(e.id) },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: activeEdges.has(e.id) ? "var(--primary)" : "var(--border)",
          width: 14,
          height: 14,
        },
      })),
    [activeEdges],
  );

  return (
    <div className="h-full min-h-[440px] w-full">
      <ReactFlow
        nodes={decoratedNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        minZoom={0.4}
        maxZoom={2.5}
        onNodeClick={(_, node) => onNodeClick?.(node.id)}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={18}
          size={1}
          color="var(--border)"
        />
        <Controls showInteractive={false} className="!bg-card !border !border-border" />
      </ReactFlow>
    </div>
  );
}
