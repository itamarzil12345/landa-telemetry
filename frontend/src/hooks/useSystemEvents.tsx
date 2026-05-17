import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { LOG_BUFFER } from "@/constants";
import { openSystemEventStream } from "@/services/events";
import type { SystemEvent } from "@/model";

type StreamState = "connecting" | "open" | "closed";

export interface Particle {
  id: string;
  edgeId: string;
  sensorId: string | null;
  startedAt: number;
}

interface SystemEventsContextValue {
  events: SystemEvent[];
  particles: Particle[];
  tracedSensorId: string | null;
  counters: Record<string, number>;
  lastSensorByKind: Record<string, string | null>;
  state: StreamState;
}

const Ctx = createContext<SystemEventsContextValue | null>(null);

export const PARTICLE_DURATION_MS = 1000;

const JOURNEY: { edgeId: string; offsetMs: number }[] = [
  { edgeId: "sensors->telemetry-service", offsetMs: 0 },
  { edgeId: "telemetry-service->redis", offsetMs: 1000 },
  { edgeId: "telemetry-service->rabbitmq", offsetMs: 2000 },
  { edgeId: "rabbitmq->rest-api", offsetMs: 3000 },
  { edgeId: "rest-api->sql-service", offsetMs: 4000 },
  { edgeId: "rest-api->frontend", offsetMs: 4000 },
  { edgeId: "sql-service->postgres", offsetMs: 5000 },
];

const JOURNEY_TOTAL_MS =
  JOURNEY[JOURNEY.length - 1].offsetMs + PARTICLE_DURATION_MS;

// Back-to-back: the next journey may start as soon as the previous finishes.
const JOURNEY_INTERVAL_MS = JOURNEY_TOTAL_MS;

export function SystemEventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [tracedSensorId, setTracedSensorId] = useState<string | null>(null);
  const [counters, setCounters] = useState<Record<string, number>>({});
  const [lastSensorByKind, setLastSensorByKind] = useState<
    Record<string, string | null>
  >({});
  const [state, setState] = useState<StreamState>("connecting");
  const particleSeqRef = useRef(0);
  const lastJourneyAtRef = useRef(0);
  const traceClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stop = openSystemEventStream(
      (evt) => {
        setEvents((prev) => [evt, ...prev].slice(0, LOG_BUFFER));
        setCounters((prev) => ({
          ...prev,
          [evt.kind]: (prev[evt.kind] ?? 0) + 1,
        }));
        if (evt.sensorId) {
          setLastSensorByKind((prev) =>
            prev[evt.kind] === evt.sensorId ? prev : { ...prev, [evt.kind]: evt.sensorId },
          );
        }

        const now = Date.now();
        if (
          evt.kind === "redis_write" &&
          now - lastJourneyAtRef.current >= JOURNEY_INTERVAL_MS
        ) {
          lastJourneyAtRef.current = now;
          const sensorId = evt.sensorId;
          setTracedSensorId(sensorId);
          if (traceClearTimerRef.current) clearTimeout(traceClearTimerRef.current);
          traceClearTimerRef.current = setTimeout(
            () => setTracedSensorId(null),
            JOURNEY_TOTAL_MS,
          );

          const next: Particle[] = JOURNEY.map(({ edgeId, offsetMs }) => ({
            id: `p-${particleSeqRef.current++}`,
            edgeId,
            sensorId,
            startedAt: now + offsetMs,
          }));
          setParticles((prev) => [...prev, ...next].slice(-30));
        }
      },
      (s) => setState(s === "open" ? "open" : "closed"),
    );
    return stop;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setParticles((prev) => {
        const fresh = prev.filter(
          (p) => now - p.startedAt < PARTICLE_DURATION_MS,
        );
        return fresh.length === prev.length ? prev : fresh;
      });
    }, 400);
    return () => {
      clearInterval(interval);
      if (traceClearTimerRef.current) clearTimeout(traceClearTimerRef.current);
    };
  }, []);

  const value = useMemo(
    () => ({
      events,
      particles,
      tracedSensorId,
      counters,
      lastSensorByKind,
      state,
    }),
    [events, particles, tracedSensorId, counters, lastSensorByKind, state],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSystemEvents() {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useSystemEvents must be inside SystemEventsProvider");
  return ctx;
}
