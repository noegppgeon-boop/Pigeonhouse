"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "card" | "circle" | "chart";
}

export function Skeleton({ className, variant = "text" }: SkeletonProps) {
  const base = "skeleton";
  const variants = {
    text: "h-4 w-full",
    card: "h-40 w-full rounded-card",
    circle: "h-10 w-10 rounded-full",
    chart: "h-64 w-full rounded-card",
  };
  return <div className={cn(base, variants[variant], className)} />;
}

export function SkeletonCard() {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" className="h-10 w-10" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-1.5 w-full rounded-full" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-0">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3 px-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <Skeleton variant="circle" className="h-8 w-8" />
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3.5 w-20 ml-auto" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      ))}
    </div>
  );
}
