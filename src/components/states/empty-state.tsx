import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center sm:px-8 sm:py-14">
        <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-slate-800 text-slate-400">
          <Inbox className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-slate-100">{title}</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
          {description}
        </p>
        {actionLabel ? (
          <Button className="mt-5" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
