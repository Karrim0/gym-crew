"use client";

import { getArabicErrorMessage } from "@/lib/localization";
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
      setSubmitError(getArabicErrorMessage(error, "معرفناش نغيّر الباسورد."));
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-bold text-neutral-300">
          الباسورد الجديد
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          className="gc-input"
          {...register("password")}
        />
        {errors.password ? <p className="mt-1.5 text-xs font-semibold text-red-400">{errors.password.message}</p> : null}
      </div>
      <div>
        <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-bold text-neutral-300">
          أكد الباسورد الجديد
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          className="gc-input"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword ? (
          <p className="mt-1.5 text-xs font-semibold text-red-400">{errors.confirmPassword.message}</p>
        ) : null}
      </div>

      <AuthSubmitMessage message={submitError} />

      <button type="submit" disabled={isSubmitting} className="gc-primary-button mt-1 w-full disabled:cursor-not-allowed disabled:opacity-50">
        {isSubmitting ? "بنغيّر الباسورد…" : "غيّر الباسورد"}
      </button>
    </form>
  );
}
