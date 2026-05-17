import { API_BASE_URL, EVENTS_STREAM_PATH } from "@/constants";
import type { SystemEvent } from "@/model";

export function openSystemEventStream(
  onEvent: (evt: SystemEvent) => void,
  onStateChange?: (state: "open" | "closed") => void,
): () => void {
  const url = `${API_BASE_URL}${EVENTS_STREAM_PATH}`;
  let source: EventSource | null = null;
  let retryHandle: ReturnType<typeof setTimeout> | null = null;
  let cancelled = false;

  const wire = () => {
    if (cancelled) return;
    source = new EventSource(url);
    source.onopen = () => onStateChange?.("open");
    source.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as Omit<SystemEvent, "receivedAt">;
        onEvent({ ...parsed, receivedAt: Date.now() });
      } catch {
        /* skip malformed */
      }
    };
    source.onerror = () => {
      onStateChange?.("closed");
      source?.close();
      source = null;
      retryHandle = setTimeout(wire, 2000);
    };
  };

  wire();

  return () => {
    cancelled = true;
    if (retryHandle) clearTimeout(retryHandle);
    source?.close();
    source = null;
  };
}
