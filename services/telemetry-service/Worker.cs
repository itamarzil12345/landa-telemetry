using System.Text;
using System.Text.Json;
using RabbitMQ.Client;
using StackExchange.Redis;

namespace telemetry_service;

public sealed class Worker : BackgroundService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly ConnectionFactory _factory;

    public Worker(IConnectionMultiplexer redis, IConfiguration configuration)
    {
        _redis = redis;
        _factory = new ConnectionFactory
        {
            Uri = new Uri(configuration.GetValue<string>("RabbitMq:Url") ?? "amqp://guest:guest@rabbitmq:5672")
        };
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await using var connection = await ConnectWithRetryAsync(stoppingToken);
        await using var channel = await connection.CreateChannelAsync(cancellationToken: stoppingToken);
        await channel.QueueDeclareAsync(queue: TelemetryConstants.TelemetryQueue, durable: true, exclusive: false, autoDelete: false, cancellationToken: stoppingToken);
        await SystemEventPublisher.DeclareAsync(channel, stoppingToken);

        var idList = TelemetryConstants.SensorIds;
        while (!stoppingToken.IsCancellationRequested)
        {
            foreach (var sensorId in idList)
            {
                var telemetry = new TelemetryMessage(sensorId, DateTimeOffset.UtcNow.ToUnixTimeSeconds(), GetSensorValue(sensorId));
                var payload = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(telemetry));

                await _redis.GetDatabase().HashSetAsync($"sensor:{sensorId}", new HashEntry[]
                {
                    new("timestamp", telemetry.TimestampUnix),
                    new("value", telemetry.Value)
                });
                await SystemEventPublisher.PublishAsync(channel, new SystemEvent(TelemetryConstants.SourceTelemetry, TelemetryConstants.TargetRedis, TelemetryConstants.KindRedisWrite, sensorId, TelemetryConstants.LevelInfo, null), stoppingToken);

                await channel.BasicPublishAsync(exchange: string.Empty, routingKey: TelemetryConstants.TelemetryQueue, body: payload, cancellationToken: stoppingToken);
                await SystemEventPublisher.PublishAsync(channel, new SystemEvent(TelemetryConstants.SourceTelemetry, TelemetryConstants.TargetRabbit, TelemetryConstants.KindRabbitPublish, sensorId, TelemetryConstants.LevelInfo, null), stoppingToken);
            }

            await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);
        }
    }

    private static double GetSensorValue(string sensorId)
    {
        var hash = sensorId.GetHashCode();
        var offset = Math.Abs(hash % 100) * 0.1;
        return 50.0 + offset + DateTimeOffset.UtcNow.Second * 0.05;
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
