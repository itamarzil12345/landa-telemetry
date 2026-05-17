namespace rest_api;

public sealed record TelemetryMessage(string SensorId, long TimestampUnix, double Value);
