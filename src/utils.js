import { MONTHS, TODAY, INCOME, inr } from "./data.js";
export const sum = (a, f = (x) => x) => a.reduce((s, x) => s + f(x), 0);
export const daysIn = (m) => (m === TODAY.month ? TODAY.day : new Date(2026, 5 + m, 0).getDate());
export const catTotal = (tx, m, name) => sum(tx.filter((t) => t.month === m && t.category === name), (t) => t.amount);
export const monthSpent = (tx, m) => sum(tx.filter((t) => t.month === m), (t) => t.amount);
export const rateOf = (tx, m) => ((INCOME[m] - monthSpent(tx, m)) / INCOME[m]) * 100;

export function anomalies(tx, cats, m) {
  const out = [], others = MONTHS.map((_, i) => i).filter((i) => i !== m);
  cats.forEach((c) => {
    const avg = sum(others, (i) => catTotal(tx, i, c.name)) / others.length, cur = catTotal(tx, m, c.name);
    if (avg > 0 && cur > avg * 1.25 && cur - avg > 1000)
      out.push({ title: `${c.name} is ${Math.round((cur / avg - 1) * 100)}% above your usual`,
        detail: `${inr(cur)} this month vs ${inr(avg)} average`, category: c.name });
  });
  tx.filter((t) => t.month === m && t.category !== "Housing").forEach((t) => {
    const a = tx.filter((x) => x.category === t.category).map((x) => x.amount).sort((p, q) => p - q);
    const med = a[Math.floor(a.length / 2)];
    if (a.length > 4 && t.amount > med * 2.5)
      out.push({ title: `${t.note} cost ${inr(t.amount)}`, detail: `${(t.amount / med).toFixed(1)}× a typical ${t.category} purchase`, category: t.category });
  });
  return out;
}

export function challenges(tx, cats, m) {
  const under = cats.filter((c) => catTotal(tx, m, c.name) <= c.budget).length;
  const active = new Set(tx.filter((t) => t.month === m).map((t) => t.day));
  return [
    { name: "Stay inside every budget", value: under, target: cats.length, unit: " categories" },
    { name: "Save 35% of income", value: Math.max(0, Math.round(rateOf(tx, m))), target: 35, unit: "%" },
    { name: "Get 8 no-spend days", value: daysIn(m) - active.size, target: 8, unit: " days" },
    { name: "Log 25 transactions", value: tx.filter((t) => t.month === m).length, target: 25, unit: "" },
  ];
}

export function badges(tx, cats, goals) {
  const idx = MONTHS.map((_, i) => i);
  const allUnder = (i) => cats.every((c) => catTotal(tx, i, c.name) <= c.budget);
  return [
    { name: "First saver", desc: "Finish a month with money left over", earned: idx.some((i) => rateOf(tx, i) > 0) },
    { name: "Budget keeper", desc: "Stay inside every budget for a month", earned: idx.some(allUnder) },
    { name: "Steady saver", desc: "Save 30%+ two months in a row", earned: idx.some((i) => i > 0 && rateOf(tx, i) >= 30 && rateOf(tx, i - 1) >= 30) },
    { name: "Goal getter", desc: "Get a savings goal to 50%", earned: goals.some((g) => g.saved / g.target >= 0.5) },
    { name: "Diligent tracker", desc: "Log 150 transactions", earned: tx.length >= 150 },
  ];
}
