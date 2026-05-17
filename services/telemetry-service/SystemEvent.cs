namespace telemetry_service;

public sealed record SystemEvent(
    string Source,
    string Target,
    string Kind,
    string? SensorId,
    string Level,
    string? Message
);
