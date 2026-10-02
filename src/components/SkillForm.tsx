"use client";
import { useActionState } from "react";
import { AGENTS } from "@/config/agents";
import type { SaveState } from "@/app/admin/actions";

type Agent = { agent: string; evidence: string; note: string; installInstructions: string };
type V = Record<string, unknown> & { agents?: Agent[]; tags?: string[] };
type Cat = { slug: string; name: string };

export function SkillForm({
  action, initial, categories, submitLabel,
}: {
  action: (prev: SaveState, fd: FormData) => Promise<SaveState>;
  initial: V;
  categories: Cat[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<SaveState, FormData>(action, {});
  const v: V = state.values ?? initial;
  const err = state.errors ?? {};
  const s = (k: string) => String(v[k] ?? "");
  const agents = (v.agents ?? []) as Agent[];

  const Err = ({ k }: { k: string }) =>
    err[k] ? <p id={`e-${k}`} className="mt-1 text-sm text-danger">{err[k].join(" ")}</p> : null;
  const aria = (k: string) => (err[k] ? { "aria-invalid": true, "aria-describedby": `e-${k}` } : {});

  const text = (k: string, label: string, opts: { required?: boolean; type?: string; hint?: string; max?: number } = {}) => (
    <div>
      <label htmlFor={k} className="mb-1 block text-sm font-medium">{label}{opts.required && <span className="text-danger"> *</span>}</label>
      <input id={k} name={k} type={opts.type ?? "text"} defaultValue={s(k)} maxLength={opts.max} className="field" {...aria(k)} />
      {opts.hint && <p className="mt-1 text-xs text-muted">{opts.hint}</p>}
      <Err k={k} />
    </div>
  );
  const area = (k: string, label: string, rows: number, hint?: string) => (
    <div>
      <label htmlFor={k} className="mb-1 block text-sm font-medium">{label}</label>
      <textarea id={k} name={k} rows={rows} defaultValue={s(k)} className="field" {...aria(k)} />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      <Err k={k} />
    </div>
  );
  const select = (k: string, label: string, options: [string, string][], hint?: string) => (
    <div>
      <label htmlFor={k} className="mb-1 block text-sm font-medium">{label}</label>
      <select id={k} name={k} defaultValue={s(k)} className="field" {...aria(k)}>
        {options.map(([val, l]) => <option key={val} value={val}>{l}</option>)}
      </select>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      <Err k={k} />
    </div>
  );
  const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <fieldset className="space-y-4 rounded-lg border border-line bg-paper p-5">
      <legend className="px-1 text-lg font-semibold">{title}</legend>
      {children}
    </fieldset>
  );

  return (
    <form action={formAction} key={state.nonce ?? "initial"} className="space-y-6">
      {state.message && <p role="alert" className="rounded-md bg-danger-bg p-3 text-danger">{state.message}</p>}
      <input type="hidden" name="isSample" value={v.isSample ? "true" : ""} />

      <Group title="Basics">
        {text("name", "Name", { required: true, max: 80 })}
        {text("slug", "Slug", { hint: "Used in the URL. Leave blank to create it from the name.", max: 80 })}
        {select("category", "Category (exactly one)", [["", "Choose a category"], ...categories.map((c) => [c.slug, c.name] as [string, string])])}
        {text("shortDescription", "Short description", { required: true, max: 200, hint: "One or two sentences. Shown on cards." })}
        {area("fullDescription", "Full description", 8, "Plain text. Blank line between paragraphs. Required to publish.")}
        {text("whoItsFor", "Who it's for", { max: 500 })}
        {text("tags", "Tags", { hint: "Comma separated. Secondary topics, e.g. pricing, saas." })}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={!!v.featured} /> Featured on the homepage</label>
      </Group>

      <Group title="Source and license">
        {text("creatorName", "Creator", { hint: "Required to publish." })}
        {text("creatorUrl", "Creator URL", { type: "url" })}
        {text("sourceUrl", "Original source URL", { type: "url", hint: "Required to publish." })}
        {text("repoUrl", "Repository URL", { type: "url" })}
        {text("repoSubpath", "Path in repository", { hint: "For Skills inside a larger repository, e.g. skills/seo-audit" })}
        {text("pinnedRef", "Pinned commit or tag")}
        {text("licenseSpdx", "License", { hint: "SPDX id such as MIT or Apache-2.0. Use NOASSERTION if the source states none. Required to publish." })}
        {text("licenseUrl", "License URL", { type: "url" })}
        {area("attribution", "Attribution", 2, "Credit line to keep with the Skill.")}
        {select("distribution", "Distribution", [["link_only", "Link only (default)"], ["hostable", "Hostable (permission confirmed)"]], "Third-party Skills stay link-only. Public repos and open licenses do not by themselves grant redistribution rights.")}
        {area("redistributionNote", "Redistribution record", 2, "Required for hostable: who confirmed permission, and when.")}
      </Group>

      <Group title="Install">
        {text("version", "Version", { max: 40 })}
        {area("installInstructions", "Install notes", 5, "Shown on the page and in install.md. Plain text.")}
      </Group>

      <Group title="Compatibility">
        <p className="text-sm text-muted">Only tick an agent when you have evidence. Unticked means compatibility is unknown.</p>
        <Err k="agents" />
        <div className="space-y-4">
          {AGENTS.map((a) => {
            const row = agents.find((x) => x.agent === a.id);
            return (
              <div key={a.id} className="rounded-md border border-line p-3">
                <label className="flex items-center gap-2 font-medium">
                  <input type="checkbox" name={`agent_${a.id}`} defaultChecked={!!row} /> {a.name}
                </label>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`ev-${a.id}`} className="mb-1 block text-sm">Evidence</label>
                    <select id={`ev-${a.id}`} name={`evidence_${a.id}`} defaultValue={row?.evidence ?? "declared"} className="field">
                      <option value="declared">Declared by the source</option>
                      <option value="tested">Tested by us</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`note-${a.id}`} className="mb-1 block text-sm">Note</label>
                    <input id={`note-${a.id}`} name={`note_${a.id}`} defaultValue={row?.note ?? ""} className="field" maxLength={300} />
                  </div>
                </div>
                <div className="mt-3">
                  <label htmlFor={`in-${a.id}`} className="mb-1 block text-sm">Install instructions for {a.name} (optional)</label>
                  <textarea id={`in-${a.id}`} name={`instr_${a.id}`} rows={2} defaultValue={row?.installInstructions ?? ""} className="field" />
                </div>
              </div>
            );
          })}
        </div>
      </Group>

      <Group title="Verification">
        {select("verification", "Status", [["community", "Community"], ["experimental", "Experimental"], ["verified", "Verified"]], "Verified means the team inspected and tested it. Needs a tested agent and a test date.")}
        {text("lastTestedAt", "Last tested", { type: "date" })}
        {area("reviewNotes", "Internal review notes", 4, "Not shown publicly.")}
        {text("addedAt", "Date added", { type: "date", hint: "Defaults to today." })}
      </Group>

      <Group title="Publishing">
        {select("status", "Status", [["draft", "Draft"], ["published", "Published"], ["unpublished", "Unpublished"]], "Publishing checks that creator, source, license, description and agent evidence are present.")}
      </Group>

      <div className="sticky bottom-0 -mx-4 border-t border-line bg-wash/95 px-4 py-3 sm:mx-0 sm:rounded-lg">
        <button className="btn" disabled={pending}>{pending ? "Saving" : submitLabel}</button>
      </div>
    </form>
  );
}
