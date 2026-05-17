import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface Props {
  tabs: Tab[];
  defaultTabId?: string;
  rightSlot?: ReactNode;
  className?: string;
  panelClassName?: string;
}

export function Tabs({
  tabs,
  defaultTabId,
  rightSlot,
  className,
  panelClassName,
}: Props) {
  const [active, setActive] = useState(defaultTabId ?? tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="flex shrink-0 items-center justify-between border-b">
        <div role="tablist" className="flex gap-1">
          {tabs.map((t) => {
            const isActive = t.id === current?.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(t.id)}
                className={cn(
                  "relative px-5 py-3 text-base font-medium transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
                )}
              </button>
            );
          })}
        </div>
        {rightSlot && <div className="pr-2">{rightSlot}</div>}
      </div>
      <div className={cn("flex min-h-0 flex-1 flex-col pt-4", panelClassName)}>
        {current?.content}
      </div>
    </div>
  );
}
