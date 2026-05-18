import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-lg">
        <CardContent className="px-6 py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <Compass className="h-7 w-7" />
          </div>

          <h1 className="mt-5 text-2xl font-semibold text-slate-900">
            Page not found
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
            The page you are looking for does not exist or may have been moved.
          </p>

          <div className="mt-6 flex justify-center">
            <Link href="/">
              <Button>Return to dashboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}