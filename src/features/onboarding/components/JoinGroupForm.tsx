"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { joinGroupSchema, type JoinGroupInput } from "@/features/groups/schemas/join-group.schema";
import { joinGroupByInviteCode } from "@/features/groups/services/group.service";

export interface JoinGroupFormProps {
  onSubmit?: (data: JoinGroupInput) => Promise<void> | void;
}

export function JoinGroupForm({ onSubmit }: JoinGroupFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<JoinGroupInput>({ resolver: zodResolver(joinGroupSchema) });

  async function submit(data: JoinGroupInput) {
    setSubmitError(null);

    try {
      if (onSubmit) {
        await onSubmit(data);
      } else {
        await joinGroupByInviteCode(data.inviteCode);
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to join the group.");
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-3" noValidate>
      <div>
        <label htmlFor="inviteCode" className="text-sm font-medium">
          Invite code
        </label>
        <input
          id="inviteCode"
          autoCapitalize="characters"
          className="w-full rounded-md border p-2 uppercase"
          {...register("inviteCode", {
            setValueAs: (value: string) => value.trim().toUpperCase(),
          })}
        />
        {errors.inviteCode ? <p className="text-xs text-red-600">{errors.inviteCode.message}</p> : null}
      </div>
      {submitError ? <p role="alert" className="text-sm text-red-600">{submitError}</p> : null}
      <button type="submit" disabled={isSubmitting} className="rounded-md border p-2 font-medium">
        {isSubmitting ? "Joining group…" : "Join group"}
      </button>
    </form>
  );
}
