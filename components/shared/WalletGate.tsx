"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { motion, AnimatePresence } from "framer-motion";
import { Flame } from "lucide-react";

export default function WalletGate({ children }: { children: React.ReactNode }) {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();

  return (
    <>
      <AnimatePresence mode="wait">
        {!connected && (
          <motion.div
            key="gate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-30 flex items-center justify-center md:pl-sidebar"
            style={{ background: "var(--bg)" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex flex-col items-center text-center px-6 max-w-md"
            >
              {/* Logo mark */}
              <div className="w-20 h-20 rounded-2xl bg-crimson/10 border border-crimson/20 flex items-center justify-center mb-6">
                <Flame className="h-9 w-9 text-crimson" />
              </div>

              <h1 className="font-lore text-[28px] font-bold text-txt leading-tight mb-2">
                PigeonHouse
              </h1>
              <p className="font-lore italic text-[15px] text-txt-muted mb-8">
                The Ritual Launch Terminal — inscribe with trust, burn with proof.
              </p>

              <button
                onClick={() => setVisible(true)}
                className="btn-primary px-8 py-3 text-[15px] flex items-center gap-2.5 shadow-md"
              >
                Connect Wallet to Enter
              </button>

              <p className="text-[11px] text-txt-muted mt-6 max-w-[280px]">
                Connect a Solana wallet to access the launchpad, trade tokens, and join the archive.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={{ opacity: connected ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{ pointerEvents: connected ? "auto" : "none" }}
      >
        {children}
      </motion.div>
    </>
  );
}
