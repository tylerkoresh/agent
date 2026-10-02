import { redirect } from "next/navigation";
import { adminConfigured, isAdmin } from "@/lib/auth";
import { site } from "@/config/site";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  const configured = adminConfigured();
  return (
    <main className="mx-auto max-w-sm px-4 py-20">
      <h1 className="text-2xl font-bold">{site.name} admin</h1>
      {configured ? (
        <LoginForm />
      ) : (
        <p role="alert" className="mt-4 rounded-md bg-warn-bg p-4 text-warn">
          Admin is disabled. Set ADMIN_USERNAME, ADMIN_PASSWORD and ADMIN_SESSION_SECRET (32+ characters) in the
          environment, then restart.
        </p>
      )}
    </main>
  );
}
