import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { agentName } from "@/config/agents";
import { siteUrl } from "@/config/site";
import { getRepository } from "@/server";
import { CopyButton } from "@/components/CopyButton";
import { SampleBadge, VerificationBadge } from "@/components/ui";
import { formatDate, paragraphs } from "@/lib/utils";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = getRepository().getPublicBySlug((await params).slug);
  return s ? { title: s.name, description: s.shortDescription } : { title: "Skill not found" };
}

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div className="border-t border-line py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-0.5 break-words">{children}</dd>
    </div>
  );
}

export default async function SkillPage({ params }: Props) {
  const { slug } = await params;
  const s = getRepository().getPublicBySlug(slug);
  if (!s) notFound();

  const guideUrl = `${siteUrl()}/skills/${s.slug}/install.md`;
  const prompt = `Install the Agent Skill "${s.name}". Read and follow the guide at ${guideUrl}`;
  const sourceHref = s.repoUrl || s.sourceUrl;

  return (
    <article>
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-muted">
        <Link href="/" className="hover:text-accent">Home</Link> /{" "}
        <Link href={`/category/${s.categorySlug}`} className="hover:text-accent">{s.categoryName}</Link>
      </nav>

      <header className="max-w-3xl">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <VerificationBadge status={s.verification} />
          {s.isSample && <SampleBadge />}
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{s.name}</h1>
        <p className="mt-3 text-lg text-muted">{s.shortDescription}</p>
      </header>

      <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-10">
          <section aria-labelledby="what">
            <h2 id="what" className="mb-3 text-xl font-semibold">What it does</h2>
            <div className="prose-plain space-y-4">
              {paragraphs(s.fullDescription).map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </section>

          {s.whoItsFor && (
            <section aria-labelledby="who">
              <h2 id="who" className="mb-3 text-xl font-semibold">Who it&rsquo;s for</h2>
              <p className="prose-plain">{s.whoItsFor}</p>
            </section>
          )}

          <section aria-labelledby="install" className="rounded-lg border border-line bg-wash p-5">
            <h2 id="install" className="text-xl font-semibold">Install or use this Skill</h2>
            <p className="mt-2 text-muted">
              {s.distribution === "link_only"
                ? "This Skill is published by its creator. We link to the original source and do not host its files."
                : "Get this Skill from its original source."}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {sourceHref && <a className="btn" href={sourceHref} {...ext}>Get the Skill from its source</a>}
              <a className="btn btn-quiet" href={`/skills/${s.slug}/install.md`}>Agent install guide</a>
            </div>

            <h3 className="mt-6 font-semibold">Ask your agent to install it</h3>
            <p className="mt-1 text-sm text-muted">Paste this into your agent. It reads the install guide and asks you to confirm before installing.</p>
            <div className="mt-2 flex items-start gap-2">
              <code className="block min-w-0 flex-1 [overflow-wrap:anywhere] rounded-md border border-line bg-paper p-3 text-sm">{prompt}</code>
              <CopyButton text={prompt} />
            </div>

            {s.installInstructions && (
              <div className="mt-6">
                <h3 className="font-semibold">Notes</h3>
                <div className="prose-plain mt-1 space-y-3 text-[0.95rem]">
                  {paragraphs(s.installInstructions).map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}
                </div>
              </div>
            )}
            {s.agents.some((a) => a.installInstructions) && (
              <div className="mt-6 space-y-4">
                {s.agents.filter((a) => a.installInstructions).map((a) => (
                  <div key={a.agent}>
                    <h3 className="font-semibold">{agentName(a.agent)}</h3>
                    <p className="prose-plain mt-1 whitespace-pre-line text-[0.95rem]">{a.installInstructions}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside aria-label="Skill details" className="space-y-8">
          <section aria-labelledby="agents">
            <h2 id="agents" className="mb-2 text-lg font-semibold">Works with</h2>
            <ul className="space-y-2">
              {s.agents.map((a) => (
                <li key={a.agent} className="rounded-md border border-line p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold">{agentName(a.agent)}</span>
                    <span className={`text-xs font-semibold ${a.evidence === "tested" ? "text-ok" : "text-muted"}`}>
                      {a.evidence === "tested" ? "Tested by us" : "Declared by source"}
                    </span>
                  </div>
                  {a.note && <p className="mt-1 text-sm text-muted">{a.note}</p>}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">Agents not listed here have not been confirmed.</p>
          </section>

          <section aria-labelledby="details">
            <h2 id="details" className="mb-1 text-lg font-semibold">Details</h2>
            <dl>
              <Row label="Created by">
                {s.creatorUrl ? <a className="text-accent underline underline-offset-2" href={s.creatorUrl} {...ext}>{s.creatorName}</a> : s.creatorName}
              </Row>
              <Row label="Original source">
                {s.sourceUrl && <a className="text-accent underline underline-offset-2" href={s.sourceUrl} {...ext}>{new URL(s.sourceUrl).host}{new URL(s.sourceUrl).pathname.replace(/\/$/, "")}</a>}
              </Row>
              <Row label="Repository">
                {s.repoUrl && <a className="text-accent underline underline-offset-2" href={s.repoUrl} {...ext}>{s.repoUrl.replace(/^https?:\/\//, "")}</a>}
              </Row>
              <Row label="Path in repository">{s.repoSubpath && <code className="text-sm">{s.repoSubpath}</code>}</Row>
              <Row label="License">
                {s.licenseSpdx && (s.licenseUrl ? <a className="text-accent underline underline-offset-2" href={s.licenseUrl} {...ext}>{s.licenseSpdx}</a> : s.licenseSpdx)}
              </Row>
              <Row label="Attribution">{s.attribution}</Row>
              <Row label="Version">{s.version}</Row>
              <Row label="Last tested">{formatDate(s.lastTestedAt)}</Row>
              <Row label="Added">{formatDate(s.addedAt)}</Row>
              <Row label="Tags">
                {s.tags.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5">
                    {s.tags.map((t) => (
                      <li key={t}><Link href={`/skills?tag=${encodeURIComponent(t)}`} className="rounded-md bg-wash px-2 py-0.5 text-sm hover:text-accent">{t}</Link></li>
                    ))}
                  </ul>
                )}
              </Row>
            </dl>
          </section>
        </aside>
      </div>
    </article>
  );
}
