import { NavLink, Outlet } from "react-router-dom";
import { Radio } from "lucide-react";
import { BRAND, LABELS, NAV_ITEMS } from "@/constants";
import { useTelemetry } from "@/hooks/useTelemetry";
import { cn } from "@/lib/utils";

function ConnectionDot() {
  const { connection } = useTelemetry();
  const tone =
    connection === "connected"
      ? "bg-success shadow-[0_0_10px_var(--color-success)]"
      : connection === "connecting"
        ? "bg-warning"
        : "bg-destructive";
  const label =
    connection === "connected"
      ? LABELS.connected
      : connection === "connecting"
        ? LABELS.connecting
        : LABELS.disconnected;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={cn("h-2 w-2 rounded-full animate-pulse", tone)} />
      <span className="uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export default function Layout() {
  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr] bg-background">
      <aside className="flex flex-col gap-6 border-r bg-card/30 px-4 py-6">
        <div className="flex items-center gap-2 px-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 ring-1 ring-primary/20">
            <Radio className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">{BRAND.name}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {BRAND.tagline}
            </p>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto px-2">
          <ConnectionDot />
        </div>
      </aside>
      <main className="overflow-y-auto">
        <div className="mx-auto max-w-7xl px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
