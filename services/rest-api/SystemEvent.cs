namespace rest_api;

public sealed record SystemEvent(
    string Source,
    string Target,
    string Kind,
    string? SensorId,
    string Level,
    string? Message
);
