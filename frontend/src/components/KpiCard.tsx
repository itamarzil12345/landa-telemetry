import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
}

export function KpiCard({ label, value, hint, icon }: Props) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        {icon && (
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <div className="flex min-w-0 flex-col">
          <p className="truncate text-[11px] uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
          {hint && (
            <p className="truncate text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
