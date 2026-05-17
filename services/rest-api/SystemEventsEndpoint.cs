using System.Text.Json;

namespace rest_api;

public static class SystemEventsEndpoint
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public static IEndpointRouteBuilder MapSystemEventsStream(this IEndpointRouteBuilder app)
    {
        app.MapGet(RestApiConstants.EventsStreamPath, async (HttpContext ctx, SystemEventBus bus, CancellationToken token) =>
        {
            ctx.Response.Headers.Append("Content-Type", "text/event-stream");
            ctx.Response.Headers.Append("Cache-Control", "no-cache");
            ctx.Response.Headers.Append("X-Accel-Buffering", "no");

            using var subscription = bus.Subscribe(out var reader);
            await ctx.Response.WriteAsync(": connected\n\n", token);
            await ctx.Response.Body.FlushAsync(token);

            try
            {
                await foreach (var evt in reader.ReadAllAsync(token))
                {
                    var json = JsonSerializer.Serialize(evt, JsonOptions);
                    await ctx.Response.WriteAsync($"data: {json}\n\n", token);
                    await ctx.Response.Body.FlushAsync(token);
                }
            }
            catch (OperationCanceledException) { /* client closed */ }
        });
        return app;
    }
}
