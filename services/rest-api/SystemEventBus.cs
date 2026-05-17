using System.Collections.Concurrent;
using System.Threading.Channels;

namespace rest_api;

public sealed class SystemEventBus
{
    private readonly ConcurrentDictionary<Guid, Channel<SystemEvent>> _subscribers = new();

    public IDisposable Subscribe(out ChannelReader<SystemEvent> reader)
    {
        var id = Guid.NewGuid();
        var channel = Channel.CreateBounded<SystemEvent>(new BoundedChannelOptions(256)
        {
            FullMode = BoundedChannelFullMode.DropOldest,
            SingleReader = true,
            SingleWriter = false,
        });
        _subscribers[id] = channel;
        reader = channel.Reader;
        return new Subscription(this, id);
    }

    public void Publish(SystemEvent evt)
    {
        foreach (var (_, channel) in _subscribers)
        {
            channel.Writer.TryWrite(evt);
        }
    }

    private sealed class Subscription(SystemEventBus bus, Guid id) : IDisposable
    {
        public void Dispose()
        {
            if (bus._subscribers.TryRemove(id, out var channel))
                channel.Writer.TryComplete();
        }
    }
}
