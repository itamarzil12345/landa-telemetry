using System.Text;
using System.Text.Json;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace rest_api;

public sealed class SystemEventsListener : BackgroundService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    private readonly SystemEventBus _bus;
    private readonly ConnectionFactory _factory;

    public SystemEventsListener(SystemEventBus bus, IConfiguration configuration)
    {
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
        await channel.ExchangeDeclareAsync(RestApiConstants.SystemEventsExchange, ExchangeType.Fanout, durable: false, autoDelete: false, cancellationToken: stoppingToken);
        var queue = await channel.QueueDeclareAsync(queue: string.Empty, durable: false, exclusive: true, autoDelete: true, cancellationToken: stoppingToken);
        await channel.QueueBindAsync(queue.QueueName, RestApiConstants.SystemEventsExchange, string.Empty, cancellationToken: stoppingToken);

        var consumer = new AsyncEventingBasicConsumer(channel);
        consumer.ReceivedAsync += (_, ea) =>
        {
            try
            {
                var evt = JsonSerializer.Deserialize<SystemEvent>(Encoding.UTF8.GetString(ea.Body.ToArray()), JsonOptions);
                if (evt is not null) _bus.Publish(evt);
            }
            catch { /* skip malformed */ }
            return Task.CompletedTask;
        };
        await channel.BasicConsumeAsync(queue.QueueName, autoAck: true, consumer: consumer, cancellationToken: stoppingToken);
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
