import { ImportForm } from "./ImportForm";

export const metadata = { title: "Import" };

export default function ImportPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">Import Skills</h1>
      <p className="mt-2 text-muted">
        Upload a YAML or JSON file with one Skill, a list of Skills, or <code>{"{ skills: [...] }"}</code>. Existing Skills
        are updated by slug. If any entry has a problem, nothing is imported. Use the same shape as an export.
      </p>
      <ImportForm />
    </div>
  );
}
