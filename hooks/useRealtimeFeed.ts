"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Connection } from "@solana/web3.js";
import { PIGEON_HOUSE_PROGRAM_ID } from "@/lib/constants";

export type RealtimeEvent = {
  type: "buy" | "sell" | "create" | "graduate";
  signature: string;
  timestamp: number;
  mint?: string;
  amount?: string;
};

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_RPC_URL?.replace("https://", "wss://");

/**
 * Subscribe to PigeonHouse program logs via WebSocket.
 * Returns live events + a "lastUpdate" timestamp the consumer can use to trigger refetch.
 */
export function useRealtimeFeed(enabled = true) {
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [lastUpdate, setLastUpdate] = useState(0);
  const subRef = useRef<number | null>(null);
  const connRef = useRef<Connection | null>(null);

  const cleanup = useCallback(() => {
    if (subRef.current !== null && connRef.current) {
      try {
        connRef.current.removeOnLogsListener(subRef.current);
      } catch { /* ignore */ }
      subRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled || !WS_URL) return;

    const conn = new Connection(WS_URL, {
      wsEndpoint: WS_URL,
      commitment: "confirmed",
    });
    connRef.current = conn;

    try {
      subRef.current = conn.onLogs(
        PIGEON_HOUSE_PROGRAM_ID,
        (logs) => {
          const sig = logs.signature;
          const logStr = logs.logs.join(" ");
          const now = Date.now();

          let type: RealtimeEvent["type"] | null = null;

          if (logStr.includes("BuyExecuted") || logStr.includes("Instruction: buy") || logStr.includes("instruction: buy")) {
            type = "buy";
          } else if (logStr.includes("SellExecuted") || logStr.includes("Instruction: sell") || logStr.includes("instruction: sell")) {
            type = "sell";
          } else if (logStr.includes("TokenCreated") || logStr.includes("Instruction: create_token") || logStr.includes("instruction: create_token")) {
            type = "create";
          } else if (logStr.includes("GraduationExecuted") || logStr.includes("Instruction: graduate") || logStr.includes("instruction: graduate")) {
            type = "graduate";
          }

          if (type) {
            const event: RealtimeEvent = { type, signature: sig, timestamp: now };
            setEvents((prev) => [event, ...prev].slice(0, 50)); // keep last 50
            setLastUpdate(now);
          }
        },
        "confirmed"
      );
    } catch (err) {
      console.warn("[RealtimeFeed] WebSocket subscription failed:", err);
    }

    return cleanup;
  }, [enabled, cleanup]);

  return { events, lastUpdate };
}
