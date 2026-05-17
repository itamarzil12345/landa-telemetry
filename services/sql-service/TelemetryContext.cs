using Microsoft.EntityFrameworkCore;
using sql_service.Models;

namespace sql_service;

public sealed class TelemetryContext : DbContext
{
    public TelemetryContext(DbContextOptions<TelemetryContext> options)
        : base(options)
    {
    }

    public DbSet<TelemetryEvent> Telemetry { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TelemetryEvent>().HasKey(e => e.Id);
    }
}
