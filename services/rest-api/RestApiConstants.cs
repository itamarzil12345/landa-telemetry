namespace rest_api;

public static class RestApiConstants
{
    public const string TelemetryQueue = "telemetry";
    public const string HubPath = "/telemetryHub";
    public const string CorsPolicy = "FrontendCors";

    public const string SystemEventsExchange = "system.events";
    public const string EventsStreamPath = "/api/events/stream";

    public const string SourceRabbit = "rabbitmq";
    public const string SourceRestApi = "rest-api";
    public const string SourceRedis = "redis";
    public const string SourceSqlService = "sql-service";
    public const string TargetRestApi = "rest-api";
    public const string TargetRedis = "redis";
    public const string TargetSqlService = "sql-service";
    public const string TargetPostgres = "postgres";
    public const string TargetFrontend = "frontend";
    public const string KindRabbitConsume = "rabbit_consume";
    public const string KindRedisRead = "redis_read";
    public const string KindRedisReadMiss = "redis_read_miss";
    public const string KindGrpcSave = "grpc_save";
    public const string KindPostgresWrite = "postgres_write";
    public const string KindSignalrPush = "signalr_push";
    public const string LevelInfo = "info";
    public const string LevelWarn = "warn";

    public static readonly string[] DefaultCorsOrigins =
    {
        "http://localhost:4173",
        "http://localhost:5173"
    };

    public static readonly string[] SensorIds = Enumerable.Range(1, 20)
        .Select(index => $"sensor-{index:00}")
        .ToArray();
}
