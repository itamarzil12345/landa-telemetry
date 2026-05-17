using System.Text;
using System.Text.Json;
using RabbitMQ.Client;

namespace telemetry_service;

public static class SystemEventPublisher
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public static Task DeclareAsync(IChannel channel, CancellationToken token) =>
        channel.ExchangeDeclareAsync(
            exchange: TelemetryConstants.SystemEventsExchange,
            type: ExchangeType.Fanout,
            durable: false,
            autoDelete: false,
            cancellationToken: token);

    public static ValueTask PublishAsync(IChannel channel, SystemEvent evt, CancellationToken token)
    {
        var body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(evt, JsonOptions));
        return channel.BasicPublishAsync(
            exchange: TelemetryConstants.SystemEventsExchange,
            routingKey: string.Empty,
            body: body,
            cancellationToken: token);
    }
}
