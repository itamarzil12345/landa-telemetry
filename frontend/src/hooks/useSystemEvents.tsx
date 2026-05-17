import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { EDGE_ACTIVE_MS, EVENT_KIND_TO_EDGE, LOG_BUFFER } from "@/constants";
import { openSystemEventStream } from "@/services/events";
import type { SystemEvent } from "@/model";

type StreamState = "connecting" | "open" | "closed";

interface SystemEventsContextValue {
  events: SystemEvent[];
  activeEdges: Set<string>;
  state: StreamState;
}

const Ctx = createContext<SystemEventsContextValue | null>(null);

export function SystemEventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [activeEdges, setActiveEdges] = useState<Set<string>>(new Set());
  const [state, setState] = useState<StreamState>("connecting");
  const expiriesRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const stop = openSystemEventStream(
      (evt) => {
        setEvents((prev) => [evt, ...prev].slice(0, LOG_BUFFER));
        const edges = EVENT_KIND_TO_EDGE[evt.kind] ?? [];
        const expiresAt = Date.now() + EDGE_ACTIVE_MS;
        for (const id of edges) expiriesRef.current.set(id, expiresAt);
        setActiveEdges(new Set(expiriesRef.current.keys()));
      },
      (s) => setState(s === "open" ? "open" : "closed"),
    );
    return stop;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      let changed = false;
      for (const [id, exp] of expiriesRef.current) {
        if (exp <= now) {
          expiriesRef.current.delete(id);
          changed = true;
        }
      }
      if (changed) setActiveEdges(new Set(expiriesRef.current.keys()));
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const value = useMemo(
    () => ({ events, activeEdges, state }),
    [events, activeEdges, state],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSystemEvents() {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useSystemEvents must be inside SystemEventsProvider");
  return ctx;
}
