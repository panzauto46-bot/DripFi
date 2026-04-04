import { formatUnits } from "viem";
import { intervalSeconds, type DcaInterval } from "@/lib/dripfi-config";

export const executionsPerMonth: Record<DcaInterval, number> = {
  hourly: 24 * 30,
  daily: 30,
  weekly: 4,
};

export function calculateDraftMetrics({
  amountPerOrder,
  budget,
  interval,
}: {
  amountPerOrder: string;
  budget: string;
  interval: DcaInterval;
}) {
  const amount = Number(amountPerOrder || 0);
  const totalBudget = Number(budget || 0);
  const runsPerMonth = executionsPerMonth[interval];
  const projectedMonthlySpend = amount * runsPerMonth;
  const projectedRunway = amount > 0 ? Math.max(1, Math.floor(totalBudget / amount)) : 0;

  return {
    amount,
    budget: totalBudget,
    runsPerMonth,
    projectedMonthlySpend,
    projectedRunway,
    intervalInSeconds: intervalSeconds[interval],
  };
}

export function formatTokenAmount(value: bigint, decimals = 18, maxFractionDigits = 2) {
  const formatted = Number(formatUnits(value, decimals));
  return Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  }).format(formatted);
}

export function intervalLabelFromSeconds(intervalSecondsValue: number) {
  if (intervalSecondsValue === intervalSeconds.hourly) return "Hourly";
  if (intervalSecondsValue === intervalSeconds.daily) return "Daily";
  if (intervalSecondsValue === intervalSeconds.weekly) return "Weekly";
  return `${intervalSecondsValue}s`;
}

export function strategyStatusLabel(status: number) {
  if (status === 0) return "Running";
  if (status === 1) return "Paused";
  if (status === 2) return "Stopped";
  if (status === 3) return "Completed";
  return "Unknown";
}

export function strategyStatusTone(status: number) {
  if (status === 0) return "running";
  if (status === 1) return "paused";
  if (status === 2) return "stopped";
  if (status === 3) return "completed";
  return "unknown";
}
