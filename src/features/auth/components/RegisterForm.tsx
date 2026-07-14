"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "../schemas/register.schema";
import { signUpWithPassword } from "../services/auth.service";
import { AuthSubmitMessage } from "./AuthSubmitMessage";

export interface RegisterFormProps {
  onSubmit?: (data: RegisterInput) => Promise<void> | void;
}

export function RegisterForm({ onSubmit }: RegisterFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function submit(data: RegisterInput) {
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      if (onSubmit) {
        await onSubmit(data);
        return;
      }

      const { data: authData, error } = await signUpWithPassword(data);
      if (error) throw error;

      if (authData.session) {
        router.replace("/onboarding");
        router.refresh();
        return;
      }

      setSuccessMessage(
        "Account created. Check your email and confirm it, then log in to continue."
      );
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to create your account.");
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-3" noValidate>
      <div>
        <label htmlFor="displayName" className="text-sm font-medium">
          Name
        </label>
        <input
          id="displayName"
          autoComplete="name"
          className="w-full rounded-md border p-2"
          {...register("displayName")}
        />
        {errors.displayName ? <p className="text-xs text-red-600">{errors.displayName.message}</p> : null}
      </div>
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
          autoComplete="new-password"
          className="w-full rounded-md border p-2"
          {...register("password")}
        />
        {errors.password ? <p className="text-xs text-red-600">{errors.password.message}</p> : null}
      </div>
      <div>
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          className="w-full rounded-md border p-2"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword ? (
          <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>
        ) : null}
      </div>

      <AuthSubmitMessage message={submitError} />
      <AuthSubmitMessage message={successMessage} tone="success" />

      <button type="submit" disabled={isSubmitting} className="rounded-md border p-2 font-medium">
        {isSubmitting ? "Creating account…" : "Create account"}
      </button>

      <p className="text-sm">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
