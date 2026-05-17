import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { LOG_BUFFER } from "@/constants";
import { openSystemEventStream } from "@/services/events";
import { useTelemetry } from "@/hooks/useTelemetry";
import type { SystemEvent } from "@/model";

type StreamState = "connecting" | "open" | "closed";

export interface Particle {
  id: string;
  edgeId: string;
  sensorId: string | null;
  startedAt: number;
}

export interface StoredRecord {
  sensorId: string;
  value: number | undefined;
  storedAt: number;
}

interface SystemEventsContextValue {
  events: SystemEvent[];
  particles: Particle[];
  tracedSensorId: string | null;
  redisRecords: StoredRecord[];
  postgresRecords: StoredRecord[];
  state: StreamState;
  reset: () => void;
}

const Ctx = createContext<SystemEventsContextValue | null>(null);

export const PARTICLE_DURATION_MS = 1000;

const JOURNEY: { edgeId: string; offsetMs: number }[] = [
  { edgeId: "sensors->telemetry-service", offsetMs: 0 },
  { edgeId: "telemetry-service->redis", offsetMs: 1000 },
  { edgeId: "telemetry-service->rabbitmq", offsetMs: 1000 },
  { edgeId: "rabbitmq->rest-api", offsetMs: 2000 },
  { edgeId: "redis->rest-api", offsetMs: 3000 },
  { edgeId: "rest-api->sql-service", offsetMs: 4000 },
  { edgeId: "rest-api->frontend", offsetMs: 4000 },
  { edgeId: "sql-service->postgres", offsetMs: 5000 },
];

const JOURNEY_TOTAL_MS =
  JOURNEY[JOURNEY.length - 1].offsetMs + PARTICLE_DURATION_MS;

// Back-to-back: the next journey may start as soon as the previous finishes.
const JOURNEY_INTERVAL_MS = JOURNEY_TOTAL_MS;

// Time the journey particle takes to "arrive" at each DB node.
const REDIS_ARRIVAL_MS = 1000 + PARTICLE_DURATION_MS; // telemetry->redis offset + travel
const POSTGRES_ARRIVAL_MS = 5000 + PARTICLE_DURATION_MS; // sql->postgres offset + travel

const MAX_RECORDS = 50;

interface PendingJourney {
  sensorId: string;
  startedAt: number;
  redisDone: boolean;
  postgresDone: boolean;
}

export function SystemEventsProvider({ children }: { children: ReactNode }) {
  const { latest } = useTelemetry();
  const latestRef = useRef(latest);
  useEffect(() => {
    latestRef.current = latest;
  }, [latest]);

  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [tracedSensorId, setTracedSensorId] = useState<string | null>(null);
  const [redisRecords, setRedisRecords] = useState<StoredRecord[]>([]);
  const [postgresRecords, setPostgresRecords] = useState<StoredRecord[]>([]);
  const [state, setState] = useState<StreamState>("connecting");
  const particleSeqRef = useRef(0);
  const lastJourneyAtRef = useRef(0);
  const traceClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingJourneysRef = useRef<PendingJourney[]>([]);

  useEffect(() => {
    const stop = openSystemEventStream(
      (evt) => {
        setEvents((prev) => [evt, ...prev].slice(0, LOG_BUFFER));

        const now = Date.now();
        if (
          evt.kind === "redis_write" &&
          evt.sensorId &&
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

          pendingJourneysRef.current.push({
            sensorId,
            startedAt: now,
            redisDone: false,
            postgresDone: false,
          });
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

      // Promote pending journeys to stored records as the particle "lands" at each DB.
      const redisToAdd: StoredRecord[] = [];
      const postgresToAdd: StoredRecord[] = [];
      for (const j of pendingJourneysRef.current) {
        if (!j.redisDone && now - j.startedAt >= REDIS_ARRIVAL_MS) {
          j.redisDone = true;
          redisToAdd.push({
            sensorId: j.sensorId,
            value: latestRef.current[j.sensorId]?.value,
            storedAt: j.startedAt + REDIS_ARRIVAL_MS,
          });
        }
        if (!j.postgresDone && now - j.startedAt >= POSTGRES_ARRIVAL_MS) {
          j.postgresDone = true;
          postgresToAdd.push({
            sensorId: j.sensorId,
            value: latestRef.current[j.sensorId]?.value,
            storedAt: j.startedAt + POSTGRES_ARRIVAL_MS,
          });
        }
      }
      if (redisToAdd.length) {
        setRedisRecords((prev) => [...redisToAdd, ...prev].slice(0, MAX_RECORDS));
      }
      if (postgresToAdd.length) {
        setPostgresRecords((prev) =>
          [...postgresToAdd, ...prev].slice(0, MAX_RECORDS),
        );
      }
      pendingJourneysRef.current = pendingJourneysRef.current.filter(
        (j) => !j.redisDone || !j.postgresDone,
      );
    }, 200);
    return () => {
      clearInterval(interval);
      if (traceClearTimerRef.current) clearTimeout(traceClearTimerRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    setEvents([]);
    setParticles([]);
    setTracedSensorId(null);
    setRedisRecords([]);
    setPostgresRecords([]);
    pendingJourneysRef.current = [];
    lastJourneyAtRef.current = 0;
    particleSeqRef.current = 0;
    if (traceClearTimerRef.current) {
      clearTimeout(traceClearTimerRef.current);
      traceClearTimerRef.current = null;
    }
  }, []);

  const value = useMemo(
    () => ({
      events,
      particles,
      tracedSensorId,
      redisRecords,
      postgresRecords,
      state,
      reset,
    }),
    [
      events,
      particles,
      tracedSensorId,
      redisRecords,
      postgresRecords,
      state,
      reset,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSystemEvents() {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useSystemEvents must be inside SystemEventsProvider");
  return ctx;
}
