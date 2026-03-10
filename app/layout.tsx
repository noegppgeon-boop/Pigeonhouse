import type { Metadata } from "next";
import "./globals.css";
import WalletProvider from "@/components/WalletProvider";
import { Sidebar, BottomNav, MobileTopBar } from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/shared/Toast";
import CommandModal from "@/components/shared/CommandModal";

export const metadata: Metadata = {
  title: "PigeonHouse — Ritual Launch Terminal",
  description:
    "The deflationary token launchpad on Solana. Inscribe with trust, burn with proof, build with reputation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-txt">
        <WalletProvider>
          <ToastProvider>
            <a href="#main-content" className="skip-link">Skip to content</a>

            {/* Desktop sidebar */}
            <Sidebar />

            {/* Mobile top bar */}
            <MobileTopBar />

            <CommandModal />

            {/* Main content — offset by sidebar on desktop, topbar on mobile */}
            <main id="main-content" role="main" className="min-h-screen pt-12 md:pt-0 md:pl-sidebar pb-16 md:pb-0">
              <div className="mx-auto max-w-[1100px] px-3 sm:px-4 lg:px-6 py-4 lg:py-6">
                {children}
              </div>
            </main>

            {/* Mobile bottom nav */}
            <BottomNav />
          </ToastProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
