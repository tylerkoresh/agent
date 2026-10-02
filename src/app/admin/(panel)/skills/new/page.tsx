import { getRepository } from "@/server";
import { SkillForm } from "@/components/SkillForm";
import { saveSkill } from "../../../actions";

export const metadata = { title: "Add Skill" };

export default function NewSkill() {
  const categories = getRepository().listCategories();
  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">Add Skill</h1>
      <SkillForm
        action={saveSkill.bind(null, null)}
        initial={{ distribution: "link_only", verification: "community", status: "draft", tags: [], agents: [] }}
        categories={categories}
        submitLabel="Create Skill"
      />
    </div>
  );
}
