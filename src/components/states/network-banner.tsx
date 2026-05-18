"use client";

import { WifiOff } from "lucide-react";
import { useNetwork } from "@/providers/network-provider";

export function NetworkBanner() {
  const { isOnline } = useNetwork();

  if (isOnline) return null;

  return (
    <div className="border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
      <div className="mx-auto flex max-w-[1600px] items-start gap-2 md:px-2">
        <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          You are offline. Live updates, socket events, and API requests may be
          unavailable until the network reconnects.
        </span>
      </div>
    </div>
  );
}
