using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using StackExchange.Redis;
using sql_service;

namespace rest_api;

public sealed class RabbitMqTelemetryListener : BackgroundService
{
    private readonly IHubContext<TelemetryHub> _hub;
    private readonly TelemetryStore.TelemetryStoreClient _grpcClient;
    private readonly IConnectionMultiplexer _redis;
    private readonly SystemEventBus _bus;
    private readonly ConnectionFactory _factory;
    private readonly ILogger<RabbitMqTelemetryListener> _logger;

    public RabbitMqTelemetryListener(IHubContext<TelemetryHub> hub,
        TelemetryStore.TelemetryStoreClient grpcClient,
        IConnectionMultiplexer redis,
        SystemEventBus bus,
        IConfiguration configuration,
        ILogger<RabbitMqTelemetryListener> logger)
    {
        _hub = hub;
        _grpcClient = grpcClient;
        _redis = redis;
        _bus = bus;
        _logger = logger;
        _factory = new ConnectionFactory
        {
            Uri = new Uri(configuration.GetValue<string>("RabbitMq:Url") ?? "amqp://guest:guest@rabbitmq:5672")
        };
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await using var connection = await ConnectWithRetryAsync(stoppingToken);
        await using var channel = await connection.CreateChannelAsync(cancellationToken: stoppingToken);
        await channel.QueueDeclareAsync(queue: RestApiConstants.TelemetryQueue, durable: true, exclusive: false, autoDelete: false, cancellationToken: stoppingToken);

        var consumer = new AsyncEventingBasicConsumer(channel);
        consumer.ReceivedAsync += async (_, eventArgs) =>
        {
            var body = eventArgs.Body.ToArray();
            var json = Encoding.UTF8.GetString(body);
            var rabbitPayload = JsonSerializer.Deserialize<TelemetryMessage>(json);
            if (rabbitPayload is not null)
            {
                _bus.Publish(new SystemEvent(RestApiConstants.SourceRabbit, RestApiConstants.TargetRestApi, RestApiConstants.KindRabbitConsume, rabbitPayload.SensorId, RestApiConstants.LevelInfo, null));

                // Per spec: "Redis -> API -> UI". Rabbit is the trigger; Redis is the data source.
                // Fall back to the rabbit payload only if the Redis read fails.
                var telemetry = await ReadFromRedisAsync(rabbitPayload.SensorId, stoppingToken)
                                ?? rabbitPayload;

                await _hub.Clients.All.SendAsync("TelemetryUpdate", telemetry, stoppingToken);
                _bus.Publish(new SystemEvent(RestApiConstants.SourceRestApi, RestApiConstants.TargetFrontend, RestApiConstants.KindSignalrPush, telemetry.SensorId, RestApiConstants.LevelInfo, null));

                await _grpcClient.SaveTelemetryAsync(new SaveTelemetryRequest
                {
                    Telemetry = new TelemetryData
                    {
                        SensorId = telemetry.SensorId,
                        TimestampUnix = telemetry.TimestampUnix,
                        Value = telemetry.Value
                    }
                }, cancellationToken: stoppingToken);
                _bus.Publish(new SystemEvent(RestApiConstants.SourceRestApi, RestApiConstants.TargetSqlService, RestApiConstants.KindGrpcSave, telemetry.SensorId, RestApiConstants.LevelInfo, null));
                _bus.Publish(new SystemEvent(RestApiConstants.SourceSqlService, RestApiConstants.TargetPostgres, RestApiConstants.KindPostgresWrite, telemetry.SensorId, RestApiConstants.LevelInfo, null));
            }

            await channel.BasicAckAsync(eventArgs.DeliveryTag, multiple: false, cancellationToken: stoppingToken);
        };

        await channel.BasicConsumeAsync(queue: RestApiConstants.TelemetryQueue, autoAck: false, consumer: consumer, cancellationToken: stoppingToken);
        await Task.Delay(Timeout.Infinite, stoppingToken);
    }

    private async Task<TelemetryMessage?> ReadFromRedisAsync(string sensorId, CancellationToken token)
    {
        try
        {
            var entries = await _redis.GetDatabase().HashGetAllAsync($"sensor:{sensorId}");
            if (entries.Length == 0)
            {
                _bus.Publish(new SystemEvent(RestApiConstants.SourceRedis, RestApiConstants.TargetRestApi, RestApiConstants.KindRedisReadMiss, sensorId, RestApiConstants.LevelWarn, "cache miss"));
                return null;
            }

            long timestamp = 0;
            double value = 0;
            foreach (var entry in entries)
            {
                if (entry.Name == "timestamp") long.TryParse(entry.Value, out timestamp);
                else if (entry.Name == "value") double.TryParse(entry.Value, out value);
            }

            _bus.Publish(new SystemEvent(RestApiConstants.SourceRedis, RestApiConstants.TargetRestApi, RestApiConstants.KindRedisRead, sensorId, RestApiConstants.LevelInfo, null));
            return new TelemetryMessage(sensorId, timestamp, value);
        }
        catch (Exception ex) when (!token.IsCancellationRequested)
        {
            _logger.LogWarning(ex, "Redis read failed for {SensorId}; falling back to rabbit payload", sensorId);
            _bus.Publish(new SystemEvent(RestApiConstants.SourceRedis, RestApiConstants.TargetRestApi, RestApiConstants.KindRedisReadMiss, sensorId, RestApiConstants.LevelWarn, ex.Message));
            return null;
        }
    }

    private async Task<IConnection> ConnectWithRetryAsync(CancellationToken token)
    {
        while (true)
        {
            try { return await _factory.CreateConnectionAsync(token); }
            catch when (!token.IsCancellationRequested)
            {
                await Task.Delay(TimeSpan.FromSeconds(2), token);
            }
        }
    }
}
