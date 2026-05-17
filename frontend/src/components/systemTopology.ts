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
  { id: "sensors", label: "Sensors", caption: "20 simulated probes", icon: Radio, badge: "×20", x: 0, y: 180 },
  { id: "telemetry-service", label: "Telemetry Service", caption: "emits readings", icon: Activity, x: 220, y: 180 },
  { id: "redis", label: "Redis", caption: "origin cache", icon: HardDrive, x: 470, y: 20 },
  { id: "rabbitmq", label: "RabbitMQ", caption: "event broker", icon: Network, x: 470, y: 180 },
  { id: "rest-api", label: "REST API", caption: "SignalR + gRPC hub", icon: Server, x: 720, y: 180 },
  { id: "sql-service", label: "SQL Service", caption: "gRPC persistence", icon: Cpu, x: 970, y: 180 },
  { id: "postgres", label: "PostgreSQL", caption: "durable store", icon: Database, x: 1220, y: 180 },
  { id: "frontend", label: "Frontend", caption: "this UI (SignalR)", icon: Globe, x: 720, y: 340 },
];

type Handle = "left" | "right" | "top" | "bottom";

export interface EdgeDef {
  id: string;
  source: string;
  target: string;
  sourceHandle: Handle;
  targetHandle: Handle;
}

export const EDGES: EdgeDef[] = [
  { id: "sensors->telemetry-service", source: "sensors", target: "telemetry-service", sourceHandle: "right", targetHandle: "left" },
  { id: "telemetry-service->redis", source: "telemetry-service", target: "redis", sourceHandle: "top", targetHandle: "bottom" },
  { id: "telemetry-service->rabbitmq", source: "telemetry-service", target: "rabbitmq", sourceHandle: "right", targetHandle: "left" },
  { id: "rabbitmq->rest-api", source: "rabbitmq", target: "rest-api", sourceHandle: "right", targetHandle: "left" },
  { id: "rest-api->sql-service", source: "rest-api", target: "sql-service", sourceHandle: "right", targetHandle: "left" },
  { id: "sql-service->postgres", source: "sql-service", target: "postgres", sourceHandle: "right", targetHandle: "left" },
  { id: "rest-api->frontend", source: "rest-api", target: "frontend", sourceHandle: "bottom", targetHandle: "top" },
];
