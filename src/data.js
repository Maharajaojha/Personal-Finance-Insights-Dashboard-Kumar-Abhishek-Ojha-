export const MONTHS = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"];
export const TODAY = { month: 5, day: 20 }; // Oct 20, 2026
export const PALETTE = ["#B5651D", "#5B8E7D", "#D1495B", "#00798C", "#6D597A"];

export const CATEGORIES = [
  { name: "Housing", color: "#1F4E79", budget: 18000 },
  { name: "Food", color: "#2E8B6E", budget: 9000 },
  { name: "Transport", color: "#E0A100", budget: 4000 },
  { name: "Utilities", color: "#7B5EA7", budget: 3500 },
  { name: "Shopping", color: "#C8553D", budget: 5000 },
  { name: "Health", color: "#3FA7B5", budget: 2500 },
  { name: "Leisure", color: "#8A8F98", budget: 3000 },
];

const SPEND = [
  [18000, 8400, 3600, 3200, 4100, 1200, 2400],
  [18000, 8900, 3900, 3400, 5600, 800, 2900],
  [18000, 9300, 3700, 3900, 4300, 2100, 3600],
  [18000, 8700, 4200, 3300, 6200, 900, 2700],
  [18000, 8500, 3800, 3100, 4700, 1500, 2500],
  [18000, 9400, 4300, 3600, 5800, 1100, 3300],
];
export const INCOME = [62000, 62000, 64500, 62000, 62000, 66000];

export const GOALS = [
  { id: 1, name: "Emergency fund", target: 300000, saved: 184000, months: 12 },
  { id: 2, name: "Goa trip", target: 60000, saved: 41500, months: 4 },
  { id: 3, name: "New laptop", target: 90000, saved: 22000, months: 8 },
];

const NOTES = {
  Housing: ["Rent"], Food: ["Groceries", "Dinner out", "Cafe", "Swiggy order", "Vegetables"],
  Transport: ["Fuel", "Cab ride", "Metro recharge", "Parking"], Utilities: ["Electricity", "Internet", "Mobile recharge"],
  Shopping: ["Clothes", "Electronics", "Home items", "Online order", "Gift"], Health: ["Pharmacy", "Clinic visit", "Gym"],
  Leisure: ["Movie", "Concert", "Streaming", "Weekend outing", "Books"],
};

// Deterministic sample transactions that add up to SPEND
export function genTx() {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const out = []; let id = 1;
  SPEND.forEach((row, m) => {
    const maxDay = m === TODAY.month ? TODAY.day : new Date(2026, 5 + m, 0).getDate();
    CATEGORIES.forEach((c, i) => {
      const n = c.name === "Housing" ? 1 : 3 + Math.floor(rnd() * 3);
      const w = Array.from({ length: n }, () => 0.4 + rnd() * 1.8);
      const ws = w.reduce((a, b) => a + b, 0);
      let left = row[i];
      w.forEach((x, k) => {
        const amt = k === n - 1 ? left : Math.round((row[i] * x) / ws / 50) * 50;
        left -= amt;
        out.push({ id: id++, month: m, day: c.name === "Housing" ? 1 : 1 + Math.floor(rnd() * maxDay),
          note: NOTES[c.name][Math.floor(rnd() * NOTES[c.name].length)], category: c.name, amount: amt });
      });
    });
  });
  return out;
}
export const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
