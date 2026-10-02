"use client";
import { useActionState } from "react";
import { login, type LoginState } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="mt-6 space-y-4">
      {state.error && <p role="alert" className="rounded-md bg-danger-bg p-3 text-danger">{state.error}</p>}
      <div>
        <label htmlFor="username" className="mb-1 block text-sm font-medium">Username</label>
        <input id="username" name="username" className="field" autoComplete="username" required />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">Password</label>
        <input id="password" name="password" type="password" className="field" autoComplete="current-password" required />
      </div>
      <button className="btn w-full" disabled={pending}>{pending ? "Signing in" : "Sign in"}</button>
    </form>
  );
}
