import test from "node:test";
import assert from "node:assert/strict";
import { calculateDraftMetrics, intervalLabelFromSeconds, strategyStatusLabel } from "@/lib/dripfi-metrics";

test("calculateDraftMetrics returns expected recurring numbers", () => {
  const metrics = calculateDraftMetrics({
    amountPerOrder: "24",
    budget: "720",
    interval: "daily",
  });

  assert.equal(metrics.amount, 24);
  assert.equal(metrics.budget, 720);
  assert.equal(metrics.runsPerMonth, 30);
  assert.equal(metrics.projectedMonthlySpend, 720);
  assert.equal(metrics.projectedRunway, 30);
});

test("status and interval helpers stay readable", () => {
  assert.equal(intervalLabelFromSeconds(60 * 60 * 24), "Daily");
  assert.equal(strategyStatusLabel(0), "Running");
  assert.equal(strategyStatusLabel(1), "Paused");
  assert.equal(strategyStatusLabel(2), "Stopped");
});
