using rest_api;

namespace tests.restapi;

public class RestApiTests
{
    [Fact]
    public void SensorCountIs20() => Assert.Equal(20, RestApiConstants.SensorIds.Length);

    [Fact]
    public void TelemetryQueueNameIsTelemetry() => Assert.Equal("telemetry", RestApiConstants.TelemetryQueue);
}
