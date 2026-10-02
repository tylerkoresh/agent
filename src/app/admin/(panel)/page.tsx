import Link from "next/link";
import { getRepository } from "@/server";
import { Pagination } from "@/components/ui";
import { one, qs, formatDate } from "@/lib/utils";
import { setStatus } from "../actions";

export const dynamic = "force-dynamic";
type SP = Promise<Record<string, string | string[] | undefined>>;

const STATUS_CLS = { published: "bg-ok-bg text-ok", draft: "bg-wash text-muted", unpublished: "bg-warn-bg text-warn" } as const;

export default async function AdminList({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const repo = getRepository();
  const q = (one(sp.q) ?? "").trim().slice(0, 100);
  const s = one(sp.status);
  const status = s === "published" || s === "draft" || s === "unpublished" ? s : undefined;
  const page = Math.max(parseInt(one(sp.page) ?? "1", 10) || 1, 1);
  const r = repo.listAdmin({ q, status, page, pageSize: 50 });
  const c = repo.counts();
  const here = `/admin${qs({ q, status, page: page > 1 ? page : undefined })}`;
  const error = one(sp.error);
  const done = one(sp.done);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Skills</h1>
        <Link href="/admin/skills/new" className="btn">Add Skill</Link>
      </div>
      <p className="mt-1 text-sm text-muted">
        {c.total} total: {c.published} published, {c.draft} draft, {c.unpublished} unpublished
      </p>
      {error && <p role="alert" className="mt-4 rounded-md bg-danger-bg p-3 text-danger">{error}</p>}
      {done && <p role="status" className="mt-4 rounded-md bg-ok-bg p-3 text-ok">Skill is now {done}.</p>}

      <form method="get" className="mt-5 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="aq" className="mb-1 block text-sm font-medium">Search</label>
          <input id="aq" name="q" defaultValue={q} className="field" />
        </div>
        <div>
          <label htmlFor="as" className="mb-1 block text-sm font-medium">Status</label>
          <select id="as" name="status" defaultValue={status ?? ""} className="field">
            <option value="">All</option><option value="published">Published</option>
            <option value="draft">Draft</option><option value="unpublished">Unpublished</option>
          </select>
        </div>
        <button className="btn btn-quiet">Filter</button>
      </form>

      <div className="mt-5 overflow-x-auto rounded-lg border border-line bg-paper">
        {r.items.length === 0 ? (
          <p className="p-8 text-center text-muted">
            {q || status ? "No Skills match these filters." : "No Skills yet. Add one, or import a YAML file."}
          </p>
        ) : (
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th className="p-3 font-medium">Skill</th><th className="p-3 font-medium">Category</th>
                <th className="p-3 font-medium">Verification</th><th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Updated</th><th className="p-3 font-medium"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {r.items.map((sk) => (
                <tr key={sk.id} className="border-b border-line last:border-0">
                  <td className="p-3">
                    <Link href={`/admin/skills/${sk.id}`} className="font-semibold hover:text-accent">{sk.name}</Link>
                    <div className="text-muted">{sk.slug}{sk.isSample ? " · sample" : ""}</div>
                  </td>
                  <td className="p-3">{sk.categoryName}</td>
                  <td className="p-3 capitalize">{sk.verification}</td>
                  <td className="p-3"><span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${STATUS_CLS[sk.status]}`}>{sk.status}</span></td>
                  <td className="p-3 whitespace-nowrap">{formatDate(sk.updatedAt)}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/skills/${sk.id}`} className="font-semibold text-accent">Edit</Link>
                      <form action={setStatus}>
                        <input type="hidden" name="id" value={sk.id} />
                        <input type="hidden" name="back" value={here} />
                        <input type="hidden" name="status" value={sk.status === "published" ? "unpublished" : "published"} />
                        <button className="font-semibold text-accent">{sk.status === "published" ? "Unpublish" : "Publish"}</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination page={r.page} total={r.total} pageSize={r.pageSize} href={(p) => `/admin${qs({ q, status, page: p })}`} />
    </div>
  );
}
