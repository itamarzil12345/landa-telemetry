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
  { id: "sensors", label: "Sensors", caption: "20 simulated probes", icon: Radio, badge: "×20", x: 0, y: 260 },
  { id: "telemetry-service", label: "Telemetry Service", caption: "emits readings", icon: Activity, x: 300, y: 260 },
  { id: "redis", label: "Redis", caption: "origin cache", icon: HardDrive, x: 700, y: 60 },
  { id: "rabbitmq", label: "RabbitMQ", caption: "event broker", icon: Network, x: 600, y: 260 },
  { id: "rest-api", label: "REST API", caption: "SignalR + gRPC hub", icon: Server, x: 900, y: 260 },
  { id: "sql-service", label: "SQL Service", caption: "gRPC persistence", icon: Cpu, x: 1200, y: 260 },
  { id: "postgres", label: "PostgreSQL", caption: "durable store", icon: Database, x: 1500, y: 260 },
  { id: "frontend", label: "Frontend", caption: "this UI (SignalR)", icon: Globe, x: 900, y: 520 },
];

type SourceHandle = "left-out" | "right-out" | "top-out" | "bottom-out";
type TargetHandle = "left-in" | "right-in" | "top-in" | "bottom-in";

export interface EdgeDef {
  id: string;
  source: string;
  target: string;
  sourceHandle: SourceHandle;
  targetHandle: TargetHandle;
}

export const EDGES: EdgeDef[] = [
  { id: "sensors->telemetry-service", source: "sensors", target: "telemetry-service", sourceHandle: "right-out", targetHandle: "left-in" },
  { id: "telemetry-service->redis", source: "telemetry-service", target: "redis", sourceHandle: "top-out", targetHandle: "left-in" },
  { id: "telemetry-service->rabbitmq", source: "telemetry-service", target: "rabbitmq", sourceHandle: "right-out", targetHandle: "left-in" },
  { id: "rabbitmq->rest-api", source: "rabbitmq", target: "rest-api", sourceHandle: "right-out", targetHandle: "left-in" },
  { id: "rest-api->sql-service", source: "rest-api", target: "sql-service", sourceHandle: "right-out", targetHandle: "left-in" },
  { id: "sql-service->postgres", source: "sql-service", target: "postgres", sourceHandle: "right-out", targetHandle: "left-in" },
  { id: "rest-api->frontend", source: "rest-api", target: "frontend", sourceHandle: "bottom-out", targetHandle: "top-in" },
];
