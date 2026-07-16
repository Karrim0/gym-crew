import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { importedPlanSchema } from "@/features/splits/schemas";
import {
  parseSpreadsheetPlan,
  parseTextPlan,
  type SpreadsheetCell,
} from "@/features/splits/import/local-plan-parser";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "pdf", "txt", "csv", "xlsx", "xls"]);

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

function extension(filename: string) {
  return filename.toLowerCase().split(".").pop() ?? "";
}

function dataUrl(file: File, bytes: Buffer) {
  return `data:${file.type || "application/octet-stream"};base64,${bytes.toString("base64")}`;
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

function validatedLocalPlan(plan: unknown) {
  const result = importedPlanSchema.safeParse(plan);
  return result.success ? result.data : null;
}



async function tryFreeImport(file: File | null, pastedText: string) {
  if (pastedText.length >= 4) {
    const plan = validatedLocalPlan(parseTextPlan(pastedText, file?.name || "Pasted workout plan"));
    if (plan) return { plan, processing: "local" as const, message: "Read locally — no AI cost." };
  }

  if (!file) return null;
  const fileExtension = extension(file.name);
  const bytes = Buffer.from(await file.arrayBuffer());

  if (fileExtension === "xlsx") {
    const { default: readExcelFile } = await import("read-excel-file/node");
    const workbook = await readExcelFile(bytes);
    const sheets = workbook.map((sheet) => ({
      name: sheet.sheet,
      rows: sheet.data as SpreadsheetCell[][],
    }));
    const plan = validatedLocalPlan(parseSpreadsheetPlan(sheets, file.name));
    if (!plan) throw new Error("We could not find workout days and exercises in this spreadsheet. Add day, exercise, sets and reps columns, then try again.");
    return { plan, processing: "local" as const, message: "Spreadsheet read locally — no AI cost." };
  }

  if (fileExtension === "csv" || fileExtension === "txt" || file.type === "text/csv" || file.type === "text/plain") {
    const text = bytes.toString("utf8");
    const plan = validatedLocalPlan(parseTextPlan(text, file.name, fileExtension === "csv" || file.type === "text/csv"));
    if (!plan) throw new Error("We could not find a workout plan in this file. Include a day, exercise name, sets and reps, then try again.");
    return { plan, processing: "local" as const, message: "Text file read locally — no AI cost." };
  }

  return { bytes };
}

async function readWithOptionalAi(file: File, bytes: Buffer) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      error: "This photo or scanned PDF needs optional AI reading. For a free import, upload .xlsx or .csv, or paste the plan text.",
      code: "AI_OPTIONAL_NOT_CONFIGURED",
    }, { status: 422 });
  }

  const instructions = [
    "Convert the uploaded gym plan into Gym Crew's weekly split format.",
    "Read Arabic and English. Never invent a value when the source is clear.",
    "Return every weekday exactly once, Saturday through Friday.",
    "Use recovery for unlisted dates and never create three consecutive recovery days.",
    "The visible day title is primary. Upper, lower, full body and mixed days use workoutType custom.",
    "If sets or reps are missing, use 2 sets and 8-12 reps only for review and add a warning.",
  ].join(" ");

  const content: Array<Record<string, unknown>> = [{ type: "input_text", text: instructions }];
  if (file.type.startsWith("image/") || ["jpg", "jpeg", "png", "webp"].includes(extension(file.name))) {
    content.push({ type: "input_image", image_url: dataUrl(file, bytes), detail: "high" });
  } else {
    content.push({ type: "input_file", filename: file.name, file_data: dataUrl(file, bytes) });
  }

  const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_PLAN_IMPORT_MODEL ?? "gpt-4.1-mini",
      input: [{ role: "user", content }],
      text: { format: { type: "json_schema", name: "gym_crew_imported_plan", strict: true, schema: PLAN_JSON_SCHEMA } },
    }),
  });

  const rawResponse = await openAiResponse.json().catch(() => null);
  if (!openAiResponse.ok) {
    const providerMessage = rawResponse && typeof rawResponse === "object"
      ? (rawResponse as { error?: { message?: string; code?: string } }).error
      : undefined;
    const quotaProblem = providerMessage?.code === "insufficient_quota" || /quota|billing/i.test(providerMessage?.message ?? "");
    return NextResponse.json({
      error: quotaProblem
        ? "AI reading has no available credit. Upload .xlsx or .csv, or paste the plan to import free."
        : "The photo reader could not process this plan. Try a clearer image or use the free spreadsheet/text import.",
      code: quotaProblem ? "AI_QUOTA_UNAVAILABLE" : "AI_IMPORT_FAILED",
    }, { status: 422 });
  }

  const text = outputText(rawResponse);
  if (!text) return NextResponse.json({ error: "The photo reader returned no plan. Try a clearer file." }, { status: 422 });

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "The photo result needs another try. Use a clearer image or paste the plan text." }, { status: 422 });
  }

  const result = importedPlanSchema.safeParse(parsed);
  if (!result.success) {
    return NextResponse.json({ error: "The photo result was incomplete. Review the source or use the free spreadsheet/text import." }, { status: 422 });
  }

  return NextResponse.json({ plan: result.data, processing: "ai", message: "Photo read with optional AI. Review every detail before saving." });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
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
  if (file && !ACCEPTED_EXTENSIONS.has(extension(file.name))) {
    return NextResponse.json({ error: "Use an image, PDF, CSV, .xlsx spreadsheet or text file." }, { status: 415 });
  }
  if (file && extension(file.name) === "xls") {
    return NextResponse.json({ error: "Old .xls files are not supported by the free reader. Open the file and save it as .xlsx or CSV, then upload it again." }, { status: 415 });
  }

  try {
    const freeResult = await tryFreeImport(file, pastedText);
    if (freeResult && "plan" in freeResult) return NextResponse.json(freeResult);
    if (!file || !freeResult || !("bytes" in freeResult)) {
      return NextResponse.json({ error: "We could not understand this plan. Use a spreadsheet with day, exercise, sets and reps columns." }, { status: 422 });
    }
    return readWithOptionalAi(file, freeResult.bytes);
  } catch (caught) {
    return NextResponse.json({
      error: caught instanceof Error ? caught.message : "The plan could not be read.",
    }, { status: 422 });
  }
}
