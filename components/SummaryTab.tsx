"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingUp, TrendingDown, Wallet, Clock, PieChart,
} from "lucide-react";

interface Props {
  collected: number;     // income: paid rents
  pending: number;       // unpaid rent (context)
  expenses: number;      // total expenses this month
  paidCount: number;
  unpaidCount: number;
  monthLabel: string;
}

const PROFIT_TIERS = [
  { min: 0,   color: "text-success",     bg: "bg-success/10",     border: "border-success/20" },
  { min: -Infinity, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" },
];

export default function SummaryTab({
  collected, pending, expenses, paidCount, unpaidCount, monthLabel,
}: Props) {
  const profit    = collected - expenses;
  const isProfit  = profit >= 0;
  const profitPct = collected > 0 ? Math.round((profit / collected) * 100) : 0;

  const statColor = isProfit
    ? "text-success"
    : "text-destructive";
  const statBg    = isProfit
    ? "bg-success/10 border-success/20"
    : "bg-destructive/10 border-destructive/20";

  // Bar chart widths (relative to collected)
  const maxVal      = Math.max(collected, expenses, 1);
  const incomeW     = Math.round((collected / maxVal) * 100);
  const expenseW    = Math.round((expenses  / maxVal) * 100);

  return (
    <div className="space-y-6">
      {/* P&L headline cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Income */}
        <Card className="border-success/20 bg-success/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-lg bg-success/15 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Income Collected</p>
            </div>
            <p className="text-2xl font-bold text-success">₹{collected.toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {paidCount} paid · ₹{pending.toLocaleString("en-IN")} still pending
            </p>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-lg bg-destructive/15 flex items-center justify-center">
                <TrendingDown className="h-4 w-4 text-destructive" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
            </div>
            <p className="text-2xl font-bold text-destructive">₹{expenses.toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted-foreground mt-1">Logged expenses for {monthLabel}</p>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className={`border ${statBg}`}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${isProfit ? "bg-success/15" : "bg-destructive/15"}`}>
                <Wallet className={`h-4 w-4 ${statColor}`} />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
            </div>
            <p className={`text-2xl font-bold ${statColor}`}>
              {isProfit ? "" : "-"}₹{Math.abs(profit).toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isProfit
                ? `${profitPct}% margin on collected income`
                : "Expenses exceed income collected"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visual bar comparison */}
      <Card className="border-border/60">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold">Income vs Expenses — {monthLabel}</p>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Income</span>
                <span className="text-xs font-semibold text-success">₹{collected.toLocaleString("en-IN")}</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-success transition-all duration-700"
                  style={{ width: `${incomeW}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Expenses</span>
                <span className="text-xs font-semibold text-destructive">₹{expenses.toLocaleString("en-IN")}</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-destructive transition-all duration-700"
                  style={{ width: `${expenseW}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending income context */}
      {pending > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/20 bg-warning/5 px-4 py-3">
          <Clock className="h-4 w-4 text-warning mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-warning">
              ₹{pending.toLocaleString("en-IN")} pending collection
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {unpaidCount} resident{unpaidCount !== 1 ? "s" : ""} haven&apos;t paid yet.
              If collected, net profit would be{" "}
              <strong>₹{(collected + pending - expenses).toLocaleString("en-IN")}</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
