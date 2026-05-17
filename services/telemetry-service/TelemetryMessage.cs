namespace telemetry_service;

public sealed record TelemetryMessage(string SensorId, long TimestampUnix, double Value);
