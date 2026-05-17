namespace telemetry_service;

public static class TelemetryConstants
{
    public const string TelemetryQueue = "telemetry";
    public const string SystemEventsExchange = "system.events";
    public const string SourceTelemetry = "telemetry-service";
    public const string TargetRedis = "redis";
    public const string TargetRabbit = "rabbitmq";
    public const string KindRedisWrite = "redis_write";
    public const string KindRabbitPublish = "rabbit_publish";
    public const string LevelInfo = "info";

    public static readonly string[] SensorIds = Enumerable.Range(1, 20)
        .Select(index => $"sensor-{index:00}")
        .ToArray();
}
