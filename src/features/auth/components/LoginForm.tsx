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
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-bold text-neutral-300">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="gc-input"
          {...register("email")}
        />
        {errors.email ? <p className="mt-1.5 text-xs font-semibold text-red-400">{errors.email.message}</p> : null}
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-bold text-neutral-300">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="gc-input"
          {...register("password")}
        />
        {errors.password ? <p className="mt-1.5 text-xs font-semibold text-red-400">{errors.password.message}</p> : null}
      </div>

      <AuthSubmitMessage message={submitError} />

      <button type="submit" disabled={isSubmitting} className="gc-primary-button mt-1 w-full disabled:cursor-not-allowed disabled:opacity-50">
        {isSubmitting ? "Logging in…" : "Log in"}
      </button>

      <div className="flex justify-between gap-3 text-sm font-semibold text-neutral-400">
        <Link href="/forgot-password" className="transition hover:text-lime-300">
          Forgot password?
        </Link>
        <Link href="/register" className="transition hover:text-lime-300">
          Create account
        </Link>
      </div>
    </form>
  );
}
