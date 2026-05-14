import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  BookMarked,
  Calculator,
  CheckCircle2,
  ExternalLink,
  Menu,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  dashboardStats,
  glossary,
  learningPath,
  modules,
  officialSources,
  visualNotes,
  type LearningModule,
} from "./data/playbook";
import "./styles.css";

type Values = Record<string, number>;

function formatPct(value: number) {
  return `${value.toFixed(2)}%`;
}

function calcResult(module: LearningModule, values: Values) {
  if (module.calculator.formula === "lof") {
    const nav = values.nav || 1;
    const price = values.price || 0;
    const cost = values.cost || 0;
    const raw = ((price - nav) / nav) * 100;
    const isPremium = raw > 0;
    const net = Math.abs(raw) - cost;
    return {
      headline: `${isPremium ? "溢价" : "折价"} ${formatPct(Math.abs(raw))}`,
      lines: [
        `扣除综合成本后，理论空间约 ${formatPct(net)}。`,
        net > 0 ? "仍需确认到账时间、盘口深度和净值波动。" : "表面差价不足以覆盖成本，不适合贸然套利。",
      ],
    };
  }

  if (module.calculator.formula === "grid") {
    const low = values.low || 1;
    const high = values.high || low;
    const capital = values.capital || 0;
    const base = (values.base || 0) / 100;
    const step = values.step || 1;
    const range = ((high - low) / low) * 100;
    const levels = Math.max(1, Math.round(range / step));
    const baseAmount = capital * base;
    const perGrid = baseAmount / levels;
    return {
      headline: `约 ${levels} 格，每格约 ${Math.round(perGrid).toLocaleString()} 元`,
      lines: [
        `区间宽度约 ${formatPct(range)}，底仓约 ${Math.round(baseAmount).toLocaleString()} 元。`,
        "实际执行时还要预留现金，处理继续下跌时的加仓。",
      ],
    };
  }

  if (module.calculator.formula === "hkipo") {
    const borrow = values.borrow || 0;
    const rate = (values.rate || 0) / 100;
    const days = values.days || 0;
    const fee = values.fee || 0;
    const interest = (borrow * rate * days) / 365;
    return {
      headline: `融资成本约 ${Math.round(interest + fee).toLocaleString()} 港元`,
      lines: [
        `其中利息约 ${Math.round(interest).toLocaleString()} 港元，其他费用 ${Math.round(fee).toLocaleString()} 港元。`,
        "未中签也可能产生资金成本，热门票要特别看资金效率。",
      ],
    };
  }

  const stock = values.stock || 0;
  const convert = values.convert || 1;
  const bond = values.bond || 0;
  const convertValue = (100 / convert) * stock;
  const premium = ((bond - convertValue) / convertValue) * 100;
  return {
    headline: `转股价值约 ${convertValue.toFixed(2)} 元`,
    lines: [
      `转股溢价率约 ${formatPct(premium)}。`,
      premium > 30 ? "溢价偏高，追涨前要特别谨慎。" : "溢价不算极端，但仍需看正股和强赎公告。",
    ],
  };
}

