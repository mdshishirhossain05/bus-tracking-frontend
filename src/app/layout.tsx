import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/providers/app-provider";
import { ToastStack } from "@/components/ui/toast-stack";
import { NetworkBanner } from "@/components/states/network-banner";

export const metadata: Metadata = {
  title: "University Bus Tracking System",
  description: "Production-grade realtime bus operations and tracking frontend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <NetworkBanner />
          {children}
          <ToastStack />
        </AppProvider>
      </body>
    </html>
  );
}