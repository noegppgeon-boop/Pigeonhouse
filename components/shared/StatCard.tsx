"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  accent?: "lime" | "burn" | "green" | "amber" | "pigeon" | "gold" | "terra" | "purple" | "teal";
  mono?: boolean;
  className?: string;
}

const accentMap: Record<string, string> = {
  lime: "text-teal", burn: "text-crimson", green: "text-green",
  amber: "text-amber", pigeon: "text-pigeon", gold: "text-bronze",
  terra: "text-crimson", purple: "text-bronze", teal: "text-teal",
  crimson: "text-crimson", bronze: "text-bronze",
};

export function StatCard({ label, value, icon: Icon, change, changeType = "neutral", accent = "lime", mono = true, className }: StatCardProps) {
  const iconColor = accentMap[accent] || "text-lime";
  return (
    <div className={cn("card p-3.5", className)}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-micro text-txt-muted uppercase tracking-wider">{label}</span>
        {Icon && <Icon className={cn("h-3.5 w-3.5", iconColor)} />}
      </div>
      <p className={cn("text-h2 text-txt", mono && "font-mono")}>{value}</p>
      {change && (
        <span className={cn(
          "text-micro mt-0.5 inline-block",
          changeType === "positive" && "text-green",
          changeType === "negative" && "text-burn",
          changeType === "neutral" && "text-txt-muted",
        )}>
          {change}
        </span>
      )}
    </div>
  );
}
