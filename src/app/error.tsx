"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-20">
      <h1 className="text-3xl font-bold tracking-tight">Something went wrong</h1>
      <p className="mt-3 text-muted">The page could not be loaded. Try again, and if it keeps happening, come back in a few minutes.</p>
      <button onClick={reset} className="btn mt-6">Try again</button>
    </main>
  );
}
