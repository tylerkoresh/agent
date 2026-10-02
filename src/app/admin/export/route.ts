import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { exportJson, exportYaml } from "@/server/catalog";
import { getRepository } from "@/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isAdmin())) return new NextResponse("Unauthorized", { status: 401 });
  const json = new URL(req.url).searchParams.get("format") === "json";
  const skills = getRepository().exportAll();
  return new NextResponse(json ? exportJson(skills) : exportYaml(skills), {
    headers: {
      "Content-Type": json ? "application/json; charset=utf-8" : "text/yaml; charset=utf-8",
      "Content-Disposition": `attachment; filename="skills-export.${json ? "json" : "yaml"}"`,
      "Cache-Control": "no-store",
    },
  });
}
