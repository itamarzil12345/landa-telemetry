import {
  Activity,
  Cpu,
  Database,
  Globe,
  HardDrive,
  Network,
  Server,
  type LucideIcon,
} from "lucide-react";

export type ArchNodeType = "service" | "infra" | "client";

export interface CodeSnippet {
  title: string;
  description: string;
  language: "csharp" | "typescript" | "json" | "proto" | "sql" | "yaml";
  filePath: string;
  code: string;
}

export interface CommunicationEdge {
  target: string;
  protocol: string;
  direction: "out" | "in" | "both";
  description: string;
}

export type ArchNodeData = {
  id: string;
  label: string;
  type: ArchNodeType;
  icon: LucideIcon;
  tech: string[];
  tagline: string;
  summary: string;
  responsibilities: string[];
  keyFiles: { path: string; description: string }[];
  snippets: CodeSnippet[];
  communications: CommunicationEdge[];
  x: number;
  y: number;
} & Record<string, unknown>;

export const ARCH_NODES: ArchNodeData[] = [
  {
    id: "frontend",
    label: "React UI",
    type: "client",
    icon: Globe,
    tech: ["React 18", "TypeScript", "Vite", "Tailwind", "@microsoft/signalr"],
    tagline: "browser dashboard, 3 pages, push-only data",
    summary:
      "Single-page app the user opens. Talks to the REST API for metadata, opens a SignalR connection for live telemetry, and an SSE connection for operational events. Never polls.",
    responsibilities: [
      "Render three pages: Dashboard, Sensor Details, System Status",
      "Subscribe to SignalR for live telemetry updates",
      "Subscribe to SSE for operational events that drive the System Activity diagram",
      "Fetch sensor metadata + history via REST",
    ],
    keyFiles: [
      { path: "frontend/src/hooks/useTelemetry.tsx", description: "SignalR connection lifecycle + telemetry state" },
      { path: "frontend/src/hooks/useSystemEvents.tsx", description: "SSE connection + journey orchestrator" },
      { path: "frontend/src/services/api.ts", description: "REST client (sensors, history, health, admin reset)" },
      { path: "frontend/src/App.tsx", description: "Provider hierarchy (Telemetry → SystemEvents → Router)" },
    ],
    snippets: [
      {
        title: "SignalR connection setup",
        description:
          "On mount, the TelemetryProvider builds a SignalR hub connection with auto-reconnect, subscribes to the TelemetryUpdate event, and starts the connection with a retry loop on failure.",
        language: "typescript",
        filePath: "frontend/src/hooks/useTelemetry.tsx",
        code: `const hub: HubConnection = new HubConnectionBuilder()
  .withUrl(\`\${API_BASE_URL}\${HUB_PATH}\`)
  .withAutomaticReconnect()
  .configureLogging(LogLevel.Warning)
  .build();

hub.on(HUB_EVENT, (update: TelemetryMessage) => {
  setLatest((prev) => ({ ...prev, [update.sensorId]: update }));
  setHistory((prev) => ({
    ...prev,
    [update.sensorId]: [...(prev[update.sensorId] ?? []), update].slice(-HISTORY_WINDOW),
  }));
});`,
      },
      {
        title: "SSE for operational events",
        description:
          "The frontend opens a long-lived EventSource for /api/events/stream. Each message is a SystemEvent describing what just happened in the backend (redis_write, signalr_push, etc.) which drives the live diagram and the Event Stream tab.",
        language: "typescript",
        filePath: "frontend/src/services/events.ts",
        code: `const source = new EventSource(\`\${API_BASE_URL}\${EVENTS_STREAM_PATH}\`);
source.onmessage = (event) => {
  const parsed = JSON.parse(event.data) as Omit<SystemEvent, "receivedAt">;
  onEvent({ ...parsed, receivedAt: Date.now() });
};`,
      },
    ],
    communications: [
      { target: "rest-api", protocol: "REST", direction: "out", description: "Metadata + admin only" },
      { target: "rest-api", protocol: "SignalR (WebSocket)", direction: "in", description: "Live telemetry push" },
      { target: "rest-api", protocol: "SSE", direction: "in", description: "Operational event stream" },
    ],
    x: 0,
    y: 520,
  },
  {
    id: "rest-api",
    label: "REST API",
    type: "service",
    icon: Server,
    tech: [".NET 9", "ASP.NET Core", "SignalR", "RabbitMQ.Client", "StackExchange.Redis", "Grpc.Net.Client"],
    tagline: "the gateway — REST + SignalR + RabbitMQ consumer",
    summary:
      "The only service the UI talks to. Consumes telemetry from RabbitMQ, reads the actual value from Redis, pushes to SignalR clients, and persists via gRPC. Also runs a separate observability pipeline that broadcasts operational events as SSE.",
    responsibilities: [
      "Expose REST endpoints for the UI (sensors, history, health, admin reset)",
      "Host the SignalR hub at /telemetryHub",
      "Consume the 'telemetry' RabbitMQ queue and orchestrate Redis → SignalR → gRPC",
      "Bridge the 'system.events' fanout exchange to SSE for the UI",
    ],
    keyFiles: [
      { path: "services/rest-api/Program.cs", description: "DI registration + endpoint mapping" },
      { path: "services/rest-api/RabbitMqTelemetryListener.cs", description: "Telemetry consumer — Redis read + SignalR + gRPC" },
      { path: "services/rest-api/TelemetryHub.cs", description: "Empty SignalR Hub class" },
      { path: "services/rest-api/SystemEventsListener.cs", description: "Operational event consumer (fanout → in-process bus)" },
      { path: "services/rest-api/SystemEventsEndpoint.cs", description: "SSE endpoint, subscribes to SystemEventBus" },
    ],
    snippets: [
      {
        title: "RabbitMQ consumer — the live telemetry pipeline",
        description:
          "For every message on the 'telemetry' queue, the listener reads the canonical value from Redis (falls back to the rabbit payload on miss), pushes it to all SignalR clients, and persists it over gRPC to sql-service. This is the implementation of the spec's Redis → API → UI path.",
        language: "csharp",
        filePath: "services/rest-api/RabbitMqTelemetryListener.cs",
        code: `consumer.ReceivedAsync += async (_, eventArgs) =>
{
    var rabbitPayload = JsonSerializer.Deserialize<TelemetryMessage>(
        Encoding.UTF8.GetString(eventArgs.Body.ToArray()));
    if (rabbitPayload is not null)
    {
        _bus.Publish(new SystemEvent(SourceRabbit, TargetRestApi, KindRabbitConsume,
            rabbitPayload.SensorId, LevelInfo, null));

        // Per spec: "Redis -> API -> UI". Rabbit is the trigger; Redis is the source.
        var telemetry = await ReadFromRedisAsync(rabbitPayload.SensorId, stoppingToken)
                        ?? rabbitPayload;

        await _hub.Clients.All.SendAsync("TelemetryUpdate", telemetry, stoppingToken);
        await _grpcClient.SaveTelemetryAsync(new SaveTelemetryRequest { ... });
    }
    await channel.BasicAckAsync(eventArgs.DeliveryTag, multiple: false, ...);
};`,
      },
      {
        title: "Redis read with fallback",
        description:
          "HashGetAll the sensor:{id} hash. On miss or error, return null so the caller falls back to the rabbit payload. Publishes a redis_read or redis_read_miss system event either way so the UI's live diagram shows what actually happened.",
        language: "csharp",
        filePath: "services/rest-api/RabbitMqTelemetryListener.cs",
        code: `private async Task<TelemetryMessage?> ReadFromRedisAsync(string sensorId, CancellationToken token)
{
    try
    {
        var entries = await _redis.GetDatabase().HashGetAllAsync($"sensor:{sensorId}");
        if (entries.Length == 0)
        {
            _bus.Publish(new SystemEvent(SourceRedis, TargetRestApi,
                KindRedisReadMiss, sensorId, LevelWarn, "cache miss"));
            return null;
        }

        long timestamp = 0; double value = 0;
        foreach (var entry in entries)
        {
            if (entry.Name == "timestamp") long.TryParse(entry.Value, out timestamp);
            else if (entry.Name == "value") double.TryParse(entry.Value, out value);
        }

        _bus.Publish(new SystemEvent(SourceRedis, TargetRestApi,
            KindRedisRead, sensorId, LevelInfo, null));
        return new TelemetryMessage(sensorId, timestamp, value);
    }
    catch (Exception ex) { /* publish miss, return null */ }
}`,
      },
      {
        title: "SignalR push to all clients",
        description:
          "IHubContext<TelemetryHub> is DI-injected. Clients.All selects every connected browser; SendAsync serializes the payload as JSON and writes the SignalR Invocation frame to each WebSocket. The await returns when frames are queued, not when clients acknowledge.",
        language: "csharp",
        filePath: "services/rest-api/RabbitMqTelemetryListener.cs",
        code: `await _hub.Clients.All.SendAsync("TelemetryUpdate", telemetry, stoppingToken);`,
      },
      {
        title: "Endpoint wiring (Program.cs)",
        description:
          "Where everything is plugged together — SignalR service registered, Redis multiplexer + gRPC client as singletons, two background services started, then route mapping including the SignalR hub mount and the admin reset endpoint.",
        language: "csharp",
        filePath: "services/rest-api/Program.cs",
        code: `builder.Services.AddSignalR();
builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
    ConnectionMultiplexer.Connect(builder.Configuration.GetValue<string>("Redis:Connection")
        ?? "redis:6379"));
builder.Services.AddGrpcClient<TelemetryStore.TelemetryStoreClient>(options =>
    options.Address = new Uri(builder.Configuration.GetValue<string>("SqlService:Url")
        ?? "http://sql-service:5000"));
builder.Services.AddSingleton<SystemEventBus>();
builder.Services.AddHostedService<RabbitMqTelemetryListener>();
builder.Services.AddHostedService<SystemEventsListener>();

// ... endpoints ...
app.MapHub<TelemetryHub>(RestApiConstants.HubPath);     // /telemetryHub
app.MapSystemEventsStream();                              // /api/events/stream
app.MapPost("/api/admin/reset", async (...) => { ... });`,
      },
      {
        title: "Operational events → SSE",
        description:
          "Background service binds an exclusive auto-delete queue to the 'system.events' fanout exchange and pushes every event into the in-process SystemEventBus. The SSE endpoint subscribes to the bus and streams each event as text/event-stream to every connected browser.",
        language: "csharp",
        filePath: "services/rest-api/SystemEventsListener.cs",
        code: `await channel.ExchangeDeclareAsync(SystemEventsExchange, ExchangeType.Fanout, ...);
var queue = await channel.QueueDeclareAsync(queue: string.Empty,
    durable: false, exclusive: true, autoDelete: true, ...);
await channel.QueueBindAsync(queue.QueueName, SystemEventsExchange, string.Empty, ...);

consumer.ReceivedAsync += (_, ea) =>
{
    var evt = JsonSerializer.Deserialize<SystemEvent>(
        Encoding.UTF8.GetString(ea.Body.ToArray()), JsonOptions);
    if (evt is not null) _bus.Publish(evt);
    return Task.CompletedTask;
};`,
      },
    ],
    communications: [
      { target: "frontend", protocol: "REST", direction: "in", description: "Sensors, history, health, admin reset" },
      { target: "frontend", protocol: "SignalR", direction: "out", description: "Live TelemetryUpdate broadcasts" },
      { target: "frontend", protocol: "SSE", direction: "out", description: "Operational event stream" },
      { target: "redis", protocol: "Redis HashGetAll", direction: "out", description: "Read sensor:{id} on every rabbit message" },
      { target: "rabbitmq", protocol: "AMQP consume", direction: "in", description: "Trigger from the 'telemetry' queue + 'system.events' fanout" },
      { target: "sql-service", protocol: "gRPC", direction: "out", description: "SaveTelemetry / GetSensorHistory / ClearTelemetry" },
    ],
    x: 450,
    y: 520,
  },
  {
    id: "telemetry-service",
    label: "Telemetry Worker",
    type: "service",
    icon: Activity,
    tech: [".NET 9", "BackgroundService", "RabbitMQ.Client", "StackExchange.Redis"],
    tagline: "simulates 20 sensors, emits one reading/sec each",
    summary:
      "Headless C# worker. On every tick (1Hz) it shuffles the sensor list and for each sensor: writes the reading to Redis (HSET) AND publishes the full payload on RabbitMQ. Shuffling ensures journeys traced by the UI don't always start with sensor-01.",
    responsibilities: [
      "Generate one TelemetryMessage per sensor per second",
      "Write the canonical latest-value to Redis as a hash",
      "Publish the same payload on RabbitMQ for downstream consumers",
      "Publish redis_write + rabbit_publish operational events for observability",
    ],
    keyFiles: [
      { path: "services/telemetry-service/Worker.cs", description: "Main loop with Redis write + RabbitMQ publish" },
      { path: "services/telemetry-service/Program.cs", description: "DI + Redis multiplexer registration" },
      { path: "services/telemetry-service/TelemetryConstants.cs", description: "Sensor IDs, queue name, event kinds" },
      { path: "services/telemetry-service/SystemEventPublisher.cs", description: "Helper to declare + publish to system.events fanout" },
    ],
    snippets: [
      {
        title: "Main worker loop",
        description:
          "Every second, shuffle the 20-sensor list and for each: build a TelemetryMessage, HashSet to Redis, BasicPublish to RabbitMQ, and emit two operational events for the live diagram. Sleeps 1 second between bursts.",
        language: "csharp",
        filePath: "services/telemetry-service/Worker.cs",
        code: `var idList = TelemetryConstants.SensorIds;
var rng = new Random();
while (!stoppingToken.IsCancellationRequested)
{
    foreach (var sensorId in idList.OrderBy(_ => rng.Next()))
    {
        var telemetry = new TelemetryMessage(sensorId,
            DateTimeOffset.UtcNow.ToUnixTimeSeconds(), GetSensorValue(sensorId));
        var payload = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(telemetry));

        await _redis.GetDatabase().HashSetAsync($"sensor:{sensorId}", new HashEntry[]
        {
            new("timestamp", telemetry.TimestampUnix),
            new("value", telemetry.Value)
        });
        await SystemEventPublisher.PublishAsync(channel,
            new SystemEvent(SourceTelemetry, TargetRedis, KindRedisWrite, sensorId, LevelInfo, null),
            stoppingToken);

        await channel.BasicPublishAsync(exchange: string.Empty,
            routingKey: TelemetryConstants.TelemetryQueue, body: payload,
            cancellationToken: stoppingToken);
        await SystemEventPublisher.PublishAsync(channel,
            new SystemEvent(SourceTelemetry, TargetRabbit, KindRabbitPublish, sensorId, LevelInfo, null),
            stoppingToken);
    }
    await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);
}`,
      },
      {
        title: "Sensor list",
        description: "Exactly 20 sensors generated from indices 1-20, formatted with a leading zero.",
        language: "csharp",
        filePath: "services/telemetry-service/TelemetryConstants.cs",
        code: `public static readonly string[] SensorIds = Enumerable.Range(1, 20)
    .Select(index => $"sensor-{index:00}")
    .ToArray();`,
      },
      {
        title: "RabbitMQ connection setup",
        description:
          "Connect to RabbitMQ with retry, open a channel, declare the durable 'telemetry' queue, declare the 'system.events' fanout exchange. Connection URL comes from config (Docker env var) with sensible default.",
        language: "csharp",
        filePath: "services/telemetry-service/Worker.cs",
        code: `await using var connection = await ConnectWithRetryAsync(stoppingToken);
await using var channel = await connection.CreateChannelAsync(cancellationToken: stoppingToken);
await channel.QueueDeclareAsync(queue: TelemetryConstants.TelemetryQueue,
    durable: true, exclusive: false, autoDelete: false, ...);
await SystemEventPublisher.DeclareAsync(channel, stoppingToken);`,
      },
    ],
    communications: [
      { target: "redis", protocol: "Redis HashSetAsync", direction: "out", description: "HSET sensor:{id} on every reading (cache write)" },
      { target: "rabbitmq", protocol: "AMQP publish", direction: "out", description: "TelemetryMessage to 'telemetry' queue + system events to fanout" },
    ],
    x: 450,
    y: 0,
  },
  {
    id: "sql-service",
    label: "SQL Service",
    type: "service",
    icon: Cpu,
    tech: [".NET 9", "gRPC", "Entity Framework Core", "Npgsql"],
    tagline: "gRPC persistence boundary",
    summary:
      "gRPC server (no HTTP). Provides three RPCs against PostgreSQL: SaveTelemetry, GetSensorHistory, ClearTelemetry. The only service that touches the database directly.",
    responsibilities: [
      "Expose the TelemetryStore gRPC service",
      "Persist incoming telemetry into the Telemetry table",
      "Return recent rows for the UI's history chart",
      "Truncate the table on admin reset",
    ],
    keyFiles: [
      { path: "services/sql-service/Protos/greet.proto", description: "gRPC contract (service is TelemetryStore — proto file name is legacy from scaffolding)" },
      { path: "services/sql-service/Services/TelemetryStorageService.cs", description: "RPC implementation" },
      { path: "services/sql-service/TelemetryContext.cs", description: "EF Core DbContext" },
      { path: "services/sql-service/Models/TelemetryEvent.cs", description: "EF entity" },
      { path: "services/sql-service/Program.cs", description: "DB connection + migrations + MapGrpcService" },
    ],
    snippets: [
      {
        title: "gRPC contract",
        description: "Three RPCs + their request/reply messages. csharp_namespace makes the generated code land in the sql_service namespace.",
        language: "proto",
        filePath: "services/sql-service/Protos/greet.proto",
        code: `syntax = "proto3";
option csharp_namespace = "sql_service";
package telemetry;

service TelemetryStore {
  rpc SaveTelemetry (SaveTelemetryRequest) returns (SaveTelemetryReply);
  rpc GetSensorHistory (SensorHistoryRequest) returns (SensorHistoryReply);
  rpc ClearTelemetry (ClearTelemetryRequest) returns (ClearTelemetryReply);
}

message TelemetryData {
  string sensorId = 1;
  int64 timestampUnix = 2;
  double value = 3;
}`,
      },
      {
        title: "SaveTelemetry implementation",
        description: "Maps the gRPC request into an EF entity and calls SaveChangesAsync. EF Core translates that into a single INSERT.",
        language: "csharp",
        filePath: "services/sql-service/Services/TelemetryStorageService.cs",
        code: `public override async Task<SaveTelemetryReply> SaveTelemetry(SaveTelemetryRequest request, ServerCallContext context)
{
    var entity = new TelemetryEvent
    {
        SensorId = request.Telemetry.SensorId,
        TimestampUnix = request.Telemetry.TimestampUnix,
        Value = request.Telemetry.Value
    };

    _context.Telemetry.Add(entity);
    await _context.SaveChangesAsync(context.CancellationToken);
    return new SaveTelemetryReply { Success = true };
}`,
      },
      {
        title: "ClearTelemetry (admin reset)",
        description: "Uses EF Core 7+ ExecuteDeleteAsync — single DELETE FROM \"Telemetry\" statement, no entities loaded into memory.",
        language: "csharp",
        filePath: "services/sql-service/Services/TelemetryStorageService.cs",
        code: `public override async Task<ClearTelemetryReply> ClearTelemetry(ClearTelemetryRequest request, ServerCallContext context)
{
    var deleted = await _context.Telemetry.ExecuteDeleteAsync(context.CancellationToken);
    return new ClearTelemetryReply { DeletedRows = deleted };
}`,
      },
      {
        title: "DbContext + entity",
        description: "Minimal EF Core setup. Single DbSet, primary key on Id (auto-increment).",
        language: "csharp",
        filePath: "services/sql-service/TelemetryContext.cs",
        code: `public sealed class TelemetryContext : DbContext
{
    public TelemetryContext(DbContextOptions<TelemetryContext> options) : base(options) { }
    public DbSet<TelemetryEvent> Telemetry { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder) =>
        modelBuilder.Entity<TelemetryEvent>().HasKey(e => e.Id);
}`,
      },
    ],
    communications: [
      { target: "rest-api", protocol: "gRPC", direction: "in", description: "TelemetryStore RPCs called by rest-api" },
      { target: "postgres", protocol: "EF Core / Npgsql", direction: "out", description: "INSERT, SELECT, DELETE" },
    ],
    x: 900,
    y: 520,
  },
  {
    id: "redis",
    label: "Redis",
    type: "infra",
    icon: HardDrive,
    tech: ["Redis 7", "Hash data type"],
    tagline: "live cache — latest value per sensor",
    summary:
      "Single source of truth for 'what is the current value?'. Telemetry-service writes; rest-api reads. Holds 20 keys (sensor:01 ... sensor:20), each a hash with timestamp and value fields. Loss of Redis means up to 1 second of UI staleness; no permanent data loss.",
    responsibilities: [
      "Store the most recent reading per sensor as a hash",
      "Serve fast reads for the live UI feed",
      "Get truncated on admin reset",
    ],
    keyFiles: [],
    snippets: [
      {
        title: "Write pattern (telemetry-service)",
        description: "HashSet overwrites the two fields in the sensor:{id} hash on every emit. O(1) write per sensor.",
        language: "csharp",
        filePath: "services/telemetry-service/Worker.cs",
        code: `await _redis.GetDatabase().HashSetAsync($"sensor:{sensorId}", new HashEntry[]
{
    new("timestamp", telemetry.TimestampUnix),
    new("value", telemetry.Value)
});`,
      },
      {
        title: "Read pattern (rest-api)",
        description: "HashGetAllAsync fetches both fields in one round trip. On empty result, return null to signal a cache miss to the caller.",
        language: "csharp",
        filePath: "services/rest-api/RabbitMqTelemetryListener.cs",
        code: `var entries = await _redis.GetDatabase().HashGetAllAsync($"sensor:{sensorId}");
if (entries.Length == 0) return null;  // miss → caller falls back to rabbit payload`,
      },
      {
        title: "Admin reset (rest-api)",
        description: "Iterates the 20 known sensor IDs and deletes each. No wildcard / FLUSHDB so we don't blow away anything else that might share the database.",
        language: "csharp",
        filePath: "services/rest-api/Program.cs",
        code: `foreach (var sensorId in RestApiConstants.SensorIds)
{
    if (await redis.GetDatabase().KeyDeleteAsync($"sensor:{sensorId}"))
        deletedKeys++;
}`,
      },
    ],
    communications: [
      { target: "telemetry-service", protocol: "HashSet (write)", direction: "in", description: "1 write per sensor per second" },
      { target: "rest-api", protocol: "HashGetAll (read)", direction: "in", description: "1 read per rabbit message" },
    ],
    x: 0,
    y: 0,
  },
  {
    id: "rabbitmq",
    label: "RabbitMQ",
    type: "infra",
    icon: Network,
    tech: ["RabbitMQ 3", "Two patterns: durable queue + fanout exchange"],
    tagline: "decoupled notification + observability bus",
    summary:
      "Two channels: a durable 'telemetry' queue (trigger for the live data path — also carries the payload as a Redis-down fallback), and a 'system.events' fanout exchange for operational events. Lets us satisfy 'no polling' while keeping producers decoupled from consumers.",
    responsibilities: [
      "Durable 'telemetry' queue: telemetry-service publishes, rest-api consumes",
      "'system.events' fanout exchange: any service publishes, rest-api subscribes per-instance",
      "Buffer messages if rest-api is slow or restarting (no loss during deploys)",
      "Provide the extension point for future async subscribers (alerting, analytics, archival)",
    ],
    keyFiles: [],
    snippets: [
      {
        title: "Telemetry queue — publish (telemetry-service)",
        description: "Publish to the default exchange with the queue name as the routing key — direct delivery to that queue.",
        language: "csharp",
        filePath: "services/telemetry-service/Worker.cs",
        code: `await channel.QueueDeclareAsync(queue: TelemetryConstants.TelemetryQueue,
    durable: true, exclusive: false, autoDelete: false, ...);

await channel.BasicPublishAsync(exchange: string.Empty,
    routingKey: TelemetryConstants.TelemetryQueue,
    body: payload, cancellationToken: stoppingToken);`,
      },
      {
        title: "Telemetry queue — consume (rest-api)",
        description: "AsyncEventingBasicConsumer with manual ack. Each message triggers the Redis read + SignalR + gRPC fan-out, then BasicAck.",
        language: "csharp",
        filePath: "services/rest-api/RabbitMqTelemetryListener.cs",
        code: `var consumer = new AsyncEventingBasicConsumer(channel);
consumer.ReceivedAsync += async (_, eventArgs) =>
{
    // ... do work ...
    await channel.BasicAckAsync(eventArgs.DeliveryTag, multiple: false, ...);
};
await channel.BasicConsumeAsync(queue: TelemetryQueue, autoAck: false,
    consumer: consumer, cancellationToken: stoppingToken);`,
      },
      {
        title: "system.events fanout exchange",
        description: "Each rest-api instance gets its own exclusive auto-delete queue bound to the fanout exchange — every instance receives every event, regardless of how many replicas there are.",
        language: "csharp",
        filePath: "services/rest-api/SystemEventsListener.cs",
        code: `await channel.ExchangeDeclareAsync(SystemEventsExchange, ExchangeType.Fanout, ...);
var queue = await channel.QueueDeclareAsync(queue: string.Empty,
    durable: false, exclusive: true, autoDelete: true, ...);
await channel.QueueBindAsync(queue.QueueName, SystemEventsExchange, string.Empty, ...);`,
      },
    ],
    communications: [
      { target: "telemetry-service", protocol: "AMQP publish", direction: "in", description: "TelemetryMessages → 'telemetry' queue + system events → fanout" },
      { target: "rest-api", protocol: "AMQP consume", direction: "in", description: "Drains the 'telemetry' queue and the fanout-bound queue" },
    ],
    x: 900,
    y: 0,
  },
  {
    id: "postgres",
    label: "PostgreSQL",
    type: "infra",
    icon: Database,
    tech: ["PostgreSQL 16"],
    tagline: "durable historical store",
    summary:
      "The system of record for telemetry history. Only sql-service connects (via EF Core). Schema is a single Telemetry table with an auto-increment Id, sensor_id, timestamp_unix, and value.",
    responsibilities: [
      "Persist every TelemetryEvent for historical queries",
      "Survive service restarts (data lives in a Docker volume)",
      "Get truncated on admin reset",
    ],
    keyFiles: [],
    snippets: [
      {
        title: "Schema (from the EF entity)",
        description: "Generated by EnsureCreated() on first startup. One table, one auto-increment PK, no indexes by default (worth adding (sensor_id, timestamp_unix) for the history query in a real deployment).",
        language: "csharp",
        filePath: "services/sql-service/Models/TelemetryEvent.cs",
        code: `public sealed class TelemetryEvent
{
    public int Id { get; set; }
    public string SensorId { get; set; } = string.Empty;
    public long TimestampUnix { get; set; }
    public double Value { get; set; }
}`,
      },
      {
        title: "Connection string",
        description: "Comes in via the Database:ConnectionString env var from docker-compose; default targets the postgres service over the compose network.",
        language: "csharp",
        filePath: "services/sql-service/Program.cs",
        code: `var connectionString = builder.Configuration.GetValue<string>("Database:ConnectionString")
    ?? "Host=postgres;Database=press;Username=postgres;Password=postgres";
builder.Services.AddDbContext<TelemetryContext>(options => options.UseNpgsql(connectionString));`,
      },
    ],
    communications: [
      { target: "sql-service", protocol: "Postgres wire / Npgsql", direction: "in", description: "INSERTs from SaveTelemetry; SELECTs from GetSensorHistory; DELETE on ClearTelemetry" },
    ],
    x: 1350,
    y: 520,
  },
];

