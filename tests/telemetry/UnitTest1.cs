using telemetry_service;

namespace tests.telemetry;

public class TelemetryTests
{
    [Fact]
    public void SensorCountIs20() => Assert.Equal(20, TelemetryConstants.SensorIds.Length);

    [Fact]
    public void TelemetryQueueNameIsTelemetry() => Assert.Equal("telemetry", TelemetryConstants.TelemetryQueue);
}