function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="topbar">
      <a className="brand" href="#top" aria-label="回到顶部">
        <span className="brand-mark">IP</span>
        <span>投资理财学习手册</span>
      </a>
      <button className="menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-label="打开导航">
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      <nav className={open ? "nav open" : "nav"} onClick={() => setOpen(false)}>
        <a href="#modules">模块</a>
        <a href="#glossary">术语</a>
        <a href="#risk">风险</a>
        <a href="#sources">来源</a>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <p className="eyebrow">零基础 · 静态学习站 · 非投资建议</p>
        <h1>把复杂策略拆成看得懂、算得清、能复盘的投资学习路线</h1>
        <p className="hero-text">
          这里不提供荐股和收益承诺，只把 LOF 套利、ETF 网格、港股打新、可转债打新的机制、术语、步骤和风险讲清楚。
        </p>
        <div className="hero-actions">
          <a className="primary-link" href="#modules">
            开始学习 <ArrowRight size={18} />
          </a>
          <a className="secondary-link" href="#glossary">
            查术语
          </a>
        </div>
      </div>
      <div className="hero-panel" aria-label="学习路线">
        <div className="route-grid">
          {learningPath.map((item) => (
            <div className="route-step" key={item.title}>
              <item.icon size={22} />
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="stats-strip">
        {dashboardStats.map((stat) => (
          <div className="stat" key={stat.label}>
            <stat.icon size={20} />
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ModuleCard({ module }: { module: LearningModule }) {
  return (
    <article className="module-card" style={{ "--accent": module.accent } as React.CSSProperties}>
      <div className="module-card-head">
        <span className="icon-badge">
          <module.icon size={22} />
        </span>
        <span>{module.shortTitle}</span>
      </div>
      <h3>{module.title}</h3>
      <p>{module.subtitle}</p>
      <a href={`#${module.id}`}>
        进入模块 <ArrowRight size={16} />
      </a>
    </article>
  );
}

function CalculatorBlock({ module }: { module: LearningModule }) {
  const initialValues = Object.fromEntries(module.calculator.fields.map((field) => [field.key, field.defaultValue]));
  const [values, setValues] = useState<Values>(initialValues);
  const result = calcResult(module, values);

  return (
    <div className="calculator-card">
      <div className="block-title">
        <Calculator size={20} />
        <div>
          <h4>{module.calculator.title}</h4>
          <p>{module.calculator.description}</p>
        </div>
      </div>
      <div className="calc-grid">
        {module.calculator.fields.map((field) => (
          <label key={field.key}>
            <span>{field.label}</span>
            <div className="input-wrap">
              <input
                type="number"
                value={values[field.key]}
                onChange={(event) => setValues((current) => ({ ...current, [field.key]: Number(event.target.value) }))}
              />
              <em>{field.suffix}</em>
            </div>
          </label>
        ))}
      </div>
      <div className="calc-result">
        <strong>{result.headline}</strong>
        {result.lines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </div>
    </div>
  );
}

function LearningModuleSection({ module, index }: { module: LearningModule; index: number }) {
  return (
    <section className="module-section" id={module.id} style={{ "--accent": module.accent } as React.CSSProperties}>
      <div className="section-kicker">
        <span>{String(index + 1).padStart(2, "0")}</span>
        <module.icon size={22} />
        <strong>{module.shortTitle}</strong>
      </div>
      <div className="module-layout">
        <div className="module-main">
          <h2>{module.title}</h2>
          <p className="section-lead">{module.subtitle}</p>
          <div className="metaphor">
            <BookMarked size={22} />
            <p>{module.coreMetaphor}</p>
          </div>

          <div className="content-block">
            <h3>概念解释</h3>
            <ul className="check-list">
              {module.essentials.map((item) => (
                <li key={item}>
                  <CheckCircle2 size={18} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="content-block">
            <h3>操作流程</h3>
            <ol className="step-list">
              {module.steps.map((step, stepIndex) => (
                <li key={step}>
                  <span>{stepIndex + 1}</span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="content-block split-block">
            <div>
              <h3>风险检查</h3>
              <ul className="risk-list">
                {module.risks.map((risk) => (
                  <li key={risk}>{risk}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>常见误区</h3>
              <ul className="risk-list quiet">
                {module.mistakes.map((mistake) => (
                  <li key={mistake}>{mistake}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="content-block case-card">
            <h3>{module.caseStudy.title}</h3>
            {module.caseStudy.body.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>

        <aside className="module-side">
          {module.image ? <img src={module.image} alt={`${module.shortTitle} 原始素材截图`} /> : null}
          <CalculatorBlock module={module} />
          <div className="terms-card">
            <h3>关键术语</h3>
            {module.terms.map((term) => (
              <details key={term.name}>
                <summary>{term.name}</summary>
                <p>{term.plain}</p>
              </details>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

function Glossary() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return glossary;
    return glossary.filter((term) =>
      [term.name, term.plain, term.module].some((value) => value.toLowerCase().includes(keyword)),
    );
  }, [query]);

  return (
    <section className="glossary-section" id="glossary">
      <div className="section-heading">
        <p className="eyebrow">Glossary</p>
        <h2>术语总表</h2>
        <p>遇到不懂的词，先在这里查。每个解释都尽量用普通话说清楚。</p>
      </div>
      <label className="search-box">
        <Search size={20} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索：净值、孖展、强赎、网格..." />
      </label>
      <div className="glossary-grid">
        {filtered.map((term) => (
          <article key={`${term.module}-${term.name}`}>
            <span>{term.module}</span>
            <h3>{term.name}</h3>
            <p>{term.plain}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function RiskAndSources() {
  return (
    <>
      <section className="risk-section" id="risk">
        <div className="section-heading">
          <p className="eyebrow">Risk First</p>
          <h2>先把边界想清楚</h2>
          <p>本网站只做学习，不输出实时买卖建议。任何策略开始前，都先看最坏情况。</p>
        </div>
        <div className="notes-grid">
          {visualNotes.map((note) => (
            <div className="note-card" key={note.text}>
              <note.icon size={22} />
              <span>{note.text}</span>
            </div>
          ))}
        </div>
        <div className="disclaimer">
          <ShieldCheck size={24} />
          <p>
            投资有风险。LOF、ETF、港股新股和可转债都可能亏损，且规则会随交易所、券商和监管要求变化。实际操作前请阅读最新公告和产品文件。
          </p>
        </div>
      </section>

      <section className="sources-section" id="sources">
        <div className="section-heading">
          <p className="eyebrow">References</p>
          <h2>官方来源</h2>
          <p>用于核对基础机制和规则口径。</p>
        </div>
        <div className="sources-grid">
          {officialSources.map((source) => (
            <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>
              <strong>{source.title}</strong>
              <span>{source.detail}</span>
              <em>
                打开来源 <ExternalLink size={14} />
              </em>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}

function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <section className="modules-overview" id="modules">
          <div className="section-heading">
            <p className="eyebrow">Playbook</p>
            <h2>四个模块，一条学习路线</h2>
            <p>每个模块都按“概念解释、生活化比喻、操作流程、风险检查、常见误区”组织。</p>
          </div>
          <div className="module-cards">
            {modules.map((module) => (
              <ModuleCard module={module} key={module.id} />
            ))}
          </div>
        </section>

        {modules.map((module, index) => (
          <LearningModuleSection module={module} index={index} key={module.id} />
        ))}

        <Glossary />
        <RiskAndSources />
      </main>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