type SourceHandle = "left-out" | "right-out" | "top-out" | "bottom-out";
type TargetHandle = "left-in" | "right-in" | "top-in" | "bottom-in";

export interface ArchEdgeDef {
  id: string;
  source: string;
  target: string;
  label: string;
  /** "data" = real data flow. "trigger" = control/notification (dashed). */
  kind: "data" | "trigger";
  sourceHandle: SourceHandle;
  targetHandle: TargetHandle;
}

export const ARCH_EDGES: ArchEdgeDef[] = [
  // Frontend ↔ REST API (horizontal at bottom row)
  { id: "frontend-rest-api", source: "frontend", target: "rest-api",
    label: "REST + SignalR", kind: "data",
    sourceHandle: "right-out", targetHandle: "left-in" },

  // Telemetry-service fan-out: writes to Redis (left) + publishes to RabbitMQ (right)
  { id: "telemetry-redis", source: "telemetry-service", target: "redis",
    label: "HSET", kind: "data",
    sourceHandle: "left-out", targetHandle: "right-in" },
  { id: "telemetry-rabbit", source: "telemetry-service", target: "rabbitmq",
    label: "publish", kind: "data",
    sourceHandle: "right-out", targetHandle: "left-in" },

  // Redis → REST API (read for live feed) — comes in from top-left of rest-api
  { id: "redis-rest-api", source: "redis", target: "rest-api",
    label: "read", kind: "data",
    sourceHandle: "bottom-out", targetHandle: "top-in" },

  // RabbitMQ → REST API (notify trigger) — comes in from top-right of rest-api
  { id: "rabbit-rest-api", source: "rabbitmq", target: "rest-api",
    label: "notify", kind: "trigger",
    sourceHandle: "bottom-out", targetHandle: "top-in" },

  // REST API → SQL Service (gRPC, horizontal continuation)
  { id: "rest-api-sql", source: "rest-api", target: "sql-service",
    label: "gRPC", kind: "data",
    sourceHandle: "right-out", targetHandle: "left-in" },

  // SQL → Postgres (final horizontal hop)
  { id: "sql-postgres", source: "sql-service", target: "postgres",
    label: "EF Core", kind: "data",
    sourceHandle: "right-out", targetHandle: "left-in" },
];
