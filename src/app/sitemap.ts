import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";
import { getRepository } from "@/server";

function allPublic(repo: ReturnType<typeof getRepository>) {
  const out = [];
  for (let page = 1; ; page++) {
    const r = repo.listPublic({ page, pageSize: 100 });
    out.push(...r.items);
    if (page * r.pageSize >= r.total) return out;
  }
}

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const repo = getRepository();
  const base = siteUrl();
  return [
    { url: base },
    { url: `${base}/skills` },
    ...repo.listCategories().map((c) => ({ url: `${base}/category/${c.slug}` })),
    ...allPublic(repo).map((s) => ({ url: `${base}/skills/${s.slug}`, lastModified: s.updatedAt })),
  ];
}
