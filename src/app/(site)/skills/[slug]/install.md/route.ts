import { NextResponse } from "next/server";
import { renderInstallGuide } from "@/lib/install-guide";
import { siteUrl } from "@/config/site";
import { getRepository } from "@/server";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const skill = getRepository().getPublicBySlug(slug);
  const headers = { "Content-Type": "text/markdown; charset=utf-8", "X-Content-Type-Options": "nosniff" };
  if (!skill) {
    return new NextResponse(`# Not found\n\nNo published Skill has the slug "${slug.replace(/[^\w-]/g, "")}".\n`, {
      status: 404,
      headers,
    });
  }
  return new NextResponse(renderInstallGuide(skill, siteUrl()), {
    status: 200,
    headers: { ...headers, "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600" },
  });
}
