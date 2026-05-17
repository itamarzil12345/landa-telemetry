using Grpc.Core;
using Microsoft.EntityFrameworkCore;
using sql_service.Models;

namespace sql_service.Services;

public sealed class TelemetryStorageService : TelemetryStore.TelemetryStoreBase
{
    private readonly TelemetryContext _context;

    public TelemetryStorageService(TelemetryContext context)
    {
        _context = context;
    }

    public override async Task<SaveTelemetryReply> SaveTelemetry(SaveTelemetryRequest request, ServerCallContext context)
    {
        var entity = new TelemetryEvent
        {
            SensorId = request.Telemetry.SensorId,
            TimestampUnix = request.Telemetry.TimestampUnix,
            Value = request.Telemetry.Value
        };

        _context.Telemetry.Add(entity);
        await _context.SaveChangesAsync(context.CancellationToken);
        return new SaveTelemetryReply { Success = true };
    }

    public override async Task<SensorHistoryReply> GetSensorHistory(SensorHistoryRequest request, ServerCallContext context)
    {
        var items = await _context.Telemetry
            .Where(e => e.SensorId == request.SensorId)
            .OrderByDescending(e => e.TimestampUnix)
            .Take(request.Limit > 0 ? request.Limit : 20)
            .ToListAsync(context.CancellationToken);

        var reply = new SensorHistoryReply();
        reply.Items.AddRange(items.Select(e => new TelemetryData
        {
            SensorId = e.SensorId,
            TimestampUnix = e.TimestampUnix,
            Value = e.Value
        }));

        return reply;
    }
}
