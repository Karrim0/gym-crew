"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema, type UpdateProfileInput } from "../schemas/update-profile.schema";

export interface ProfileFormProps {
  defaultValues?: Partial<UpdateProfileInput>;
  onSubmit?: (data: UpdateProfileInput) => void;
}

/** Minimal placeholder form for editing display name and avatar. */
export function ProfileForm({ defaultValues, onSubmit }: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({ resolver: zodResolver(updateProfileSchema), defaultValues });

  return (
    <form onSubmit={handleSubmit((data) => onSubmit?.(data))} className="flex flex-col gap-3">
      <div>
        <label htmlFor="displayName" className="text-sm font-medium">
          Display name
        </label>
        <input id="displayName" className="w-full rounded-md border p-2" {...register("displayName")} />
        {errors.displayName ? <p className="text-xs text-red-600">{errors.displayName.message}</p> : null}
      </div>
      <button type="submit" disabled={isSubmitting} className="rounded-md border p-2 font-medium">
        Save
      </button>
    </form>
  );
}
