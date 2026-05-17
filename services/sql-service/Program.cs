using Microsoft.EntityFrameworkCore;
using sql_service;
using sql_service.Services;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddGrpc();
var connectionString = builder.Configuration.GetValue<string>("Database:ConnectionString")
    ?? "Host=postgres;Database=press;Username=postgres;Password=postgres";
builder.Services.AddDbContext<TelemetryContext>(options => options.UseNpgsql(connectionString));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TelemetryContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    for (var attempt = 1; ; attempt++)
    {
        try { db.Database.EnsureCreated(); break; }
        catch (Exception ex) when (attempt < 30)
        {
            logger.LogWarning("Postgres not ready (attempt {Attempt}): {Message}", attempt, ex.Message);
            Thread.Sleep(TimeSpan.FromSeconds(2));
        }
    }
}

app.MapGrpcService<TelemetryStorageService>();
app.MapGet("/", () => "SQL gRPC service for telemetry storage.");
app.Run();
