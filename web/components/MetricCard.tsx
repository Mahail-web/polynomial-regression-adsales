import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: string;
  variant?: "default" | "teal" | "blue" | "amber";
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  variant = "default",
  className,
}: MetricCardProps) {
  const variantStyles = {
    default: "border-slate-200 bg-white",
    teal: "border-teal-200 bg-teal-50/40 text-teal-900",
    blue: "border-blue-200 bg-blue-50/40 text-blue-900",
    amber: "border-amber-200 bg-amber-50/40 text-amber-900",
  };

  const iconStyles = {
    default: "text-slate-500 bg-slate-100",
    teal: "text-teal-600 bg-teal-100/70",
    blue: "text-blue-600 bg-blue-100/70",
    amber: "text-amber-600 bg-amber-100/70",
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-5 shadow-sm transition-all hover:shadow-md",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
          {title}
        </span>
        {Icon && (
          <div className={cn("p-2 rounded-lg", iconStyles[variant])}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </span>
        {badge && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-teal-100 text-teal-800">
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 leading-normal">{subtitle}</p>
      )}
    </div>
  );
}
