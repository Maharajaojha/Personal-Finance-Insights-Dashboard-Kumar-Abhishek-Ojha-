import { useState } from "react";
import { MONTHS, inr } from "./data.js";
import { sum, anomalies, challenges, badges, catTotal } from "./utils.js";

const Bar = ({ pct, color }) => (
  <div className="bar"><div style={{ width: Math.min(100, pct) + "%", background: color }} /></div>
);

export function Transactions({ s }) {
  const [q, setQ] = useState(""), [cat, setCat] = useState("All"), [sort, setSort] = useState("new"), [edit, setEdit] = useState(null);
  const [f, setF] = useState({ note: "", category: s.cats[0].name, amount: "", day: 1 });
  const list = s.txm.filter((t) => (cat === "All" || t.category === cat) && t.note.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (sort === "new" ? b.day - a.day : b.amount - a.amount));
  const add = (e) => {
    e.preventDefault();
    if (!f.note.trim() || !(Number(f.amount) > 0)) return;
    s.addTx({ ...f, note: f.note.trim(), amount: Number(f.amount), day: Number(f.day) || 1 });
    setF({ ...f, note: "", amount: "" });
  };
  return (
    <section className="panel">
      <h2>Transactions in {MONTHS[s.m]}</h2>
      <form className="form" onSubmit={add}>
        <input placeholder="What was it for?" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
        <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{s.cats.map((c) => <option key={c.name}>{c.name}</option>)}</select>
        <input type="number" min="1" placeholder="Amount (₹)" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
        <input type="number" min="1" max="31" aria-label="Day of month" value={f.day} onChange={(e) => setF({ ...f, day: e.target.value })} />
        <button className="primary">Add expense</button>
      </form>
      <div className="filters">
        <input placeholder="Search transactions" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={cat} onChange={(e) => setCat(e.target.value)}><option>All</option>{s.cats.map((c) => <option key={c.name}>{c.name}</option>)}</select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}><option value="new">Newest first</option><option value="big">Largest first</option></select>
      </div>
      {list.length === 0 && <p className="mute">No transactions match. Clear the search or add an expense.</p>}
      <ul className="log">
        {list.map((t) => (
          <li key={t.id}>
            <span>{t.day} {MONTHS[t.month]}</span>
            {edit === t.id ? <input defaultValue={t.note} id={"n" + t.id} /> : <span>{t.note}</span>}
            <em>{t.category}</em>
            {edit === t.id ? <input type="number" defaultValue={t.amount} id={"a" + t.id} /> : <b>−{inr(t.amount)}</b>}
            <span className="acts">
              {edit === t.id ? (
                <button onClick={() => { s.updTx(t.id, { note: document.getElementById("n" + t.id).value, amount: Number(document.getElementById("a" + t.id).value) || t.amount }); setEdit(null); }}>Save</button>
              ) : <button onClick={() => setEdit(t.id)}>Edit</button>}
              <button onClick={() => s.delTx(t.id)}>Delete</button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Budgets({ s }) {
  const [n, setN] = useState(""), [b, setB] = useState("");
  const over = s.cats.filter((c) => catTotal(s.tx, s.m, c.name) > c.budget);
  return (
    <section className="panel">
      <h2>Budgets for {MONTHS[s.m]}</h2>
      {over.length > 0 && <p className="flag">Over budget: {over.map((c) => c.name).join(", ")}</p>}
      <ul className="budgets">
        {s.cats.map((c) => {
          const used = catTotal(s.tx, s.m, c.name), o = used > c.budget;
          return (
            <li key={c.name}>
              <div className="row"><span>{c.name}</span>
                <span className={o ? "neg" : ""}>{inr(used)} of
                  <input type="number" aria-label={`${c.name} budget`} value={c.budget} min="0" step="500" onChange={(e) => s.setBudget(c.name, Number(e.target.value) || 0)} /></span></div>
              <Bar pct={(used / c.budget) * 100} color={o ? "#C8553D" : c.color} />
              <small className={o ? "neg" : "mute"}>{o ? `Over by ${inr(used - c.budget)}` : `${inr(c.budget - used)} left`}</small>
            </li>
          );
        })}
      </ul>
      <form className="form three" onSubmit={(e) => { e.preventDefault(); if (n.trim() && b > 0) { s.addCat(n.trim(), Number(b)); setN(""); setB(""); } }}>
        <input placeholder="New category name" value={n} onChange={(e) => setN(e.target.value)} />
        <input type="number" placeholder="Monthly budget (₹)" value={b} onChange={(e) => setB(e.target.value)} />
        <button className="primary">Add category</button>
      </form>
    </section>
  );
}

export function Goals({ s }) {
  const [g, setG] = useState({ name: "", target: "", months: 6 });
  return (
    <section className="panel">
      <h2>Savings goals</h2>
      <ul className="goals">
        {s.goals.map((x) => {
          const need = Math.max(0, x.target - x.saved) / x.months;
          return (
            <li key={x.id}>
              <div className="row"><span>{x.name}</span><b>{Math.round((x.saved / x.target) * 100)}%</b></div>
              <Bar pct={(x.saved / x.target) * 100} color="#2E8B6E" />
              <div className="row small"><span>{inr(x.saved)} of {inr(x.target)} · save {inr(need)} a month for {x.months} months</span>
                <span className="acts">{[1000, 5000].map((a) => <button key={a} disabled={x.saved >= x.target} onClick={() => s.fund(x.id, a)}>Add {inr(a)}</button>)}</span></div>
            </li>
          );
        })}
      </ul>
      <form className="form three" onSubmit={(e) => { e.preventDefault(); if (g.name.trim() && g.target > 0) { s.addGoal({ ...g, name: g.name.trim(), target: Number(g.target), months: Number(g.months) || 1 }); setG({ name: "", target: "", months: 6 }); } }}>
        <input placeholder="Goal name" value={g.name} onChange={(e) => setG({ ...g, name: e.target.value })} />
        <input type="number" placeholder="Target (₹)" value={g.target} onChange={(e) => setG({ ...g, target: e.target.value })} />
        <input type="number" min="1" aria-label="Months to reach it" value={g.months} onChange={(e) => setG({ ...g, months: e.target.value })} />
        <button className="primary">Add goal</button>
      </form>
    </section>
  );
}

export function Reports({ s }) {
  const { m, txm, income, spent } = s, prev = m > 0 ? sum(s.tx.filter((t) => t.month === m - 1), (t) => t.amount) : null;
  const top = [...s.cats].map((c) => ({ ...c, v: catTotal(s.tx, m, c.name) })).sort((a, b) => b.v - a.v).slice(0, 3);
  const big = [...txm].sort((a, b) => b.amount - a.amount).find((t) => t.category !== "Housing");
  const flags = anomalies(s.tx, s.cats, m);
  const csv = () => {
    const rows = ["Date,Note,Category,Amount", ...txm.map((t) => `${t.day} ${MONTHS[m]} 2026,"${t.note}",${t.category},${t.amount}`)].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([rows], { type: "text/csv" }));
    a.download = `report-${MONTHS[m]}-2026.csv`; a.click();
  };
  return (
    <section className="panel report">
      <h2>{MONTHS[m]} 2026 report</h2>
      <p>You earned <b>{inr(income)}</b> and spent <b>{inr(spent)}</b>, leaving <b>{inr(income - spent)}</b> ({Math.round(((income - spent) / income) * 100)}% saved).
        {prev !== null && <> Spending was {spent >= prev ? "up" : "down"} {inr(Math.abs(spent - prev))} compared with {MONTHS[m - 1]}.</>}</p>
      <h3>Biggest categories</h3>
      <ul>{top.map((c) => <li key={c.name}>{c.name}: {inr(c.v)} ({Math.round((c.v / spent) * 100)}% of spending)</li>)}</ul>
      {big && <p>Largest one-off purchase: <b>{big.note}</b> ({inr(big.amount)}, {big.category}, {big.day} {MONTHS[m]}).</p>}
      <h3>Things to review</h3>
      {flags.length ? <ul>{flags.map((f, i) => <li key={i}>{f.title}. {f.detail}.</li>)}</ul> : <p>Nothing unusual this month.</p>}
      <div className="acts noprint"><button className="primary" onClick={csv}>Download CSV</button><button onClick={() => window.print()}>Print report</button></div>
    </section>
  );
}

export function Challenges({ s }) {
  const list = challenges(s.tx, s.cats, s.m), bs = badges(s.tx, s.cats, s.goals);
  return (
    <div className="grid">
      <section className="panel">
        <h2>Challenges for {MONTHS[s.m]}</h2>
        <ul className="goals">{list.map((c) => {
          const done = c.value >= c.target;
          return (
            <li key={c.name}>
              <div className="row"><span>{c.name}</span><b>{done ? "Complete" : `${c.value}/${c.target}${c.unit}`}</b></div>
              <Bar pct={(c.value / c.target) * 100} color={done ? "#2E8B6E" : "#1F4E79"} />
            </li>
          );
        })}</ul>
      </section>
      <section className="panel">
        <h2>Achievements · {bs.filter((b) => b.earned).length} of {bs.length}</h2>
        <ul className="badges">{bs.map((b) => (
          <li key={b.name} className={b.earned ? "earned" : ""}><b>{b.name}</b><span>{b.desc}</span><em>{b.earned ? "Unlocked" : "Locked"}</em></li>
        ))}</ul>
      </section>
    </div>
  );
}
