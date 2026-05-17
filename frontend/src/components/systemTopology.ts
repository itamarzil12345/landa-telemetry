import {
  Activity,
  Cpu,
  Database,
  Globe,
  HardDrive,
  Network,
  Radio,
  Server,
  type LucideIcon,
} from "lucide-react";

interface NodeDef {
  id: string;
  label: string;
  caption: string;
  icon: LucideIcon;
  badge?: string;
  x: number;
  y: number;
}

export const NODES: NodeDef[] = [
  { id: "sensors", label: "Sensors", caption: "20 simulated probes", icon: Radio, badge: "×20", x: 0, y: 500 },
  { id: "telemetry-service", label: "Telemetry Service", caption: "emits readings", icon: Activity, x: 360, y: 500 },
  { id: "redis", label: "Redis", caption: "origin cache", icon: HardDrive, x: 760, y: 0 },
  { id: "rabbitmq", label: "RabbitMQ", caption: "event broker", icon: Network, x: 760, y: 500 },
  { id: "rest-api", label: "REST API", caption: "SignalR + gRPC hub", icon: Server, x: 1160, y: 500 },
  { id: "sql-service", label: "SQL Service", caption: "gRPC persistence", icon: Cpu, x: 1560, y: 500 },
  { id: "postgres", label: "PostgreSQL", caption: "durable store", icon: Database, x: 1960, y: 500 },
  { id: "frontend", label: "Frontend", caption: "this UI (SignalR)", icon: Globe, x: 1160, y: 1000 },
];

type SourceHandle = "left-out" | "right-out" | "top-out" | "bottom-out";
type TargetHandle = "left-in" | "right-in" | "top-in" | "bottom-in";

export type EdgeKind = "data" | "trigger";

export interface EdgeDef {
  id: string;
  source: string;
  target: string;
  sourceHandle: SourceHandle;
  targetHandle: TargetHandle;
  /** "trigger" = control/notification (dashed, dim). "data" (default) = real value flow. */
  kind?: EdgeKind;
  /** Optional inline label rendered at the edge midpoint. */
  label?: string;
}

export const EDGES: EdgeDef[] = [
  { id: "sensors->telemetry-service", source: "sensors", target: "telemetry-service", sourceHandle: "right-out", targetHandle: "left-in" },
  { id: "telemetry-service->redis", source: "telemetry-service", target: "redis", sourceHandle: "top-out", targetHandle: "left-in", label: "cache write" },
  { id: "telemetry-service->rabbitmq", source: "telemetry-service", target: "rabbitmq", sourceHandle: "right-out", targetHandle: "left-in" },
  { id: "redis->rest-api", source: "redis", target: "rest-api", sourceHandle: "right-out", targetHandle: "top-in", label: "read (cache)" },
  { id: "rabbitmq->rest-api", source: "rabbitmq", target: "rest-api", sourceHandle: "right-out", targetHandle: "left-in", kind: "trigger", label: "notify" },
  { id: "rest-api->sql-service", source: "rest-api", target: "sql-service", sourceHandle: "right-out", targetHandle: "left-in" },
  { id: "sql-service->postgres", source: "sql-service", target: "postgres", sourceHandle: "right-out", targetHandle: "left-in" },
  { id: "rest-api->frontend", source: "rest-api", target: "frontend", sourceHandle: "bottom-out", targetHandle: "top-in" },
];
