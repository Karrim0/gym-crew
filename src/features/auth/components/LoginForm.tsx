"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "../schemas/login.schema";
import { signInWithPassword } from "../services/auth.service";
import { resolvePostAuthDestination } from "@/features/onboarding/services/onboarding.service";
import { AuthSubmitMessage } from "./AuthSubmitMessage";

export interface LoginFormProps {
  onSubmit?: (data: LoginInput) => Promise<void> | void;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function submit(data: LoginInput) {
    setSubmitError(null);

    try {
      if (onSubmit) {
        await onSubmit(data);
        return;
      }

      const { data: authData, error } = await signInWithPassword(data);
      if (error) throw error;
      if (!authData.user) throw new Error("Login succeeded without a user session.");

      const destination = await resolvePostAuthDestination(authData.user.id);
      router.replace(destination);
      router.refresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to log in right now.");
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-3" noValidate>
      <div>
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="w-full rounded-md border p-2"
          {...register("email")}
        />
        {errors.email ? <p className="text-xs text-red-600">{errors.email.message}</p> : null}
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="w-full rounded-md border p-2"
          {...register("password")}
        />
        {errors.password ? <p className="text-xs text-red-600">{errors.password.message}</p> : null}
      </div>

      <AuthSubmitMessage message={submitError} />

      <button type="submit" disabled={isSubmitting} className="rounded-md border p-2 font-medium">
        {isSubmitting ? "Logging in…" : "Log in"}
      </button>

      <div className="flex justify-between gap-3 text-sm">
        <Link href="/forgot-password" className="underline">
          Forgot password?
        </Link>
        <Link href="/register" className="underline">
          Create account
        </Link>
      </div>
    </form>
  );
}
