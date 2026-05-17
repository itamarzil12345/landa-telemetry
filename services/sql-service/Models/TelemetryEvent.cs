namespace sql_service.Models;

public sealed class TelemetryEvent
{
    public int Id { get; set; }
    public string SensorId { get; set; } = string.Empty;
    public long TimestampUnix { get; set; }
    public double Value { get; set; }
}
