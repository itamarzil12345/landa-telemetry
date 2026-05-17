import { CheckCircle2, XCircle, type LucideIcon } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LABELS } from "@/constants";

interface Props {
  label: string;
  description: string;
  healthy: boolean;
  icon: LucideIcon;
}

export function HealthCard({ label, description, healthy, icon: Icon }: Props) {
  const StatusIcon = healthy ? CheckCircle2 : XCircle;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">{label}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
          <Badge variant={healthy ? "success" : "destructive"}>
            <StatusIcon className="h-3 w-3" />
            {healthy ? LABELS.healthy : LABELS.down}
          </Badge>
        </div>
      </CardHeader>
    </Card>
  );
}
