import Link from "next/link";
import { site } from "@/config/site";
import { SearchBox } from "./ui";

export function Header() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3 sm:px-6">
        <Link href="/" className="shrink-0 text-lg font-bold tracking-tight">
          {site.name}
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-5 text-[0.95rem] font-medium sm:flex">
          <Link href="/skills" className="hover:text-accent">Browse Skills</Link>
          <Link href="/#categories" className="hover:text-accent">Categories</Link>
        </nav>
        <div className="ml-auto hidden w-full max-w-sm md:block">
          <SearchBox id="header-q" />
        </div>
        <Link href="/skills" className="ml-auto text-[0.95rem] font-medium sm:hidden">Browse</Link>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted sm:px-6">
        <p className="max-w-2xl">
          {site.name} links to Skills at their original sources. Creator, source and license are shown on every Skill
          page. Check a Skill's license before you use or share it.
        </p>
      </div>
    </footer>
  );
}
