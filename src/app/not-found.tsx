import Link from "next/link";
import { Footer, Header } from "@/components/Chrome";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
        <p className="mt-3 max-w-xl text-muted">
          That page doesn&rsquo;t exist, or the Skill is no longer published.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/skills" className="btn">Browse Skills</Link>
          <Link href="/" className="btn btn-quiet">Go to the homepage</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
