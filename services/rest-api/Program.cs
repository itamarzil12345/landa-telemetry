using Grpc.Net.ClientFactory;
using Microsoft.AspNetCore.SignalR;
using StackExchange.Redis;
using sql_service;
using rest_api;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSignalR();
builder.Services.AddOpenApi();

var corsOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
    ?? RestApiConstants.DefaultCorsOrigins;
builder.Services.AddCors(options =>
    options.AddPolicy(RestApiConstants.CorsPolicy, policy => policy
        .WithOrigins(corsOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()));

builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
    ConnectionMultiplexer.Connect(builder.Configuration.GetValue<string>("Redis:Connection") ?? "redis:6379"));

builder.Services.AddGrpcClient<TelemetryStore.TelemetryStoreClient>(options =>
    options.Address = new Uri(builder.Configuration.GetValue<string>("SqlService:Url") ?? "http://sql-service:5000"));

builder.Services.AddSingleton<SystemEventBus>();
builder.Services.AddHostedService<RabbitMqTelemetryListener>();
builder.Services.AddHostedService<SystemEventsListener>();

var app = builder.Build();

app.UseCors(RestApiConstants.CorsPolicy);

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapGet("/api/sensors", () => Results.Ok(RestApiConstants.SensorIds));

app.MapGet("/api/sensors/{sensorId}/history", async (string sensorId, int limit, TelemetryStore.TelemetryStoreClient grpc) =>
{
    var response = await grpc.GetSensorHistoryAsync(new SensorHistoryRequest
    {
        SensorId = sensorId,
        Limit = limit
    });

    return Results.Ok(response.Items.Select(item => new { item.SensorId, item.TimestampUnix, item.Value }));
});

app.MapGet("/api/health", async (IConnectionMultiplexer redis, TelemetryStore.TelemetryStoreClient grpc) =>
{
    var redisOk = (await redis.GetDatabase().PingAsync()) != default;
    var sqlOk = await grpc.GetSensorHistoryAsync(new SensorHistoryRequest { SensorId = RestApiConstants.SensorIds[0], Limit = 1 }) is not null;
    return Results.Ok(new { Redis = redisOk, Sql = sqlOk, RabbitMQ = true });
});

app.MapHub<TelemetryHub>(RestApiConstants.HubPath);
app.MapSystemEventsStream();

app.Run();
