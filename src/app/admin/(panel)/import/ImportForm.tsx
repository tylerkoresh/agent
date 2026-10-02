"use client";
import { useActionState } from "react";
import { importCatalog, type ImportState } from "../../actions";

export function ImportForm() {
  const [state, action, pending] = useActionState<ImportState, FormData>(importCatalog, {});
  const r = state.report;
  return (
    <form action={action} className="mt-6 space-y-4">
      <div>
        <label htmlFor="file" className="mb-1 block text-sm font-medium">File (.yaml, .yml or .json)</label>
        <input id="file" name="file" type="file" accept=".yaml,.yml,.json" className="field" required />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="dryRun" defaultChecked /> Check only. Report what would change without saving.
      </label>
      <button className="btn" disabled={pending}>{pending ? "Working" : "Import"}</button>

      <div aria-live="polite">
        {state.error && <p role="alert" className="rounded-md bg-danger-bg p-3 text-danger">{state.error}</p>}
        {r && r.ok && (
          <p className="rounded-md bg-ok-bg p-3 text-ok">
            {r.dryRun ? "Check passed. Would create" : "Imported. Created"} {r.created}, {r.dryRun ? "update" : "updated"} {r.updated}.
          </p>
        )}
        {r && !r.ok && (
          <div role="alert" className="rounded-md bg-danger-bg p-3 text-danger">
            <p className="font-semibold">Nothing was imported. Fix these and try again:</p>
            <ul className="mt-2 space-y-2">
              {r.issues.map((i) => (
                <li key={i.entry}><strong>{i.entry}</strong>
                  <ul className="ml-4 list-disc">{i.messages.map((m) => <li key={m}>{m}</li>)}</ul>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </form>
  );
}
