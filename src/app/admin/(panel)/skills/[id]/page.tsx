import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepository } from "@/server";
import { skillToEntry } from "@/server/catalog";
import { SkillForm } from "@/components/SkillForm";
import { saveSkill, setStatus } from "../../../actions";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> };

export default async function EditSkill({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const repo = getRepository();
  const skill = repo.getById(id);
  if (!skill) notFound();
  const here = `/admin/skills/${id}`;

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{skill.name}</h1>
        <span className="rounded-md bg-wash px-2 py-0.5 text-sm">{skill.status}</span>
        {skill.status === "published" && <Link href={`/skills/${skill.slug}`} className="text-sm font-semibold text-accent">View public page</Link>}
        <form action={setStatus} className="ml-auto">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="back" value={here} />
          <input type="hidden" name="status" value={skill.status === "published" ? "unpublished" : "published"} />
          <button className="btn btn-quiet">{skill.status === "published" ? "Unpublish" : "Publish"}</button>
        </form>
      </div>
      {sp.saved && <p role="status" className="mb-4 rounded-md bg-ok-bg p-3 text-ok">Saved.</p>}
      {sp.done && <p role="status" className="mb-4 rounded-md bg-ok-bg p-3 text-ok">Skill is now {sp.done}.</p>}
      {sp.error && <p role="alert" className="mb-4 rounded-md bg-danger-bg p-3 text-danger">{sp.error}</p>}
      <SkillForm
        action={saveSkill.bind(null, id)}
        initial={skillToEntry(skill)}
        categories={repo.listCategories()}
        submitLabel="Save changes"
      />
    </div>
  );
}
