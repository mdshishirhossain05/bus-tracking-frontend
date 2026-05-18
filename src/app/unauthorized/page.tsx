import Link from "next/link";
import { ShieldAlert, ArrowLeft, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <Card className="w-full max-w-xl">
        <CardContent className="px-6 py-10 text-center sm:px-8 sm:py-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-sm bg-amber-500/10 text-amber-400">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <h1 className="mt-5 text-2xl font-semibold text-slate-100">
            Access not allowed
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
            Your account is signed in, but it does not have permission to access
            this area of the system. You can return to a valid section or review
            your account details.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Link href="/">
              <Button variant="secondary" className="w-full">
                <ArrowLeft className="h-4 w-4" />
                Go home
              </Button>
            </Link>

            <Link href="/account">
              <Button variant="secondary" className="w-full">
                <UserCircle2 className="h-4 w-4" />
                My account
              </Button>
            </Link>

            <Link href="/login">
              <Button className="w-full">Sign in again</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
