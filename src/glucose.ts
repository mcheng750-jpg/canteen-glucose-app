import type { FoodItem, GlucoseLevel, Stall } from "./types";

export const GLUCOSE_THRESHOLDS = {
  lowMaxDelta: 3.2,
  mediumMaxDelta: 4.9,
  minSamplesForStall: 1
};

export const levelMeta: Record<GlucoseLevel, { label: string; short: string; color: string; glow: string; bg: string }> = {
  low: { label: "低升糖", short: "低", color: "#5ca86a", glow: "rgba(92,168,106,0.30)", bg: "bg-emerald-100 text-emerald-700" },
  medium: { label: "中升糖", short: "中", color: "#d99a2b", glow: "rgba(217,154,43,0.32)", bg: "bg-amber-100 text-amber-800" },
  high: { label: "高升糖", short: "高", color: "#cf5f50", glow: "rgba(207,95,80,0.30)", bg: "bg-rose-100 text-rose-700" },
  insufficient: { label: "暂无数据", short: "无数据", color: "#8b9096", glow: "rgba(139,144,150,0.24)", bg: "bg-slate-100 text-slate-600" }
};

export function classifyDelta(delta: number): Exclude<GlucoseLevel, "insufficient"> {
  if (delta <= GLUCOSE_THRESHOLDS.lowMaxDelta) return "low";
  if (delta <= GLUCOSE_THRESHOLDS.mediumMaxDelta) return "medium";
  return "high";
}

export function foodScore(food: FoodItem): number {
  if (food.level === "low") return 1;
  if (food.level === "medium") return 2;
  if (food.level === "high") return 3;
  return 0;
}

export function getStallSampleCount(stall: Stall): number {
  return stall.foods.reduce((sum, food) => sum + food.sampleCount, 0);
}

export function getStallLevel(stall: Stall): GlucoseLevel {
  const sampleCount = getStallSampleCount(stall);
  if (sampleCount < GLUCOSE_THRESHOLDS.minSamplesForStall) return "insufficient";
  return classifyDelta(averageDelta(stall));
}

export function averageDelta(stall: Stall): number {
  const totalSamples = getStallSampleCount(stall);
  if (!totalSamples) return 0;
  return stall.foods.reduce((sum, food) => sum + food.delta * food.sampleCount, 0) / totalSamples;
}
