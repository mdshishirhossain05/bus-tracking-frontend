"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global app error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-lg">
        <CardContent className="px-6 py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-700">
            <TriangleAlert className="h-7 w-7" />
          </div>

          <h1 className="mt-5 text-2xl font-semibold text-slate-900">
            Unexpected application error
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
            Something unexpected happened while rendering the application.
          </p>

          <div className="mt-6 flex justify-center">
            <Button onClick={reset}>Try again</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}