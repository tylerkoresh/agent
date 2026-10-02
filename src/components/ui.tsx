import Link from "next/link";
import { agentName } from "@/config/agents";
import type { Skill } from "@/server/repository";

const VERIFY = {
  verified: { label: "Verified", cls: "bg-ok-bg text-ok", hint: "Inspected and tested by the marketplace team" },
  community: { label: "Community", cls: "bg-wash text-muted", hint: "Listed from its source; not tested by us" },
  experimental: { label: "Experimental", cls: "bg-warn-bg text-warn", hint: "Early or unproven; review before use" },
} as const;

export function VerificationBadge({ status }: { status: Skill["verification"] }) {
  const v = VERIFY[status];
  return (
    <span title={v.hint} className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${v.cls}`}>
      {status === "verified" && (
        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" className="mr-1">
          <path d="M2 6.5l2.5 2.5L10 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {v.label}
    </span>
  );
}

export function AgentChips({ agents, max = 3 }: { agents: Skill["agents"]; max?: number }) {
  if (agents.length === 0) return <span className="text-sm text-muted">No agents listed</span>;
  const shown = agents.slice(0, max);
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Supported agents">
      {shown.map((a) => (
        <li key={a.agent} className="rounded-md border border-line px-1.5 py-0.5 text-xs text-ink">
          {agentName(a.agent)}
        </li>
      ))}
      {agents.length > max && <li className="px-1 py-0.5 text-xs text-muted">+{agents.length - max} more</li>}
    </ul>
  );
}

export function SampleBadge() {
  return (
    <span className="rounded-md border border-dashed border-warn px-2 py-0.5 text-xs font-semibold text-warn" title="Development sample data. Not a real Skill.">
      Sample data
    </span>
  );
}

export function SkillCard({ skill }: { skill: Skill }) {
  return (
    <article className="relative flex h-full flex-col rounded-lg border border-line bg-paper p-4 transition-colors focus-within:border-accent hover:border-accent">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">{skill.categoryName}</span>
        {skill.isSample && <SampleBadge />}
      </div>
      <h3 className="text-lg font-semibold leading-snug">
        <Link href={`/skills/${skill.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
          {skill.name}
        </Link>
      </h3>
      <p className="mt-1.5 line-clamp-3 text-[0.95rem] text-muted">{skill.shortDescription}</p>
      <div className="mt-auto flex flex-col gap-3 pt-4">
        <AgentChips agents={skill.agents} />
        <div className="flex items-center justify-between">
          <VerificationBadge status={skill.verification} />
          <span className="text-sm font-semibold text-accent">View Skill</span>
        </div>
      </div>
    </article>
  );
}

export function SkillGrid({ skills }: { skills: Skill[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {skills.map((s) => (
        <li key={s.id}>
          <SkillCard skill={s} />
        </li>
      ))}
    </ul>
  );
}

export function SearchBox({ defaultValue = "", large = false, id = "q" }: { defaultValue?: string; large?: boolean; id?: string }) {
  return (
    <form action="/skills" method="get" role="search" className="flex w-full gap-2">
      <label htmlFor={id} className="sr-only">
        Search Skills
      </label>
      <input
        id={id}
        name="q"
        type="search"
        defaultValue={defaultValue}
        maxLength={100}
        placeholder="Search Skills, e.g. competitor research, SEO audit"
        className={`field ${large ? "py-3.5 text-lg" : ""}`}
        autoComplete="off"
      />
      <button type="submit" className={`btn shrink-0 ${large ? "px-6 text-base" : ""}`}>
        Search
      </button>
    </form>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-wash px-6 py-12 text-center">
      <p className="text-lg font-semibold">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-muted">{children}</div>}
    </div>
  );
}

export function Pagination({ page, total, pageSize, href }: { page: number; total: number; pageSize: number; href: (p: number) => string }) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-between">
      {page > 1 ? <Link className="btn btn-quiet" href={href(page - 1)}>Previous</Link> : <span />}
      <span className="text-sm text-muted">Page {page} of {pages}</span>
      {page < pages ? <Link className="btn btn-quiet" href={href(page + 1)}>Next</Link> : <span />}
    </nav>
  );
}
