"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Send, MessageCircle, Wallet } from "lucide-react";
import { shortenAddress, timeAgo } from "@/lib/utils";

interface ChatMessage {
  sender: string;
  text: string;
  timestamp: number;
}

const MAX_MESSAGES = 200;
const MAX_CHARS = 280;

function getStorageKey(mint: string) {
  return `chat_${mint}`;
}

function loadMessages(mint: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(getStorageKey(mint));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMessages(mint: string, messages: ChatMessage[]) {
  const trimmed = messages.slice(-MAX_MESSAGES);
  localStorage.setItem(getStorageKey(mint), JSON.stringify(trimmed));
}

export default function TokenChat({ mint }: { mint: string }) {
  const { publicKey, connected } = useWallet();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(loadMessages(mint));
  }, [mint]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendMessage = useCallback(() => {
    if (!publicKey || !input.trim()) return;
    const msg: ChatMessage = {
      sender: publicKey.toBase58(),
      text: input.trim().slice(0, MAX_CHARS),
      timestamp: Math.floor(Date.now() / 1000),
    };
    const updated = [...messages, msg];
    setMessages(updated);
    saveMessages(mint, updated);
    setInput("");
  }, [publicKey, input, messages, mint]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Re-render timestamps periodically
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card p-4 space-y-3">
      <h3 className="text-[11px] text-txt-muted uppercase tracking-widest font-semibold flex items-center gap-1.5">
        <MessageCircle className="h-3 w-3" />
        Chat
      </h3>

      {/* Messages */}
      <div
        ref={listRef}
        className="h-[240px] overflow-y-auto space-y-2 pr-1"
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-[12px] text-txt-muted font-lore italic">
              No messages yet — be the first to speak.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="text-[12px]">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-mono text-crimson font-semibold text-[11px]">
                {shortenAddress(msg.sender, 4)}
              </span>
              <span className="text-[10px] text-txt-muted">
                {timeAgo(msg.timestamp)}
              </span>
            </div>
            <p className="text-txt-secondary leading-snug break-words">
              {msg.text}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {connected ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={handleKeyDown}
            placeholder="Say something..."
            className="input flex-1 text-[13px] py-2 px-3"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="btn-primary px-3 py-2 flex items-center justify-center disabled:opacity-30"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 py-3 rounded-lg bg-bg text-[12px] text-txt-muted border border-[var(--border)]">
          <Wallet className="h-3.5 w-3.5" />
          Connect wallet to chat
        </div>
      )}

      {connected && input.length > 0 && (
        <p className="text-[10px] text-txt-muted text-right">
          {input.length}/{MAX_CHARS}
        </p>
      )}
    </div>
  );
}
