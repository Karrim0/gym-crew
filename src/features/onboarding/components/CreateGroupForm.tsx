"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createGroupSchema, type CreateGroupInput } from "@/features/groups/schemas/create-group.schema";
import { createGroup } from "@/features/groups/services/group.service";

export interface CreateGroupFormProps {
  onSubmit?: (data: CreateGroupInput) => Promise<void> | void;
}

export function CreateGroupForm({ onSubmit }: CreateGroupFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateGroupInput>({ resolver: zodResolver(createGroupSchema) });

  async function submit(data: CreateGroupInput) {
    setSubmitError(null);

    try {
      if (onSubmit) {
        await onSubmit(data);
      } else {
        await createGroup(data.name);
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to create the group.");
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-3" noValidate>
      <div>
        <label htmlFor="name" className="text-sm font-medium">
          Group name
        </label>
        <input id="name" className="w-full rounded-md border p-2" {...register("name")} />
        {errors.name ? <p className="text-xs text-red-600">{errors.name.message}</p> : null}
      </div>
      {submitError ? <p role="alert" className="text-sm text-red-600">{submitError}</p> : null}
      <button type="submit" disabled={isSubmitting} className="rounded-md border p-2 font-medium">
        {isSubmitting ? "Creating group…" : "Create group"}
      </button>
    </form>
  );
}
