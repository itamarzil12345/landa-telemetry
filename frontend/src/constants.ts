import { Activity, Gauge, ShieldCheck, type LucideIcon } from "lucide-react";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5100";

export const ROUTES = {
  dashboard: "/",
  sensorDetails: "/sensor/:sensorId",
  status: "/status",
} as const;

export const NAV_ITEMS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/", label: "Dashboard", icon: Gauge },
  { to: "/sensor/sensor-01", label: "Sensor Details", icon: Activity },
  { to: "/status", label: "System Status", icon: ShieldCheck },
];

export const HUB_PATH = "/telemetryHub";
export const HUB_EVENT = "TelemetryUpdate";
export const EVENTS_STREAM_PATH = "/api/events/stream";
export const HISTORY_WINDOW = 60;
export const LOG_BUFFER = 80;
export const EDGE_ACTIVE_MS = 1200;

export const NODE_IDS = {
  sensors: "sensors",
  telemetry: "telemetry-service",
  redis: "redis",
  rabbit: "rabbitmq",
  restApi: "rest-api",
  sql: "sql-service",
  postgres: "postgres",
  frontend: "frontend",
} as const;

export const EVENT_KIND_TO_EDGE: Record<string, string[]> = {
  redis_write: ["sensors->telemetry-service", "telemetry-service->redis"],
  rabbit_publish: [
    "sensors->telemetry-service",
    "telemetry-service->rabbitmq",
  ],
  rabbit_consume: ["rabbitmq->rest-api"],
  signalr_push: ["rest-api->frontend"],
  grpc_save: ["rest-api->sql-service"],
  postgres_write: ["sql-service->postgres"],
};

export const KIND_LABELS: Record<string, string> = {
  redis_write: "wrote to Redis",
  redis_read: "read from Redis",
  redis_read_miss: "Redis miss; using rabbit payload",
  rabbit_publish: "published to RabbitMQ",
  rabbit_consume: "consumed from RabbitMQ",
  signalr_push: "pushed to client via SignalR",
  grpc_save: "saved over gRPC",
  postgres_write: "wrote to PostgreSQL",
};

export const BRAND = {
  name: "PressOps",
  tagline: "Industrial Telemetry",
};

export const LABELS = {
  totalSensors: "Total Sensors",
  activeNow: "Active Now",
  avgValue: "Average Value",
  peak: "Peak",
  liveActivity: "Live Activity",
  liveActivityHint: "Fleet-wide average over the last 30 seconds.",
  currentValue: "Current",
  min: "Min",
  max: "Max",
  avg: "Avg",
  health: "Service Health",
  healthHint: "Connectivity to infrastructure dependencies.",
  refresh: "Refresh",
  connected: "Live",
  connecting: "Connecting",
  disconnected: "Offline",
  noData: "No data yet",
  overviewTitle: "Operations Overview",
  overviewHint: "Real-time telemetry across every press sensor.",
  sensorsHeading: "Sensors",
  sensorLabel: "Sensor",
  detailChartTitle: "Reading over time",
  detailChartHint: "Combined recent history and live updates.",
  reporting: "of {count} reporting",
  healthy: "Healthy",
  down: "Down",
  systemFlowTitle: "System Activity",
  systemFlowHint: "Live data flow across the platform.",
  logsTitle: "Event Stream",
  logsHint: "Backend activity in real time.",
  logsEmpty: "Waiting for events…",
};

export const COMPONENT_INFO = {
  redis: { label: "Redis", description: "Telemetry origin and fast cache" },
  sql: { label: "PostgreSQL", description: "Durable telemetry storage" },
  rabbit: { label: "RabbitMQ", description: "Backend event distribution" },
};
