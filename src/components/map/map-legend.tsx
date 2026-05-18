import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StatusDot } from "@/components/ui/status-dot";
import type { Tone } from "@/types/ui";

function LegendItem({
  label,
  tone,
}: {
  label: string;
  tone: Tone;
}) {
  return (
    <div className="flex items-center gap-2">
      <StatusDot tone={tone} pulse={tone === "success"} />
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  );
}

interface MapLegendProps {
  isLive?: boolean;
  hasPassengerLocation?: boolean;
}

export function MapLegend({
  isLive = true,
  hasPassengerLocation = false,
}: MapLegendProps) {
  return (
    <Card className="border-slate-800/80 bg-slate-900/90">
      <CardContent className="flex flex-wrap items-center gap-4 px-4 py-3">
        <LegendItem
          label="Tracked vehicle"
          tone={isLive ? "success" : "neutral"}
        />
        <LegendItem label="Route path" tone="info" />
        <LegendItem label="Stops" tone="neutral" />
        <LegendItem label="Origin / Destination" tone="warning" />
        {hasPassengerLocation ? (
          <LegendItem label="Your location" tone="success" />
        ) : null}
        <Badge tone={isLive ? "success" : "warning"}>
          {isLive ? "Passenger live tracking" : "Awaiting fresh realtime updates"}
        </Badge>
      </CardContent>
    </Card>
  );
}