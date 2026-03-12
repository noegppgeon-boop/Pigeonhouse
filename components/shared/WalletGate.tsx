"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { motion, AnimatePresence } from "framer-motion";
import FireParticles from "./FireParticles";

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
            className="fixed inset-0 z-30 flex items-center justify-center md:pl-sidebar animated-gradient-bg"
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex flex-col items-center text-center px-6 max-w-md"
            >
              {/* Logo mark */}
              <div className="relative mb-6">
                <img
                  src="/logo-v1.png"
                  alt="PigeonHouse"
                  className="w-24 h-24 rounded-2xl shadow-md animate-float"
                />
                <div className="absolute inset-0 w-24 h-24">
                  <FireParticles count={6} />
                </div>
              </div>

              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="font-lore text-[28px] font-bold text-txt leading-tight mb-2"
              >
                PigeonHouse
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="font-lore italic text-[15px] text-txt-muted mb-8"
              >
                The Ritual Launch Terminal — inscribe with trust, burn with proof.
              </motion.p>

              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.7 }}
                onClick={() => setVisible(true)}
                className="btn-primary px-8 py-3 text-[15px] flex items-center gap-2.5 shadow-md animate-pulse-glow"
              >
                Connect Wallet to Enter
              </motion.button>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.9 }}
                className="text-[11px] text-txt-muted mt-6 max-w-[280px]"
              >
                Connect a Solana wallet to access the launchpad, trade tokens, and join the archive.
              </motion.p>
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
