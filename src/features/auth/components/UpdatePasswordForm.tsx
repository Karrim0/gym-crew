"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updatePasswordSchema, type UpdatePasswordInput } from "../schemas/update-password.schema";
import { updatePassword } from "../services/auth.service";
import { AuthSubmitMessage } from "./AuthSubmitMessage";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordInput>({ resolver: zodResolver(updatePasswordSchema) });

  async function submit(data: UpdatePasswordInput) {
    setSubmitError(null);

    try {
      const { error } = await updatePassword(data);
      if (error) throw error;

      router.replace("/onboarding");
      router.refresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to update your password.");
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-3" noValidate>
      <div>
        <label htmlFor="password" className="text-sm font-medium">
          New password
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
          Confirm new password
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

      <button type="submit" disabled={isSubmitting} className="rounded-md border p-2 font-medium">
        {isSubmitting ? "Updating password…" : "Update password"}
      </button>
    </form>
  );
}
