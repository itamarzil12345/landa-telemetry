import type { HealthStatus, TelemetryMessage } from "../model";
import { API_BASE_URL } from "../constants";

const jsonOptions: RequestInit = {
  headers: { "Content-Type": "application/json" },
};

export async function fetchSensors(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/sensors`, jsonOptions);
  return (await response.json()) as string[];
}

export async function fetchSensorHistory(
  sensorId: string,
  limit = 20,
): Promise<TelemetryMessage[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/sensors/${sensorId}/history?limit=${limit}`,
    jsonOptions,
  );
  return (await response.json()) as TelemetryMessage[];
}

export async function fetchHealth(): Promise<HealthStatus> {
  const response = await fetch(`${API_BASE_URL}/api/health`, jsonOptions);
  return (await response.json()) as HealthStatus;
}
