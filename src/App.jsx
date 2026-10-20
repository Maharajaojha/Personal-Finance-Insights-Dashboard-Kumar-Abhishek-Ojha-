import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend, BarChart, Bar } from "recharts";
import { MONTHS, CATEGORIES, PALETTE, INCOME, GOALS, genTx, inr } from "./data.js";
import { sum, catTotal, monthSpent, daysIn, anomalies } from "./utils.js";
import { Transactions, Budgets, Goals, Reports, Challenges } from "./Views.jsx";

const TABS = ["Overview", "Transactions", "Budgets", "Goals", "Reports", "Challenges"];

function Heatmap({ txm, m, drill, setDrill }) {
  const lead = new Date(2026, 5 + m - 1, 1).getDay(), n = daysIn(m);
  const per = Array.from({ length: n }, (_, i) => sum(txm.filter((t) => t.day === i + 1), (t) => t.amount));
  const max = Math.max(...per, 1);
  return (
    <div className="heat">
      {"SMTWTFS".split("").map((d, i) => <span key={i} className="dow">{d}</span>)}
      {Array.from({ length: lead }, (_, i) => <span key={"b" + i} />)}
      {per.map((v, i) => (
        <button key={i} className={"cell" + (drill.day === i + 1 ? " sel" : "")} title={`${i + 1} ${MONTHS[m]}: ${inr(v)}`}
          aria-label={`${i + 1} ${MONTHS[m]}, ${inr(v)} spent`} style={{ background: v ? `rgba(31,78,121,${0.12 + 0.88 * (v / max)})` : undefined, color: v / max > 0.5 ? "#fff" : undefined }}
          onClick={() => setDrill((d) => ({ ...d, day: d.day === i + 1 ? undefined : i + 1 }))}>{i + 1}</button>
      ))}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("Overview"), [m, setM] = useState(5), [drill, setDrill] = useState({});
  const [cats, setCats] = useState(CATEGORIES), [tx, setTx] = useState(genTx), [goals, setGoals] = useState(GOALS);
  const txm = tx.filter((t) => t.month === m), income = INCOME[m], spent = monthSpent(tx, m), saved = income - spent;
  const s = {
    m, tx, txm, cats, goals, income, spent,
    addTx: (t) => setTx((x) => [{ id: Date.now(), month: m, ...t }, ...x]),
    delTx: (id) => setTx((x) => x.filter((t) => t.id !== id)),
    updTx: (id, p) => setTx((x) => x.map((t) => (t.id === id ? { ...t, ...p } : t))),
    setBudget: (name, v) => setCats((c) => c.map((x) => (x.name === name ? { ...x, budget: v } : x))),
    addCat: (name, budget) => setCats((c) => c.some((x) => x.name === name) ? c : [...c, { name, budget, color: PALETTE[c.length % PALETTE.length] }]),
    fund: (id, a) => setGoals((g) => g.map((x) => (x.id === id ? { ...x, saved: Math.min(x.target, x.saved + a) } : x))),
    addGoal: (g) => setGoals((x) => [...x, { id: Date.now(), saved: 0, ...g }]),
  };
  const pie = cats.map((c) => ({ ...c, value: catTotal(tx, m, c.name) })).filter((c) => c.value > 0);
  const trend = MONTHS.map((mo, i) => ({ month: mo, Income: INCOME[i], Spending: monthSpent(tx, i) }));
  const flags = anomalies(tx, cats, m);
  const pick = (name) => setDrill((d) => ({ ...d, category: d.category === name ? undefined : name }));
  const shown = txm.filter((t) => (!drill.category || t.category === drill.category) && (!drill.day || t.day === drill.day));
  const catBars = drill.category ? MONTHS.map((mo, i) => ({ month: mo, Spent: catTotal(tx, i, drill.category) })) : [];

  return (
    <main className="wrap">
      <header className="top noprint">
        <div><h1>Ledger</h1><p className="sub">Where your money went, and where it is going.</p></div>
        <div className="months" role="group" aria-label="Select month">
          {MONTHS.map((mo, i) => <button key={mo} aria-pressed={i === m} className={i === m ? "on" : ""} onClick={() => { setM(i); setDrill({}); }}>{mo}</button>)}
        </div>
      </header>
      <nav className="tabs noprint">{TABS.map((t) => <button key={t} className={t === tab ? "on" : ""} onClick={() => setTab(t)}>{t}</button>)}</nav>

      {tab === "Overview" && <>
        <section className="hero">
          <div className="saved"><span className="label">Left after spending</span>
            <strong className={saved < 0 ? "neg" : ""}>{inr(saved)}</strong>
            <span className="label">{Math.round((saved / income) * 100)}% of income saved in {MONTHS[m]}</span></div>
          <dl className="stats">
            <div><dt>Income</dt><dd>{inr(income)}</dd></div><div><dt>Spent</dt><dd>{inr(spent)}</dd></div>
            <div><dt>Budget used</dt><dd>{Math.round((spent / sum(cats, (c) => c.budget)) * 100)}%</dd></div>
          </dl>
        </section>
        {flags.length > 0 && <section className="panel flagbox"><h2>Unusual spending in {MONTHS[m]}</h2>
          <ul>{flags.map((f, i) => <li key={i}><button onClick={() => setDrill({ category: f.category })}><b>{f.title}</b><span>{f.detail}</span></button></li>)}</ul></section>}
        <div className="grid">
          <section className="panel"><h2>Spending by category <small className="mute">Click a slice to drill in</small></h2>
            <div className="donut">
              <ResponsiveContainer width="100%" height={230}><PieChart>
                <Pie data={pie} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96} paddingAngle={2} onClick={(d) => pick(d.name)} cursor="pointer">
                  {pie.map((p) => <Cell key={p.name} fill={p.color} fillOpacity={!drill.category || drill.category === p.name ? 1 : 0.25} />)}
                </Pie><Tooltip formatter={(v) => inr(v)} /></PieChart></ResponsiveContainer>
              <ul className="legend">{pie.map((p) => <li key={p.name}><button onClick={() => pick(p.name)} className={drill.category === p.name ? "on" : ""}><i style={{ background: p.color }} />{p.name}<b>{inr(p.value)}</b></button></li>)}</ul>
            </div></section>
          <section className="panel"><h2>Monthly trend <small className="mute">Click a month to switch</small></h2>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trend} margin={{ left: -10, right: 8, top: 8 }} onClick={(e) => e && e.activeTooltipIndex != null && (setM(e.activeTooltipIndex), setDrill({}))}>
                <CartesianGrid stroke="#dde3ea" vertical={false} /><XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v) => v / 1000 + "k"} tickLine={false} axisLine={false} /><Tooltip formatter={(v) => inr(v)} /><Legend />
                <Area type="monotone" dataKey="Income" stroke="#1F4E79" fill="#1F4E79" fillOpacity={0.12} strokeWidth={2} />
                <Area type="monotone" dataKey="Spending" stroke="#C8553D" fill="#C8553D" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart></ResponsiveContainer></section>
          <section className="panel"><h2>Spending heatmap <small className="mute">Darker days cost more. Click a day.</small></h2>
            <Heatmap txm={txm} m={m} drill={drill} setDrill={setDrill} /></section>
          <section className="panel"><h2>{drill.category || drill.day ? `${drill.category || "All spending"}${drill.day ? ` on ${drill.day} ${MONTHS[m]}` : ` in ${MONTHS[m]}`}` : "Drill-down"}</h2>
            {!drill.category && !drill.day ? <p className="mute">Select a category slice, a heatmap day or an unusual-spending alert to see the transactions behind it.</p> : <>
              {drill.category && <ResponsiveContainer width="100%" height={110}><BarChart data={catBars} onClick={(e) => e && e.activeTooltipIndex != null && setM(e.activeTooltipIndex)}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} /><Tooltip formatter={(v) => inr(v)} /><Bar dataKey="Spent" fill="#1F4E79" radius={3} /></BarChart></ResponsiveContainer>}
              <ul className="log short">{shown.slice(0, 8).map((t) => <li key={t.id}><span>{t.day} {MONTHS[m]}</span><span>{t.note}</span><b>−{inr(t.amount)}</b></li>)}</ul>
              {shown.length === 0 && <p className="mute">No transactions for this selection.</p>}
              <button className="link" onClick={() => setDrill({})}>Clear selection</button></>}</section>
        </div></>}
      {tab === "Transactions" && <Transactions s={s} />}
      {tab === "Budgets" && <Budgets s={s} />}
      {tab === "Goals" && <Goals s={s} />}
      {tab === "Reports" && <Reports s={s} />}
      {tab === "Challenges" && <Challenges s={s} />}
    </main>
  );
}
