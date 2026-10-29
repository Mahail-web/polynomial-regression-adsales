"use client";

import { useEffect, useState } from "react";
import { fetchHealth } from "@/lib/api";
import { Activity, CheckCircle2, ShieldCheck } from "lucide-react";

export function Header() {
  const [apiStatus, setApiStatus] = useState<string>("connecting");

  useEffect(() => {
    fetchHealth()
      .then((res) => {
        setApiStatus(res.status === "healthy" ? "online" : "embedded");
      })
      .catch(() => setApiStatus("embedded"));
  }, []);

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-slate-800">
          AdSales Intelligence
        </h2>
        <span className="text-xs text-slate-500 hidden sm:inline">
          | Advertising Sales Predictor & Diminishing Returns Explorer
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Model Status Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200/80">
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
          <span>Model Fitted (80:20 Split)</span>
        </div>

        {/* Backend Indicator */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Activity className="w-3.5 h-3.5 text-teal-500 animate-pulse" />
          <span>
            Engine:{" "}
            <strong className="text-slate-800">
              {apiStatus === "online" ? "Python FastAPI" : "Scikit-Learn ML"}
            </strong>
          </span>
        </div>
      </div>
    </header>
  );
}
