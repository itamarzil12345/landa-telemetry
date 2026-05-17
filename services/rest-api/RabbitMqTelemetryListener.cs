using System.Text;
using System.Text.Json;
using Grpc.Core;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using sql_service;

namespace rest_api;

public sealed class RabbitMqTelemetryListener : BackgroundService
{
    private readonly IHubContext<TelemetryHub> _hub;
    private readonly TelemetryStore.TelemetryStoreClient _grpcClient;
    private readonly SystemEventBus _bus;
    private readonly ConnectionFactory _factory;

    public RabbitMqTelemetryListener(IHubContext<TelemetryHub> hub,
        TelemetryStore.TelemetryStoreClient grpcClient,
        SystemEventBus bus,
        IConfiguration configuration)
    {
        _hub = hub;
        _grpcClient = grpcClient;
        _bus = bus;
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
            var telemetry = JsonSerializer.Deserialize<TelemetryMessage>(json);
            if (telemetry is not null)
            {
                _bus.Publish(new SystemEvent(RestApiConstants.SourceRabbit, RestApiConstants.TargetRestApi, RestApiConstants.KindRabbitConsume, telemetry.SensorId, RestApiConstants.LevelInfo, null));

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
