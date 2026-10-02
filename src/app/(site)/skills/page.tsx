import type { Metadata } from "next";
import Link from "next/link";
import { AGENTS, AGENT_IDS } from "@/config/agents";
import { getRepository } from "@/server";
import { EmptyState, Pagination, SearchBox, SkillGrid } from "@/components/ui";
import { one, qs } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Browse Skills" };

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function SkillsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const repo = getRepository();
  const categories = repo.listCategories();
  const q = (one(sp.q) ?? "").trim().slice(0, 100);
  const category = categories.find((c) => c.slug === one(sp.category))?.slug;
  const agent = (AGENT_IDS as string[]).includes(one(sp.agent) ?? "") ? one(sp.agent) : undefined;
  const v = one(sp.verification);
  const verification = v === "verified" || v === "community" || v === "experimental" ? v : undefined;
  const tag = (one(sp.tag) ?? "").trim().toLowerCase().slice(0, 32) || undefined;
  const page = Math.max(parseInt(one(sp.page) ?? "1", 10) || 1, 1);

  const result = repo.listPublic({ q, category, agent, verification, tag, page, pageSize: 24 });
  const filtered = !!(q || category || agent || verification || tag);
  const base = { q, category, agent, verification, tag };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">{q ? `Results for "${q}"` : "Browse Skills"}</h1>
      <div className="mt-5 max-w-2xl"><SearchBox defaultValue={q} id="list-q" /></div>

      <form action="/skills" method="get" className="mt-5 flex flex-wrap items-end gap-3" aria-label="Filters">
        {q && <input type="hidden" name="q" value={q} />}
        {tag && <input type="hidden" name="tag" value={tag} />}
        {[
          { name: "category", label: "Category", value: category, options: categories.map((c) => [c.slug, c.name]) },
          { name: "agent", label: "Agent", value: agent, options: AGENTS.map((a) => [a.id, a.name]) },
          { name: "verification", label: "Verification", value: verification, options: [["verified", "Verified"], ["community", "Community"], ["experimental", "Experimental"]] },
        ].map((f) => (
          <div key={f.name}>
            <label htmlFor={`f-${f.name}`} className="mb-1 block text-sm font-medium">{f.label}</label>
            <select id={`f-${f.name}`} name={f.name} defaultValue={f.value ?? ""} className="field w-auto min-w-40">
              <option value="">All</option>
              {f.options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
            </select>
          </div>
        ))}
        <button className="btn btn-quiet" type="submit">Apply filters</button>
        {filtered && <Link href="/skills" className="py-2.5 text-sm font-semibold text-accent">Clear all</Link>}
      </form>

      <p className="mt-6 text-sm text-muted" role="status">
        {result.total} {result.total === 1 ? "Skill" : "Skills"}{tag ? ` tagged "${tag}"` : ""}
      </p>

      <div className="mt-3">
        {result.items.length === 0 ? (
          filtered ? (
            <EmptyState title="No Skills match">
              Try fewer words or remove a filter. <Link href="/skills" className="font-semibold text-accent">Clear all filters</Link>
            </EmptyState>
          ) : (
            <EmptyState title="No Skills are published yet">The catalog is empty right now.</EmptyState>
          )
        ) : (
          <SkillGrid skills={result.items} />
        )}
      </div>
      <Pagination page={result.page} total={result.total} pageSize={result.pageSize} href={(p) => `/skills${qs({ ...base, page: p })}`} />
    </div>
  );
}
