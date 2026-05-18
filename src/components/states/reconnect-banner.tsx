import { RotateCw, WifiOff, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ConnectionStatus } from "@/lib/utils/status";

interface ReconnectBannerProps {
  status: ConnectionStatus;
  onRetry?: () => void;
}

export function ReconnectBanner({ status, onRetry }: ReconnectBannerProps) {
  if (status === "connected") return null;

  const isRetrying = status === "connecting" || status === "reconnecting";
  const isError = status === "error";
  const isStale = status === "stale";

  return (
    <Card
      className={
        isError
          ? "border-red-500/30 bg-red-500/10"
          : "border-amber-500/30 bg-amber-500/10"
      }
    >
      <CardContent className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-start gap-3">
          <div
            className={
              isError
                ? "mt-0.5 rounded-sm bg-red-500/15 p-2 text-red-400"
                : "mt-0.5 rounded-sm bg-amber-500/15 p-2 text-amber-400"
            }
          >
            {isRetrying ? (
              <RotateCw className="h-4.5 w-4.5 animate-spin" />
            ) : isError ? (
              <AlertTriangle className="h-4.5 w-4.5" />
            ) : (
              <WifiOff className="h-4.5 w-4.5" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={`text-sm font-semibold ${
                  isError ? "text-red-300" : "text-amber-300"
                }`}
              >
                Live connection attention required
              </p>
              <Badge tone={isError ? "danger" : "warning"}>{status}</Badge>
            </div>
            <p
              className={`mt-1 text-sm ${
                isError ? "text-red-400" : "text-amber-400"
              }`}
            >
              {isRetrying
                ? "The client is attempting to reconnect to the realtime stream."
                : isStale
                  ? "The latest live packet has become stale. Map and ETA may not reflect the latest movement."
                  : isError
                    ? "The realtime connection encountered an error. Manual retry may be required."
                    : "Realtime updates are temporarily unavailable."}
            </p>
          </div>
        </div>

        {onRetry ? (
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={onRetry}
          >
            Retry connection
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
