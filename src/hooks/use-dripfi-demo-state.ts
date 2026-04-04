"use client";

import { useDeferredValue, useState, useTransition } from "react";
import { strategyTemplates, type DcaInterval } from "@/lib/dripfi-config";
import { calculateDraftMetrics } from "@/lib/dripfi-metrics";

export type StrategyDraft = {
  templateId: string;
  tokenIn: string;
  tokenOut: string;
  amountPerOrder: string;
  budget: string;
  interval: DcaInterval;
};

export function useDripfiDemoState() {
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState<StrategyDraft>({
    templateId: strategyTemplates[1].id,
    tokenIn: "USDC",
    tokenOut: "INIT",
    amountPerOrder: strategyTemplates[1].amountPerOrder,
    budget: strategyTemplates[1].budget,
    interval: strategyTemplates[1].interval,
  });

  const deferredDraft = useDeferredValue(draft);
  const metrics = calculateDraftMetrics({
    amountPerOrder: deferredDraft.amountPerOrder,
    budget: deferredDraft.budget,
    interval: deferredDraft.interval,
  });

  function updateDraft<K extends keyof StrategyDraft>(
    key: K,
    value: StrategyDraft[K],
  ) {
    startTransition(() => {
      setDraft((current) => ({ ...current, [key]: value }));
    });
  }

  function applyTemplate(templateId: string) {
    const template = strategyTemplates.find((item) => item.id === templateId);
    if (!template) return;

    startTransition(() => {
      setDraft((current) => ({
        ...current,
        templateId: template.id,
        amountPerOrder: template.amountPerOrder,
        budget: template.budget,
        interval: template.interval,
      }));
    });
  }

  return {
    draft,
    isPending,
    metrics,
    updateDraft,
    applyTemplate,
  };
}
