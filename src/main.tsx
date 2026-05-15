import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Calculator,
  CheckCircle2,
  ExternalLink,
  FileText,
  Home,
  Library,
  Menu,
  Search,
  ShieldAlert,
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

type Route =
  | { name: "home" }
  | { name: "modules" }
  | { name: "glossary" }
  | { name: "sources" }
  | { name: "module"; id: string };

type Values = Record<string, number>;

function parseRoute(): Route {
  const hash = window.location.hash.replace(/^#\/?/, "");
  const [section, id] = hash.split("/");
  if (section === "modules" && id) return { name: "module", id };
  if (section === "modules") return { name: "modules" };
  if (section === "glossary") return { name: "glossary" };
  if (section === "sources") return { name: "sources" };
  return { name: "home" };
}

function useRoute() {
  const [route, setRoute] = useState<Route>(parseRoute);
  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseRoute());
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  return route;
}

function formatPct(value: number) {
  return `${Number.isFinite(value) ? value.toFixed(2) : "0.00"}%`;
}

function calcResult(module: LearningModule, values: Values) {
  if (module.calculator.formula === "lof") {
    const nav = values.nav || 1;
    const price = values.price || 0;
    const cost = values.cost || 0;
    const raw = ((price - nav) / nav) * 100;
    const net = Math.abs(raw) - cost;
    return {
      headline: `${raw > 0 ? "溢价" : "折价"} ${formatPct(Math.abs(raw))}`,
      lines: [
        `扣除综合成本后，理论空间约 ${formatPct(net)}。`,
        net > 0 ? "继续核对到账时间、盘口深度和净值波动。" : "表面差价不足以覆盖成本。",
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
    return {
      headline: `约 ${levels} 格`,
      lines: [
        `底仓约 ${Math.round(baseAmount).toLocaleString()} 元，每格约 ${Math.round(baseAmount / levels).toLocaleString()} 元。`,
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
  const links = [
    ["#/", "首页"],
    ["#/modules", "模块索引"],
    ["#/glossary", "术语索引"],
    ["#/sources", "来源"],
  ];

  return (
    <header className="site-header">
      <a className="brand" href="#/" aria-label="回到首页">
        <span className="brand-mark">IP</span>
        <span>投资理财学习手册</span>
      </a>
      <button className="menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-label="打开导航">
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      <nav className={open ? "site-nav open" : "site-nav"} onClick={() => setOpen(false)}>
        {links.map(([href, label]) => (
          <a href={href} key={href}>
            {label}
          </a>
        ))}
      </nav>
    </header>
  );
}

function PageShell({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: React.ReactNode }) {
  return (
    <main className="page-shell">
      <section className="page-head">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{intro}</p>
      </section>
      {children}
    </main>
  );
}

function HomePage() {
  return (
    <PageShell
      eyebrow="知识型网站 · 模块化学习 · 非投资建议"
      title="投资理财学习手册"
      intro="按主题模块组织，把机制、术语、流程、风险和小计算器放在各自页面里，适合从零开始逐步学习。"
    >
      <section className="overview-grid">
        <div className="knowledge-card wide-card">
          <div className="card-title">
            <Library size={22} />
            <h2>学习路线</h2>
          </div>
          <div className="route-list">
            {learningPath.map((item) => (
              <article key={item.title}>
                <item.icon size={22} />
                <strong>{item.title}</strong>
                <span>{item.text}</span>
              </article>
            ))}
          </div>
        </div>
        <div className="knowledge-card">
          <div className="card-title">
            <FileText size={22} />
            <h2>站点概览</h2>
          </div>
          <div className="stat-list">
            {dashboardStats.map((stat) => (
              <div key={stat.label}>
                <stat.icon size={18} />
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ModuleIndex compact />

      <section className="knowledge-card">
        <div className="card-title">
          <ShieldAlert size={22} />
          <h2>阅读前先看风险边界</h2>
        </div>
        <div className="note-grid">
          {visualNotes.map((note) => (
            <p key={note.text}>
              <note.icon size={18} />
              <span>{note.text}</span>
            </p>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function ModuleIndex({ compact = false }: { compact?: boolean }) {
  return (
    <section className={compact ? "index-section compact" : "index-section"}>
      <div className="section-heading">
        <p className="eyebrow">Modules</p>
        <h2>模块分类索引</h2>
        <p>每个模块都是一个独立知识页，内部再分概念、术语、流程、风险、案例和计算器。</p>
      </div>
      <div className="module-index-grid">
        {modules.map((module, index) => (
          <a
            className="module-index-card"
            href={`#/modules/${module.id}`}
            key={module.id}
            style={{ "--accent": module.accent } as React.CSSProperties}
          >
            <div className="module-card-top">
              <span className="module-number">{String(index + 1).padStart(2, "0")}</span>
              <module.icon size={26} />
            </div>
            <figure className="module-index-visual">
              <img src={module.visual.src} alt={module.visual.alt} loading="lazy" />
            </figure>
            <h3>{module.title}</h3>
            <p>{module.subtitle}</p>
            <dl>
              <div>
                <dt>{module.terms.length}</dt>
                <dd>术语</dd>
              </div>
              <div>
                <dt>{module.steps.length}</dt>
                <dd>步骤</dd>
              </div>
              <div>
                <dt>{module.risks.length}</dt>
                <dd>风险</dd>
              </div>
            </dl>
            <em>
              查看模块 <ArrowRight size={16} />
            </em>
          </a>
        ))}
      </div>
    </section>
  );
}

function ModulesPage() {
  return (
    <PageShell
      eyebrow="Module Index"
      title="按模块学习"
      intro="先选一个主题进入。模块页里会提供目录和局部术语索引，不需要在一条长页面里来回找。"
    >
      <ModuleIndex />
    </PageShell>
  );
}

function CalculatorBlock({ module }: { module: LearningModule }) {
  const initialValues = Object.fromEntries(module.calculator.fields.map((field) => [field.key, field.defaultValue]));
  const [values, setValues] = useState<Values>(initialValues);
  const result = calcResult(module, values);

  return (
    <section className="article-block" id="calculator">
      <div className="block-heading">
        <Calculator size={20} />
        <div>
          <h2>{module.calculator.title}</h2>
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
    </section>
  );
}

function ModulePage({ module }: { module: LearningModule }) {
  const localToc = [
    ["visual", "信息图"],
    ["concepts", "概念解释"],
    ["terms", "术语索引"],
    ["steps", "操作流程"],
    ["risks", "风险误区"],
    ["case", "案例"],
    ["calculator", "计算器"],
  ];

  return (
    <main className="article-page" style={{ "--accent": module.accent } as React.CSSProperties}>
      <aside className="article-sidebar">
        <a className="back-link" href="#/modules">
          <ArrowLeft size={16} /> 模块索引
        </a>
        <div className="sidebar-title">
          <module.icon size={24} />
          <strong>{module.shortTitle}</strong>
        </div>
        <nav>
          {localToc.map(([id, label]) => (
            <button type="button" onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })} key={id}>
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <article className="article-content">
        <header className="article-hero">
          <p className="eyebrow">Module</p>
          <h1>{module.title}</h1>
          <p>{module.subtitle}</p>
          <div className="meta-row">
            <span>{module.audience}</span>
            <span>{module.terms.length} 个术语</span>
            <span>{module.steps.length} 个步骤</span>
          </div>
        </header>

        <section className="metaphor-panel">
          <BookOpenCheck size={22} />
          <p>{module.coreMetaphor}</p>
        </section>

        <figure className="module-visual" id="visual">
          <img src={module.visual.src} alt={module.visual.alt} />
          <figcaption>{module.visual.caption}</figcaption>
        </figure>

        {module.image ? (
          <figure className="source-visual">
            <img className="module-image" src={module.image} alt={`${module.shortTitle} 原始素材截图`} />
            <figcaption>原始素材参考：来自港股打新资料页，用于辅助理解市场热度与炒新节奏。</figcaption>
          </figure>
        ) : null}

        <section className="article-block" id="concepts">
          <h2>概念解释</h2>
          <div className="concept-list">
            {module.essentials.map((item) => (
              <p key={item}>
                <CheckCircle2 size={18} />
                <span>{item}</span>
              </p>
            ))}
          </div>
        </section>

        <section className="article-block" id="terms">
          <h2>本模块术语索引</h2>
          <div className="term-list">
            {module.terms.map((term) => (
              <details key={term.name}>
                <summary>{term.name}</summary>
                <p>{term.plain}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="article-block" id="steps">
          <h2>操作流程</h2>
          <ol className="step-list">
            {module.steps.map((step, stepIndex) => (
              <li key={step}>
                <span>{stepIndex + 1}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="article-block split-block" id="risks">
          <div>
            <h2>风险检查</h2>
            <ul className="risk-list">
              {module.risks.map((risk) => (
                <li key={risk}>{risk}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2>常见误区</h2>
            <ul className="risk-list quiet">
              {module.mistakes.map((mistake) => (
                <li key={mistake}>{mistake}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="article-block case-block" id="case">
          <h2>{module.caseStudy.title}</h2>
          {module.caseStudy.body.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </section>

        <CalculatorBlock module={module} />
      </article>
    </main>
  );
}

function GlossaryPage() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return glossary;
    return glossary.filter((term) =>
      [term.name, term.plain, term.module].some((value) => value.toLowerCase().includes(keyword)),
    );
  }, [query]);

  return (
    <PageShell eyebrow="Glossary" title="术语索引" intro="把全站术语集中在一起，支持搜索，也能按所属模块回到对应知识页。">
      <label className="search-box">
        <Search size={20} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索：净值、孖展、强赎、网格..." />
      </label>
      <div className="glossary-grid">
        {filtered.map((term) => (
          <a className="term-card" href={`#/modules/${term.moduleId}`} key={`${term.module}-${term.name}`}>
            <span>{term.module}</span>
            <h3>{term.name}</h3>
            <p>{term.plain}</p>
          </a>
        ))}
      </div>
    </PageShell>
  );
}

function SourcesPage() {
  return (
    <PageShell eyebrow="References" title="来源与风险声明" intro="基础机制以官方页面为准。网站内容只用于学习整理，不构成投资建议。">
      <section className="knowledge-card">
        <div className="card-title">
          <ShieldAlert size={22} />
          <h2>风险声明</h2>
        </div>
        <p className="body-text">
          LOF、ETF、港股新股和可转债都可能亏损，且规则会随交易所、券商和监管要求变化。实际操作前请阅读最新公告和产品文件，结合自身风险承受能力独立判断。
        </p>
      </section>
      <section className="sources-grid">
        {officialSources.map((source) => (
          <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>
            <strong>{source.title}</strong>
            <span>{source.detail}</span>
            <em>
              打开来源 <ExternalLink size={14} />
            </em>
          </a>
        ))}
      </section>
    </PageShell>
  );
}

function NotFoundPage() {
  return (
    <PageShell eyebrow="404" title="没有找到这个模块" intro="返回模块索引，重新选择一个主题。">
      <a className="primary-link" href="#/modules">
        <Home size={18} /> 返回模块索引
      </a>
    </PageShell>
  );
}

function App() {
  const route = useRoute();
  const currentModule = route.name === "module" ? modules.find((module) => module.id === route.id) : undefined;

  return (
    <>
      <Header />
      {route.name === "home" ? <HomePage /> : null}
      {route.name === "modules" ? <ModulesPage /> : null}
      {route.name === "glossary" ? <GlossaryPage /> : null}
      {route.name === "sources" ? <SourcesPage /> : null}
      {route.name === "module" && currentModule ? <ModulePage module={currentModule} /> : null}
      {route.name === "module" && !currentModule ? <NotFoundPage /> : null}
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
