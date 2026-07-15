"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, MailCheck, RotateCw } from "lucide-react";
import { registerSchema, type RegisterInput } from "../schemas/register.schema";
import { resendSignUpEmail, signUpWithPassword } from "../services/auth.service";
import { AuthSubmitMessage } from "./AuthSubmitMessage";

export interface RegisterFormProps {
  onSubmit?: (data: RegisterInput) => Promise<void> | void;
}

export function RegisterForm({ onSubmit }: RegisterFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function submit(data: RegisterInput) {
    setSubmitError(null);
    setResendMessage(null);

    try {
      if (onSubmit) {
        await onSubmit(data);
        return;
      }

      const { data: authData, error } = await signUpWithPassword(data);
      if (error) throw error;

      if (!authData.user) {
        throw new Error("Supabase did not return a user. Please try again.");
      }

      if (authData.user.identities?.length === 0) {
        throw new Error("This email is already registered. Log in or reset its password instead.");
      }

      if (authData.session) {
        router.replace("/onboarding");
        router.refresh();
        return;
      }

      const normalizedEmail = data.email.trim().toLowerCase();
      setCreatedEmail(normalizedEmail);
      reset();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to create your account.");
    }
  }

  async function resend() {
    if (!createdEmail) return;
    setIsResending(true);
    setSubmitError(null);
    setResendMessage(null);

    try {
      const { error } = await resendSignUpEmail(createdEmail);
      if (error) throw error;
      setResendMessage("A new confirmation email was sent. Check spam if it does not arrive soon.");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to resend the email.");
    } finally {
      setIsResending(false);
    }
  }

  if (createdEmail) {
    return (
      <section className="gc-card space-y-5 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-300/15 text-indigo-200">
            <MailCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold">Confirm your email</h2>
            <p className="mt-1 text-sm leading-6 text-neutral-400">
              We created the account for <strong className="text-white">{createdEmail}</strong>. Open the email from Gym Crew, then come back and log in.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-indigo-300/15 bg-indigo-300/[0.06] p-3 text-sm text-neutral-300">
          <p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4 text-indigo-200" /> The confirmation link should return to Gym Crew, not localhost.</p>
        </div>

        <AuthSubmitMessage message={submitError} />
        <AuthSubmitMessage message={resendMessage} tone="success" />

        <button type="button" onClick={() => void resend()} disabled={isResending} className="gc-secondary-button w-full disabled:opacity-50">
          <RotateCw className={`h-4 w-4 ${isResending ? "animate-spin" : ""}`} />
          {isResending ? "Sending…" : "Resend confirmation email"}
        </button>
        <Link href="/login" className="gc-primary-button w-full">Continue to login</Link>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
      <div>
        <label htmlFor="displayName" className="mb-1.5 block text-sm font-semibold text-neutral-300">Name</label>
        <input id="displayName" autoComplete="name" className="gc-input" {...register("displayName")} />
        {errors.displayName ? <p className="mt-1.5 text-xs font-semibold text-red-400">{errors.displayName.message}</p> : null}
      </div>
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-neutral-300">Email</label>
        <input id="email" type="email" autoComplete="email" className="gc-input" {...register("email")} />
        {errors.email ? <p className="mt-1.5 text-xs font-semibold text-red-400">{errors.email.message}</p> : null}
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-neutral-300">Password</label>
        <input id="password" type="password" autoComplete="new-password" className="gc-input" {...register("password")} />
        {errors.password ? <p className="mt-1.5 text-xs font-semibold text-red-400">{errors.password.message}</p> : null}
      </div>
      <div>
        <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-semibold text-neutral-300">Confirm password</label>
        <input id="confirmPassword" type="password" autoComplete="new-password" className="gc-input" {...register("confirmPassword")} />
        {errors.confirmPassword ? <p className="mt-1.5 text-xs font-semibold text-red-400">{errors.confirmPassword.message}</p> : null}
      </div>

      <AuthSubmitMessage message={submitError} />

      <button type="submit" disabled={isSubmitting} className="gc-primary-button mt-1 w-full disabled:cursor-not-allowed disabled:opacity-50">
        {isSubmitting ? "Creating account…" : "Create account"}
      </button>

      <p className="text-sm text-neutral-400">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-white transition hover:text-indigo-200">Log in</Link>
      </p>
    </form>
  );
}
