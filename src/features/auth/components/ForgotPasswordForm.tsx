"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "../schemas/forgot-password.schema";
import { sendPasswordResetEmail } from "../services/auth.service";
import { AuthSubmitMessage } from "./AuthSubmitMessage";

export interface ForgotPasswordFormProps {
  onSubmit?: (data: ForgotPasswordInput) => Promise<void> | void;
}

export function ForgotPasswordForm({ onSubmit }: ForgotPasswordFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function submit(data: ForgotPasswordInput) {
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      if (onSubmit) {
        await onSubmit(data);
        return;
      }

      const { error } = await sendPasswordResetEmail(data);
      if (error) throw error;

      setSuccessMessage("If an account exists for this email, a reset link has been sent.");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to send a reset link.");
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

      <AuthSubmitMessage message={submitError} />
      <AuthSubmitMessage message={successMessage} tone="success" />

      <button type="submit" disabled={isSubmitting} className="rounded-md border p-2 font-medium">
        {isSubmitting ? "Sending…" : "Send reset link"}
      </button>

      <Link href="/login" className="text-sm underline">
        Back to login
      </Link>
    </form>
  );
}
