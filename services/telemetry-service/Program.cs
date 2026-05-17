using StackExchange.Redis;
using telemetry_service;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
    ConnectionMultiplexer.Connect(builder.Configuration.GetValue<string>("Redis:Connection") ?? "redis:6379"));

builder.Services.AddHostedService<Worker>();

var host = builder.Build();
host.Run();
