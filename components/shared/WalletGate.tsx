"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import FireParticles from "./FireParticles";

export default function WalletGate({ children }: { children: React.ReactNode }) {
  // Browsing is open to everyone — wallet required only for transactions
  return <>{children}</>;
}
