import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { site } from "@/config/site";
import { logout } from "../actions";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <>
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <Link href="/admin" className="font-bold">{site.shortName} admin</Link>
          <nav aria-label="Admin" className="flex gap-5 text-sm font-medium">
            <Link href="/admin" className="hover:text-accent">Skills</Link>
            <Link href="/admin/skills/new" className="hover:text-accent">Add Skill</Link>
            <Link href="/admin/import" className="hover:text-accent">Import</Link>
            <a href="/admin/export?format=yaml" className="hover:text-accent">Export YAML</a>
            <a href="/admin/export?format=json" className="hover:text-accent">Export JSON</a>
          </nav>
          <div className="ml-auto flex items-center gap-4 text-sm">
            <Link href="/" className="hover:text-accent">View site</Link>
            <form action={logout}><button className="font-medium hover:text-accent">Sign out</button></form>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </>
  );
}
