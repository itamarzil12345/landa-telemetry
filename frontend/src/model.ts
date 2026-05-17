export interface TelemetryMessage {
  sensorId: string;
  timestampUnix: number;
  value: number;
}

export interface HealthStatus {
  redis: boolean;
  sql: boolean;
  rabbitMQ: boolean;
}

export interface SystemEvent {
  source: string;
  target: string;
  kind: string;
  sensorId: string | null;
  level: "info" | "warn" | "error";
  message: string | null;
  receivedAt: number;
}
