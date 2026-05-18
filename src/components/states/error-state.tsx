import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorStateProps {
  title?: string;
  description: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  description,
  retryLabel = "Try again",
  onRetry,
}: ErrorStateProps) {
  return (
    <Card>
      <CardContent className="px-6 py-12 text-center sm:px-8 sm:py-14">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-sm bg-red-500/10 text-red-400">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-slate-100">{title}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
          {description}
        </p>
        {onRetry ? (
          <Button variant="secondary" className="mt-5" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
