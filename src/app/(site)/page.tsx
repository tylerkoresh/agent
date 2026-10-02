import Link from "next/link";
import { site } from "@/config/site";
import { getRepository } from "@/server";
import { EmptyState, SearchBox, SkillGrid } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function Home() {
  const repo = getRepository();
  const categories = repo.listCategories();
  const counts = repo.publishedCountsByCategory();
  const featured = repo.listFeatured(6);
  const featuredIds = new Set(featured.map((s) => s.id));
  const latest = repo.listLatest(9).filter((s) => !featuredIds.has(s.id)).slice(0, 6);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-14">
      <section className="pt-4 sm:pt-10">
        <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
          Agent Skills for founders and startups
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Marketing, sales, SEO, research, fundraising and more. Every Skill shows who made it, where it comes from,
          its license and which agents it works with.
        </p>
        <div className="mt-7 max-w-2xl">
          <SearchBox large id="home-q" />
        </div>
      </section>

      <section id="categories" aria-labelledby="cat-h" className="scroll-mt-6">
        <h2 id="cat-h" className="mb-4 text-xl font-semibold">Browse by category</h2>
        <ul className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <li key={c.slug} className="border-t border-line">
              <Link href={`/category/${c.slug}`} className="group flex items-baseline justify-between gap-3 py-3">
                <span>
                  <span className="block font-semibold group-hover:text-accent">{c.name}</span>
                  <span className="block text-sm text-muted">{c.description}</span>
                </span>
                <span className="shrink-0 text-sm tabular-nums text-muted">{counts[c.slug] ?? 0}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {total === 0 ? (
        <EmptyState title="No Skills are published yet">
          {site.name} is being built up one tested Skill at a time. Check back soon.
        </EmptyState>
      ) : (
        <>
          {featured.length > 0 && (
            <section aria-labelledby="feat-h">
              <h2 id="feat-h" className="mb-4 text-xl font-semibold">Featured Skills</h2>
              <SkillGrid skills={featured} />
            </section>
          )}
          {latest.length > 0 && (
            <section aria-labelledby="new-h">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 id="new-h" className="text-xl font-semibold">Recently added</h2>
                <Link href="/skills" className="text-sm font-semibold text-accent">Browse all {total} Skills</Link>
              </div>
              <SkillGrid skills={latest} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
