import { cn } from "@/lib/utils/cn";

export function Separator({
  className,
  orientation = "horizontal",
}: {
  className?: string;
  orientation?: "horizontal" | "vertical";
}) {
  return (
    <div
      className={cn(
        orientation === "horizontal"
          ? "h-px w-full bg-slate-800"
          : "h-full w-px bg-slate-800",
        className,
      )}
    />
  );
}
