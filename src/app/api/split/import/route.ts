import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { importedPlanSchema } from "@/features/splits/schemas";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const PLAN_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "days", "warnings"],
  properties: {
    title: { type: "string" },
    warnings: { type: "array", maxItems: 12, items: { type: "string" } },
    days: {
      type: "array",
      minItems: 7,
      maxItems: 7,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["weekday", "workoutType", "title", "focus", "iconKey", "colorKey", "notes", "exercises"],
        properties: {
          weekday: { type: "string", enum: ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"] },
          workoutType: { type: "string", enum: ["push", "pull", "legs", "rest", "custom"] },
          title: { type: "string" },
          focus: { type: "string" },
          iconKey: { type: "string", enum: ["dumbbell", "zap", "target", "flame", "shield", "heart", "moon", "activity"] },
          colorKey: { type: "string", enum: ["indigo", "blue", "emerald", "amber", "rose", "violet"] },
          notes: { type: "string" },
          exercises: {
            type: "array",
            maxItems: 30,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "primaryMuscle", "sets", "repsMin", "repsMax", "notes", "confidence"],
              properties: {
                name: { type: "string" },
                primaryMuscle: { type: "string", enum: ["chest", "back", "shoulders", "biceps", "triceps", "quads", "hamstrings", "glutes", "calves", "core"] },
                sets: { type: "integer", minimum: 1, maximum: 20 },
                repsMin: { type: "integer", minimum: 1, maximum: 100 },
                repsMax: { type: "integer", minimum: 1, maximum: 100 },
                notes: { type: "string" },
                confidence: { type: "number", minimum: 0, maximum: 1 },
              },
            },
          },
        },
      },
    },
  },
} as const;

function dataUrl(file: File, bytes: Buffer) {
  return `data:${file.type};base64,${bytes.toString("base64")}`;
}

function outputText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const response = payload as { output_text?: unknown; output?: unknown };
  if (typeof response.output_text === "string") return response.output_text;
  if (!Array.isArray(response.output)) return null;
  for (const item of response.output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string") {
        return (part as { text: string }).text;
      }
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Smart plan import is not configured yet. Add OPENAI_API_KEY on the server." }, { status: 503 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Invalid import request." }, { status: 400 });
  const fileValue = formData.get("file");
  const pastedText = String(formData.get("text") ?? "").trim();
  const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;

  if (!file && pastedText.length < 4) {
    return NextResponse.json({ error: "Upload a plan or paste its text." }, { status: 400 });
  }
  if (file && file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "The file must be 10 MB or smaller." }, { status: 413 });
  }
  if (file && !ACCEPTED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Use an image, PDF, CSV, Excel or text file." }, { status: 415 });
  }

  const instructions = [
    "You convert an existing gym plan into Gym Crew's weekly split format.",
    "Read Arabic and English workout names. Never invent an exercise, set count, rep range or weekday that the source clearly specifies differently.",
    "Return all seven weekdays exactly once, ordered Saturday through Friday. Use recovery days for unlisted dates and distribute unnamed training days logically so there are never three consecutive rest days.",
    "The user's visible day title is primary. Use workoutType only as an internal exercise-library category. Upper, lower, full body or mixed days must use workoutType custom.",
    "When information is unclear, use a sensible neutral default of 2 sets and 8-12 reps only if necessary and add a warning. Mark low-confidence exercise readings below 0.75.",
    "Use short, natural day names and focus labels. Rest days have no exercises, iconKey moon and a calm color.",
  ].join(" ");

  const content: Array<Record<string, unknown>> = [{ type: "input_text", text: instructions }];
  if (pastedText) content.push({ type: "input_text", text: `Plan text:\n${pastedText.slice(0, 30_000)}` });
  if (file) {
    const bytes = Buffer.from(await file.arrayBuffer());
    if (file.type.startsWith("image/")) {
      content.push({ type: "input_image", image_url: dataUrl(file, bytes), detail: "high" });
    } else if (file.type === "text/plain" || file.type === "text/csv") {
      content.push({ type: "input_text", text: `Uploaded file (${file.name}):\n${bytes.toString("utf8").slice(0, 40_000)}` });
    } else {
      content.push({ type: "input_file", filename: file.name, file_data: dataUrl(file, bytes) });
    }
  }

  const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_PLAN_IMPORT_MODEL ?? "gpt-5.6-luna",
      input: [{ role: "user", content }],
      text: {
        format: {
          type: "json_schema",
          name: "gym_crew_imported_plan",
          strict: true,
          schema: PLAN_JSON_SCHEMA,
        },
      },
    }),
  });

  const rawResponse = await openAiResponse.json().catch(() => null);
  if (!openAiResponse.ok) {
    const message = rawResponse && typeof rawResponse === "object"
      ? (rawResponse as { error?: { message?: string } }).error?.message
      : null;
    return NextResponse.json({ error: message ?? "The plan could not be read." }, { status: 502 });
  }

  const text = outputText(rawResponse);
  if (!text) return NextResponse.json({ error: "The plan reader returned no structured result." }, { status: 502 });

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "The imported plan result was not valid JSON." }, { status: 502 });
  }

  const result = importedPlanSchema.safeParse(parsed);
  if (!result.success) {
    return NextResponse.json({ error: "The plan needs another review before it can be imported.", details: result.error.flatten() }, { status: 422 });
  }

  return NextResponse.json({ plan: result.data });
}
