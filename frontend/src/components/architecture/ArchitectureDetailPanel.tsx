import { useEffect, useRef, useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { Button } from "@/components/common/button";
import { cn } from "@/lib/utils";
import type { ArchNodeData } from "./architectureData";

const TYPE_LABEL: Record<ArchNodeData["type"], string> = {
  client: "Client",
  service: "Service",
  infra: "Infrastructure",
};

function CodeBlock({
  code,
  language,
  filePath,
}: {
  code: string;
  language: string;
  filePath: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="overflow-hidden rounded-md border border-border/60 bg-muted/40">
      <div className="flex items-center justify-between gap-2 border-b border-border/40 bg-muted/60 px-2.5 py-1.5">
        <span className="truncate font-mono text-[10px] text-muted-foreground">{filePath}</span>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="rounded bg-background/80 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
            {language}
          </span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(code).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              });
            }}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-background hover:text-foreground"
            aria-label="Copy code"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>
      </div>
      <pre className="max-h-[280px] overflow-auto p-2.5 font-mono text-[11px] leading-snug text-foreground/90">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {heading}
      </h3>
      {children}
    </section>
  );
}

export function ArchitectureDetailPanel({
  node,
  highlightSnippetTitle,
  onClose,
}: {
  node: ArchNodeData | null;
  highlightSnippetTitle?: string | null;
  onClose: () => void;
}) {
  const snippetRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  useEffect(() => {
    if (!node || !highlightSnippetTitle) return;
    const el = snippetRefs.current.get(highlightSnippetTitle);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [node, highlightSnippetTitle]);

  if (!node) return null;
  const Icon = node.icon;

  return (
    <aside className="flex h-full w-full max-w-[460px] flex-col overflow-hidden border-l border-border bg-card">
      <header className="flex items-start gap-3 border-b border-border p-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-semibold">{node.label}</h2>
            <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
              {TYPE_LABEL[node.type]}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{node.tagline}</p>
        </div>
        <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close">
          <X className="h-4 w-4" />
        </Button>
      </header>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        <Section heading="Overview">
          <p className="text-sm leading-relaxed text-foreground/85">{node.summary}</p>
        </Section>

        <Section heading="Tech stack">
          <div className="flex flex-wrap gap-1.5">
            {node.tech.map((t) => (
              <span
                key={t}
                className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-foreground/80"
              >
                {t}
              </span>
            ))}
          </div>
        </Section>

        <Section heading="Responsibilities">
          <ul className="list-disc space-y-1 pl-4 text-sm text-foreground/85">
            {node.responsibilities.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </Section>

        {node.keyFiles.length > 0 && (
          <Section heading="Key files">
            <ul className="space-y-1.5">
              {node.keyFiles.map((f) => (
                <li
                  key={f.path}
                  className="rounded border border-border/60 bg-muted/30 p-2"
                >
                  <div className="font-mono text-[11px] text-primary">{f.path}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {f.description}
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section heading="Communications">
          <ul className="space-y-1.5 text-sm">
            {node.communications.map((c, idx) => (
              <li key={idx} className="flex gap-2 text-foreground/80">
                <span
                  className={cn(
                    "shrink-0 rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider",
                    c.direction === "out" && "bg-primary/15 text-primary",
                    c.direction === "in" && "bg-sky-500/15 text-sky-600 dark:text-sky-300",
                    c.direction === "both" && "bg-muted text-muted-foreground",
                  )}
                >
                  {c.direction}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="font-mono text-[12px] text-foreground/90">
                    {c.target}
                  </span>
                  <span className="ml-1 text-[11px] text-muted-foreground">
                    via {c.protocol}
                  </span>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {c.description}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section heading={`Code · ${node.snippets.length} snippets`}>
          <div className="space-y-3">
            {node.snippets.map((s) => {
              const highlighted = highlightSnippetTitle === s.title;
              return (
                <div
                  key={s.title}
                  ref={(el) => {
                    snippetRefs.current.set(s.title, el);
                  }}
                  className={cn(
                    "space-y-1.5 rounded-md p-1 transition-colors",
                    highlighted && "bg-primary/8 ring-1 ring-primary/30",
                  )}
                >
                  <div>
                    <div className="text-[13px] font-semibold text-foreground">{s.title}</div>
                    <div className="text-[12px] leading-snug text-muted-foreground">
                      {s.description}
                    </div>
                  </div>
                  <CodeBlock
                    code={s.code}
                    language={s.language}
                    filePath={s.filePath}
                  />
                </div>
              );
            })}
          </div>
        </Section>
      </div>
    </aside>
  );
}
