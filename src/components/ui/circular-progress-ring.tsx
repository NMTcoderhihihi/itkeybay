"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface CircularProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showText?: boolean;
}

export function CircularProgressRing({
  progress,
  size = 48,
  strokeWidth = 4,
  className,
  showText = true,
}: CircularProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const offset = circumference - (clampedProgress / 100) * circumference;

  const getColorClass = (val: number) => {
    if (val === 100) return "text-green-500";
    if (val >= 50) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <div
      className={cn("relative inline-flex items-center justify-center shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/40"
          fill="transparent"
        />
        {/* Progress indicator */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-500 ease-out", getColorClass(clampedProgress))}
          fill="transparent"
        />
      </svg>
      {showText && (
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center text-xs font-bold",
            getColorClass(clampedProgress)
          )}
        >
          {clampedProgress}%
        </span>
      )}
    </div>
  );
}
