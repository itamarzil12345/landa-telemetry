using Microsoft.EntityFrameworkCore;
using sql_service;
using sql_service.Models;

namespace tests.sqlservice;

public class SqlServiceTests
{
    [Fact]
    public async Task TelemetryContextStoresEvents()
    {
        var options = new DbContextOptionsBuilder<TelemetryContext>()
            .UseInMemoryDatabase("telemetry-test")
            .Options;

        await using var context = new TelemetryContext(options);
        context.Telemetry.Add(new TelemetryEvent
        {
            SensorId = "sensor-01",
            TimestampUnix = 1000,
            Value = 12.3
        });

        await context.SaveChangesAsync();
        Assert.Equal(1, await context.Telemetry.CountAsync());
    }
}
