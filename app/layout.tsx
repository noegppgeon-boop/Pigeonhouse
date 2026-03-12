import type { Metadata } from "next";
import "./globals.css";
import WalletProvider from "@/components/WalletProvider";
import { Sidebar, BottomNav, MobileTopBar } from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { ToastProvider } from "@/components/shared/Toast";
import CommandModal from "@/components/shared/CommandModal";
import WalletGate from "@/components/shared/WalletGate";
import LaunchGate from "@/components/shared/LaunchGate";

export const metadata: Metadata = {
  title: "PigeonHouse — Ritual Launch Terminal",
  description:
    "The deflationary token launchpad on Solana. Every trade burns PIGEON. Inscribe with trust, burn with proof.",
  icons: {
    icon: "/tokens/pigeon.png",
    apple: "/tokens/pigeon.png",
  },
  openGraph: {
    title: "PigeonHouse — Ritual Launch Terminal",
    description: "The deflationary token launchpad on Solana. Every trade burns PIGEON. Launch tokens, trade on bonding curves, graduate to Raydium.",
    url: "https://pigeon-house.vercel.app",
    siteName: "PigeonHouse",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PigeonHouse — Ritual Launch Terminal",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PigeonHouse — Ritual Launch Terminal",
    description: "The deflationary token launchpad on Solana. Every trade burns PIGEON 🔥",
    images: ["/og-image.png"],
    creator: "@941pigeondotfun",
    site: "@941pigeondotfun",
  },
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
            {/* Launch countdown — blocks EVERYTHING until timer hits zero */}
            <LaunchGate>
              <a href="#main-content" className="skip-link">Skip to content</a>

              {/* Desktop sidebar */}
              <Sidebar />

              {/* Desktop top-right wallet/profile */}
              <TopBar />

              {/* Mobile top bar */}
              <MobileTopBar />

              <CommandModal />

              {/* Main content — offset by sidebar on desktop, topbar on mobile */}
              <main id="main-content" role="main" className="min-h-screen pt-12 md:pt-0 md:pl-sidebar pb-16 md:pb-0">
                <WalletGate>
                  <div className="mx-auto max-w-[1100px] px-3 sm:px-4 lg:px-6 py-4 lg:py-6">
                    {children}
                  </div>
                </WalletGate>
              </main>

              {/* Mobile bottom nav */}
              <BottomNav />
            </LaunchGate>
          </ToastProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
