import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepository } from "@/server";
import { EmptyState, Pagination, SkillGrid } from "@/components/ui";
import { one, qs } from "@/lib/utils";

export const dynamic = "force-dynamic";
type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = getRepository().getCategory(slug);
  return c ? { title: `${c.name} Skills`, description: c.description } : { title: "Category not found" };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const repo = getRepository();
  const category = repo.getCategory(slug);
  if (!category) notFound();
  const page = Math.max(parseInt(one((await searchParams).page) ?? "1", 10) || 1, 1);
  const result = repo.listPublic({ category: slug, page, pageSize: 24 });

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-muted">
        <Link href="/" className="hover:text-accent">Home</Link> / <span>{category.name}</span>
      </nav>
      <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
      <p className="mt-1 text-muted">{category.description}</p>
      <div className="mt-6">
        {result.items.length === 0 ? (
          <EmptyState title={`No ${category.name} Skills yet`}>
            Nothing is published in this category. <Link href="/skills" className="font-semibold text-accent">Browse all Skills</Link>
          </EmptyState>
        ) : (
          <SkillGrid skills={result.items} />
        )}
      </div>
      <Pagination page={result.page} total={result.total} pageSize={result.pageSize} href={(p) => `/category/${slug}${qs({ page: p })}`} />
    </div>
  );
}
