import { useCallback, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  getSmoothStepPath,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ARCH_EDGES, ARCH_NODES, type ArchNodeData } from "./architectureData";
import { ArchitectureNode } from "./ArchitectureNode";
import { ArchitectureDetailPanel } from "./ArchitectureDetailPanel";
import { useArchFocus } from "./useArchFocus";

function ArchEdge(props: EdgeProps) {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
    borderRadius: 18,
  });

  const data = props.data as { label?: string; kind?: "data" | "trigger" } | undefined;
  const isTrigger = data?.kind === "trigger";
  const label = data?.label;
  const markerEnd = typeof props.markerEnd === "string" ? props.markerEnd : undefined;

  return (
    <>
      <path
        id={props.id}
        d={path}
        fill="none"
        markerEnd={markerEnd}
        style={{
          stroke: isTrigger ? "var(--muted-foreground)" : "var(--primary)",
          strokeWidth: isTrigger ? 1.2 : 1.6,
          strokeOpacity: isTrigger ? 0.5 : 0.65,
          strokeDasharray: isTrigger ? "5 4" : undefined,
        }}
      />
      {label && (
        <g transform={`translate(${labelX}, ${labelY})`}>
          <rect
            x={-(label.length * 3.4 + 8)}
            y={-9}
            width={label.length * 6.8 + 16}
            height={18}
            rx={9}
            fill="var(--background)"
            stroke="var(--border)"
            strokeWidth={1}
          />
          <text
            fontSize={10.5}
            fontFamily="ui-monospace, monospace"
            fill={isTrigger ? "var(--muted-foreground)" : "var(--primary)"}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {label}
          </text>
        </g>
      )}
    </>
  );
}

type ArchNodeRfData = ArchNodeData & {
  selected?: boolean;
  focused?: boolean;
  onSnippetClick?: (nodeId: string, snippetTitle: string) => void;
};

const nodeTypes = {
  arch: (props: NodeProps) => (
    <ArchitectureNode data={props.data as ArchNodeRfData} />
  ),
} as never;
const edgeTypes = { arch: ArchEdge } as never;

function ArchitectureFlowInner() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlightSnippet, setHighlightSnippet] = useState<string | null>(null);
  const focusedId = useArchFocus();

  const handleSnippetClick = useCallback(
    (nodeId: string, snippetTitle: string) => {
      setSelectedId(nodeId);
      setHighlightSnippet(snippetTitle);
    },
    [],
  );

  const nodes: Node<ArchNodeRfData>[] = useMemo(
    () =>
      ARCH_NODES.map((n) => ({
        id: n.id,
        type: "arch",
        position: { x: n.x, y: n.y },
        data: {
          ...n,
          selected: n.id === selectedId,
          focused: n.id === focusedId,
          onSnippetClick: handleSnippetClick,
        },
      })),
    [selectedId, focusedId, handleSnippetClick],
  );

  const edges: Edge[] = useMemo(
    () =>
      ARCH_EDGES.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        type: "arch",
        data: { label: e.label, kind: e.kind },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "var(--border)",
          width: 14,
          height: 14,
        },
      })),
    [],
  );

  const selectedNode = selectedId
    ? ARCH_NODES.find((n) => n.id === selectedId) ?? null
    : null;

  return (
    <div className="flex h-full min-h-0 w-full">
      <div className="relative min-h-0 flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          minZoom={0.3}
          maxZoom={2}
          onNodeClick={(_, node) => {
            setSelectedId(node.id);
            setHighlightSnippet(null);
          }}
          nodesDraggable
          nodesConnectable={false}
          elementsSelectable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border)" />
        </ReactFlow>
        {!selectedNode && (
          <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full border border-border bg-card/90 px-3 py-1 text-[11px] text-muted-foreground shadow-sm backdrop-blur-sm">
            Zoom in on any node to expand its details · click to open the full panel
          </div>
        )}
      </div>
      {selectedNode && (
        <ArchitectureDetailPanel
          node={selectedNode}
          highlightSnippetTitle={highlightSnippet}
          onClose={() => {
            setSelectedId(null);
            setHighlightSnippet(null);
          }}
        />
      )}
    </div>
  );
}

export function ArchitectureFlow() {
  return (
    <div className="h-full w-full">
      <ReactFlowProvider>
        <ArchitectureFlowInner />
      </ReactFlowProvider>
    </div>
  );
}
