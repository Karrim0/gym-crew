import type { ImportedPlan, ImportedPlanDay, ImportedPlanExercise } from "../types";

export type SpreadsheetCell = string | number | boolean | Date | null | undefined;

export interface SpreadsheetSheet {
  name: string;
  rows: SpreadsheetCell[][];
}

const WEEKDAYS = [
  "saturday",
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
] as const;

type Weekday = (typeof WEEKDAYS)[number];
type Muscle = ImportedPlanExercise["primaryMuscle"];

interface ParsedExerciseDraft {
  name: string;
  sets?: number;
  repsMin?: number;
  repsMax?: number;
  notes?: string;
  primaryMuscle?: Muscle;
  confidence?: number;
}

interface ParsedDayDraft {
  sourceLabel: string;
  weekday?: Weekday;
  title: string;
  exercises: ParsedExerciseDraft[];
  notes?: string;
  explicitRest?: boolean;
}

interface HeaderMap {
  day?: number;
  exercise?: number;
  sets?: number;
  reps?: number;
  repsMin?: number;
  repsMax?: number;
  notes?: number;
  muscle?: number;
}

const DAY_TOKENS: Record<Weekday, string[]> = {
  saturday: ["saturday", "sat", "السبت", "سبت"],
  sunday: ["sunday", "sun", "الأحد", "الاحد", "احد"],
  monday: ["monday", "mon", "الإثنين", "الاثنين", "اتنين", "اثنين"],
  tuesday: ["tuesday", "tue", "الثلاثاء", "تلات", "ثلاثاء"],
  wednesday: ["wednesday", "wed", "الأربعاء", "الاربعاء", "اربعاء"],
  thursday: ["thursday", "thu", "الخميس", "خميس"],
  friday: ["friday", "fri", "الجمعة", "الجمعه", "جمعة", "جمعه"],
};

const HEADER_MATCHERS: Record<keyof HeaderMap, RegExp> = {
  day: /^(?:day|weekday|training day|اليوم|يوم)$/iu,
  exercise: /^(?:exercise|movement|workout|lift|التمرين|تمرين|الحركة|الحركه)$/iu,
  sets: /^(?:sets?|set count|المجموعات|مجموعات|عدد المجموعات)$/iu,
  reps: /^(?:reps?|repetitions?|rep range|العدات|عدات|التكرارات|تكرارات)$/iu,
  repsMin: /^(?:min reps?|reps? min|minimum reps?|أقل عدات|اقل عدات)$/iu,
  repsMax: /^(?:max reps?|reps? max|maximum reps?|أقصى عدات|اقصى عدات)$/iu,
  notes: /^(?:notes?|instructions?|ملاحظات|ملاحظة)$/iu,
  muscle: /^(?:muscle|target muscle|body part|العضلة|العضله|العضلات)$/iu,
};

const REST_PATTERN = /(?:^|\b)(?:rest|recovery|off|راحة|راحه|استشفاء)(?:\b|$)/iu;
const DAY_TITLE_PATTERN = /(?:push|pull|legs?|upper|lower|full\s*body|chest|back|arms?|shoulders?|glutes?|core|صدر|ظهر|رجل|ارجل|أرجل|علوي|سفلي|كامل|ذراع|كتف)/iu;

const MUSCLE_PATTERNS: Array<[Muscle, RegExp]> = [
  ["chest", /bench|chest|pec|fly|flies|incline.*press|decline.*press|dumbbell press|press up|push[- ]?up|صدر|بنش|تفتيح/iu],
  ["back", /row|pulldown|pull[- ]?up|chin[- ]?up|lat|back|سحب|ظهر|عقلة|عقله/iu],
  ["shoulders", /shoulder|overhead|military|lateral|front raise|rear delt|face pull|كتف|جانبي/iu],
  ["hamstrings", /hamstring|leg curl|romanian|\brdl\b|good morning|خلفي/iu],
  ["biceps", /biceps?|(?<!leg )curl|باي|بايسبس/iu],
  ["triceps", /triceps?|pushdown|skull|extension|تراي|ترايسبس/iu],
  ["quads", /quad|squat|leg press|leg extension|lunge|هاك|سكوات|أمامي|امامي/iu],
  ["glutes", /glute|hip thrust|kickback|abduction|مؤخرة|موخره/iu],
  ["calves", /calf|calves|سمانة|سمانه/iu],
  ["core", /\babs?\b|core|plank|crunch|sit[- ]?up|بطن|كور/iu],
];

function cellText(value: SpreadsheetCell): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[ـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[•·]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanTitle(value: string): string {
  let title = value.trim();
  const weekdayTokens = [
    "saturday", "sat", "السبت", "سبت",
    "sunday", "sun", "الأحد", "الاحد", "احد",
    "monday", "mon", "الإثنين", "الاثنين", "اتنين", "اثنين",
    "tuesday", "tue", "الثلاثاء", "تلات", "ثلاثاء",
    "wednesday", "wed", "الأربعاء", "الاربعاء", "اربعاء",
    "thursday", "thu", "الخميس", "خميس",
    "friday", "fri", "الجمعة", "الجمعه", "جمعة", "جمعه",
  ];
  for (const token of weekdayTokens) {
    title = title.replace(new RegExp(token, "giu"), " ");
  }
  title = title.replace(/^[\s\-–—:|/]+|[\s\-–—:|/]+$/g, "").replace(/\s+/g, " ").trim();
  return title || "Training day";
}

function detectWeekday(value: string): Weekday | undefined {
  const text = normalize(value);
  for (const weekday of WEEKDAYS) {
    for (const rawToken of DAY_TOKENS[weekday]) {
      const token = normalize(rawToken);
      if (/^[a-z]+$/u.test(token)) {
        if (new RegExp(`(?:^|[^a-z])${token}(?:$|[^a-z])`, "iu").test(text)) return weekday;
      } else if (text.includes(token)) {
        return weekday;
      }
    }
  }
  return undefined;
}

function isRestLabel(value: string): boolean {
  return REST_PATTERN.test(normalize(value));
}

function isLikelyDayHeading(value: string): boolean {
  const text = normalize(value);
  return Boolean(detectWeekday(text) || isRestLabel(text) || DAY_TITLE_PATTERN.test(text) || /^day\s*\d+$/iu.test(text) || /^اليوم\s*\d+$/u.test(text));
}

function containsSetRepPattern(value: string): boolean {
  return /\d+\s*(?:x|×|\*)\s*\d+|\d+\s*(?:sets?|reps?|مجموعات?|عدات?|تكرارات?)/iu.test(value);
}

function isDayHeadingRow(value: string): boolean {
  return isLikelyDayHeading(value) && !containsSetRepPattern(value);
}

function isMatrixDayHeader(value: string): boolean {
  const text = normalize(value);
  if (detectWeekday(text) || isRestLabel(text)) return !containsSetRepPattern(text);
  return /^(?:push|pull|legs?|upper(?: body)?|lower(?: body)?|full body|chest|back|arms?|shoulders?|صدر|ظهر|رجل|ارجل|علوي|سفلي|كامل|ذراع|كتف)(?:\s*[a-z0-9]+)?$/iu.test(text);
}

function toPositiveInteger(value: string | number | undefined): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return Math.round(value);
  if (typeof value !== "string") return undefined;
  const match = value.match(/\d+/);
  if (!match) return undefined;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function parseRepRange(value: string): { min?: number; max?: number } {
  const range = value.match(/(\d+)\s*(?:-|–|—|to|الى|إلى)\s*(\d+)/iu);
  if (range) return { min: Number(range[1]), max: Number(range[2]) };
  const single = value.match(/\d+/u);
  if (single) {
    const reps = Number(single[0]);
    return { min: reps, max: reps };
  }
  return {};
}

function parseSetRepText(value: string): Pick<ParsedExerciseDraft, "sets" | "repsMin" | "repsMax"> {
  const text = normalize(value).replace(/،/g, ",");
  const multiplied = text.match(/(\d+)\s*(?:x|×|\*)\s*(\d+)(?:\s*(?:-|–|—|to|الى|إلى)\s*(\d+))?/iu);
  if (multiplied) {
    const sets = Number(multiplied[1]);
    const repsMin = Number(multiplied[2]);
    const repsMax = Number(multiplied[3] ?? multiplied[2]);
    return { sets, repsMin, repsMax };
  }

  const setsMatch = text.match(/(\d+)\s*(?:sets?|مجموعات?)/iu) ?? text.match(/(?:sets?|مجموعات?)\s*[:=-]?\s*(\d+)/iu);
  const repsRange = text.match(/(\d+)\s*(?:-|–|—|to|الى|إلى)\s*(\d+)\s*(?:reps?|عدات?|تكرارات?)?/iu);
  const repsSingle = text.match(/(\d+)\s*(?:reps?|عدات?|تكرارات?)/iu) ?? text.match(/(?:reps?|عدات?|تكرارات?)\s*[:=-]?\s*(\d+)/iu);
  const sets = setsMatch ? Number(setsMatch[1]) : undefined;
  if (repsRange) return { sets, repsMin: Number(repsRange[1]), repsMax: Number(repsRange[2]) };
  if (repsSingle) return { sets, repsMin: Number(repsSingle[1]), repsMax: Number(repsSingle[1]) };
  return { sets };
}

function stripSetRepText(value: string): string {
  return value
    .replace(/\b\d+\s*(?:x|×|\*)\s*\d+(?:\s*(?:-|–|—|to|الى|إلى)\s*\d+)?\b/giu, " ")
    .replace(/\b\d+\s*(?:sets?|reps?)\b/giu, " ")
    .replace(/\b(?:sets?|reps?)\s*[:=-]?\s*\d+\b/giu, " ")
    .replace(/\b\d+\s*(?:مجموعات?|عدات?|تكرارات?)\b/gu, " ")
    .replace(/[|;,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferWorkoutType(title: string): ImportedPlanDay["workoutType"] {
  const text = normalize(title);
  if (isRestLabel(text)) return "rest";
  if (/push|دفع|صدر.*تراي|chest.*tri/iu.test(text)) return "push";
  if (/pull|سحب|ظهر.*باي|back.*bi/iu.test(text)) return "pull";
  if (/legs?|lower|رجل|ارجل|سفلي/iu.test(text)) return "legs";
  return "custom";
}

function inferMuscle(name: string, dayTitle: string): { muscle: Muscle; confidence: number } {
  const direct = MUSCLE_PATTERNS.find(([, matcher]) => matcher.test(name));
  if (direct) return { muscle: direct[0], confidence: 0.96 };
  const type = inferWorkoutType(dayTitle);
  if (type === "push") return { muscle: "chest", confidence: 0.68 };
  if (type === "pull") return { muscle: "back", confidence: 0.68 };
  if (type === "legs") return { muscle: "quads", confidence: 0.68 };
  return { muscle: "core", confidence: 0.55 };
}

function parseMuscle(value: string): Muscle | undefined {
  const match = MUSCLE_PATTERNS.find(([, matcher]) => matcher.test(value));
  return match?.[0];
}

function dayVisuals(type: ImportedPlanDay["workoutType"], index: number): Pick<ImportedPlanDay, "iconKey" | "colorKey"> {
  if (type === "rest") return { iconKey: "moon", colorKey: "blue" };
  if (type === "push") return { iconKey: "dumbbell", colorKey: "indigo" };
  if (type === "pull") return { iconKey: "target", colorKey: "violet" };
  if (type === "legs") return { iconKey: "zap", colorKey: "emerald" };
  const colors: ImportedPlanDay["colorKey"][] = ["indigo", "violet", "emerald", "amber", "rose", "blue"];
  const icons: ImportedPlanDay["iconKey"][] = ["dumbbell", "target", "activity", "flame", "shield", "heart"];
  return { iconKey: icons[index % icons.length], colorKey: colors[index % colors.length] };
}

function headerMap(row: SpreadsheetCell[]): HeaderMap | null {
  const result: HeaderMap = {};
  row.forEach((cell, index) => {
    const text = normalize(cellText(cell));
    if (!text) return;
    for (const [key, matcher] of Object.entries(HEADER_MATCHERS) as Array<[keyof HeaderMap, RegExp]>) {
      if (matcher.test(text) && result[key] === undefined) result[key] = index;
    }
  });
  const score = Object.keys(result).length;
  return result.exercise !== undefined || score >= 2 ? result : null;
}

function rowValue(row: SpreadsheetCell[], index: number | undefined): string {
  return index === undefined ? "" : cellText(row[index]);
}

function exerciseFromMappedRow(row: SpreadsheetCell[], map: HeaderMap, dayTitle: string): ParsedExerciseDraft | null {
  const exerciseCell = rowValue(row, map.exercise);
  if (!exerciseCell || (isLikelyDayHeading(exerciseCell) && !DAY_TITLE_PATTERN.test(exerciseCell))) return null;
  const details = parseSetRepText([exerciseCell, rowValue(row, map.reps), rowValue(row, map.sets)].join(" "));
  const repsCell = parseRepRange(rowValue(row, map.reps));
  const sets = toPositiveInteger(rowValue(row, map.sets)) ?? details.sets;
  const repsMin = toPositiveInteger(rowValue(row, map.repsMin)) ?? repsCell.min ?? details.repsMin;
  const repsMax = toPositiveInteger(rowValue(row, map.repsMax)) ?? repsCell.max ?? details.repsMax ?? repsMin;
  const explicitMuscle = parseMuscle(rowValue(row, map.muscle));
  const inferred = inferMuscle(exerciseCell, dayTitle);
  return {
    name: stripSetRepText(exerciseCell) || exerciseCell,
    sets,
    repsMin,
    repsMax,
    notes: rowValue(row, map.notes),
    primaryMuscle: explicitMuscle ?? inferred.muscle,
    confidence: explicitMuscle ? 0.98 : inferred.confidence,
  };
}

function exerciseFromLooseRow(row: SpreadsheetCell[], dayTitle: string): ParsedExerciseDraft | null {
  const cells = row.map(cellText).filter(Boolean);
  if (cells.length === 0 || headerMap(row)) return null;
  const combined = cells.join(" | ");
  let nameCell = cells.find((cell) => /[A-Za-z\u0600-\u06FF]/u.test(cell) && !isLikelyDayHeading(cell));
  if (!nameCell && cells.length === 1 && /[A-Za-z\u0600-\u06FF]/u.test(cells[0])) nameCell = cells[0];
  if (!nameCell) return null;

  const name = stripSetRepText(nameCell);
  if (name.length < 2 || /^(?:sets?|reps?|notes?|مجموعات|عدات|ملاحظات)$/iu.test(name)) return null;

  const details = parseSetRepText(combined);
  const numericCells = cells.filter((cell) => /^\d+(?:\.\d+)?$/u.test(cell)).map(Number);
  const sets = details.sets ?? (numericCells.length >= 2 ? numericCells[0] : undefined);
  const repsMin = details.repsMin ?? (numericCells.length >= 2 ? numericCells[1] : undefined);
  const repsMax = details.repsMax ?? (numericCells.length >= 3 ? numericCells[2] : repsMin);
  const inferred = inferMuscle(name, dayTitle);
  return { name, sets, repsMin, repsMax, primaryMuscle: inferred.muscle, confidence: inferred.confidence };
}

function parseRowsIntoDrafts(sheet: SpreadsheetSheet): ParsedDayDraft[] {
  const rows = sheet.rows.filter((row) => row.some((cell) => cellText(cell)));
  if (rows.length === 0) return [];

  const matrixHeaderIndex = rows.findIndex((row) => {
    const labels = row.map(cellText).filter(Boolean);
    const explicitWeekdays = labels.filter((label) => detectWeekday(label)).length;
    const genericDayHeaders = labels.filter(isMatrixDayHeader).length;
    return explicitWeekdays >= 2 || genericDayHeaders >= 3;
  });
  if (matrixHeaderIndex >= 0) {
    const header = rows[matrixHeaderIndex];
    const drafts: ParsedDayDraft[] = [];
    header.forEach((cell, columnIndex) => {
      const label = cellText(cell);
      if (!isMatrixDayHeader(label)) return;
      const exercises: ParsedExerciseDraft[] = [];
      for (let rowIndex = matrixHeaderIndex + 1; rowIndex < rows.length; rowIndex += 1) {
        const value = cellText(rows[rowIndex][columnIndex]);
        if (!value) continue;
        const exercise = exerciseFromLooseRow([value], cleanTitle(label));
        if (exercise) exercises.push(exercise);
      }
      drafts.push({ sourceLabel: label, weekday: detectWeekday(label), title: cleanTitle(label), explicitRest: isRestLabel(label), exercises });
    });
    if (drafts.some((draft) => draft.exercises.length > 0)) return drafts;
  }

  const sheetDay = isLikelyDayHeading(sheet.name) ? {
    sourceLabel: sheet.name,
    weekday: detectWeekday(sheet.name),
    title: cleanTitle(sheet.name),
    explicitRest: isRestLabel(sheet.name),
    exercises: [] as ParsedExerciseDraft[],
  } : null;

  const drafts: ParsedDayDraft[] = [];
  let current: ParsedDayDraft | null = sheetDay;
  let map: HeaderMap | null = null;

  function ensureCurrent(label = sheet.name || "Imported workout") {
    if (!current) {
      current = { sourceLabel: label, weekday: detectWeekday(label), title: cleanTitle(label), explicitRest: isRestLabel(label), exercises: [] };
    }
    if (!drafts.includes(current)) drafts.push(current);
    return current;
  }

  if (sheetDay) drafts.push(sheetDay);

  for (const row of rows) {
    const cells = row.map(cellText);
    const nonEmpty = cells.filter(Boolean);
    if (nonEmpty.length === 0) continue;

    const possibleHeader = headerMap(row);
    if (possibleHeader) {
      map = possibleHeader;
      continue;
    }

    const dayCell = map?.day !== undefined ? rowValue(row, map.day) : nonEmpty[0];
    const detectedDay = detectWeekday(dayCell);
    const dayOnlyRow = nonEmpty.length === 1 && isDayHeadingRow(dayCell);
    const mappedDayWithExercise = Boolean(detectedDay && map?.exercise !== undefined && rowValue(row, map.exercise));

    if (dayOnlyRow || mappedDayWithExercise || (detectedDay && !current?.weekday)) {
      const existing = drafts.find((draft) => draft.weekday === detectedDay && detectedDay !== undefined);
      current = existing ?? { sourceLabel: dayCell, weekday: detectedDay, title: cleanTitle(dayCell), explicitRest: isRestLabel(dayCell), exercises: [] };
      if (!drafts.includes(current)) drafts.push(current);
      if (dayOnlyRow) continue;
    }

    const target = ensureCurrent(dayCell);
    if (target.explicitRest) continue;
    const exercise = map ? exerciseFromMappedRow(row, map, target.title) : exerciseFromLooseRow(row, target.title);
    if (exercise) target.exercises.push(exercise);
  }

  return drafts;
}

function preferredDays(count: number): Weekday[] {
  if (count <= 1) return ["saturday"];
  if (count === 2) return ["saturday", "tuesday"];
  if (count === 3) return ["saturday", "monday", "wednesday"];
  if (count === 4) return ["saturday", "sunday", "tuesday", "thursday"];
  if (count === 5) return ["saturday", "sunday", "monday", "wednesday", "thursday"];
  if (count === 6) return ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday"];
  return [...WEEKDAYS];
}

function assignWeekdays(drafts: ParsedDayDraft[]): ParsedDayDraft[] {
  const used = new Set(drafts.flatMap((draft) => draft.weekday ? [draft.weekday] : []));
  const unnamed = drafts.filter((draft) => !draft.weekday && !draft.explicitRest);
  const preferred = preferredDays(drafts.filter((draft) => !draft.explicitRest).length);
  for (const draft of unnamed) {
    draft.weekday = preferred.find((weekday) => !used.has(weekday)) ?? WEEKDAYS.find((weekday) => !used.has(weekday));
    if (draft.weekday) used.add(draft.weekday);
  }
  return drafts;
}

function finalizeExercise(draft: ParsedExerciseDraft, dayTitle: string, warnings: string[]): ImportedPlanExercise {
  const inferred = inferMuscle(draft.name, dayTitle);
  const sets = draft.sets && draft.sets > 0 ? Math.min(20, Math.round(draft.sets)) : 2;
  const repsMin = draft.repsMin && draft.repsMin > 0 ? Math.min(100, Math.round(draft.repsMin)) : 8;
  const repsMaxRaw = draft.repsMax && draft.repsMax > 0 ? Math.min(100, Math.round(draft.repsMax)) : (draft.repsMin ? repsMin : 12);
  const repsMax = Math.max(repsMin, repsMaxRaw);
  if (!draft.sets || !draft.repsMin) warnings.push(`${draft.name}: sets or reps were missing, so 2 sets of 8–12 were added for review.`);
  if ((draft.confidence ?? inferred.confidence) < 0.75) warnings.push(`${draft.name}: check the exercise name or target muscle.`);
  return {
    name: draft.name.slice(0, 100),
    primaryMuscle: draft.primaryMuscle ?? inferred.muscle,
    sets,
    repsMin,
    repsMax,
    notes: (draft.notes ?? "").slice(0, 160),
    confidence: Math.max(0, Math.min(1, draft.confidence ?? inferred.confidence)),
  };
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function ensureNoThreeConsecutiveRest(days: ImportedPlanDay[], warnings: string[]) {
  for (let pass = 0; pass < 3; pass += 1) {
    const tripleIndex = days.findIndex((day, index) => day.workoutType === "rest" && days[(index + 1) % 7].workoutType === "rest" && days[(index + 2) % 7].workoutType === "rest");
    if (tripleIndex < 0) return;
    const flexIndex = (tripleIndex + 1) % 7;
    days[flexIndex] = {
      ...days[flexIndex],
      workoutType: "custom",
      title: "Flexible training",
      focus: "Choose a session",
      iconKey: "activity",
      colorKey: "indigo",
      notes: "Added to avoid more than two consecutive recovery days. Edit or move this day during review.",
      exercises: [],
    };
    warnings.push(`${capitalize(days[flexIndex].weekday)} was added as a flexible training day because Gym Crew allows at most two consecutive recovery days.`);
  }
}

function toPlan(draftsInput: ParsedDayDraft[], sourceTitle: string): ImportedPlan {
  const warnings: string[] = [];
  const drafts = assignWeekdays(draftsInput.filter((draft) => draft.explicitRest || draft.exercises.length > 0));
  const byWeekday = new Map<Weekday, ParsedDayDraft>();

  for (const draft of drafts) {
    if (!draft.weekday) continue;
    const existing = byWeekday.get(draft.weekday);
    if (existing) {
      existing.exercises.push(...draft.exercises);
      if (existing.title === "Training day" && draft.title !== "Training day") existing.title = draft.title;
    } else {
      byWeekday.set(draft.weekday, { ...draft, exercises: [...draft.exercises] });
    }
  }

  const days: ImportedPlanDay[] = WEEKDAYS.map((weekday, index) => {
    const draft = byWeekday.get(weekday);
    if (!draft) {
      return { weekday, workoutType: "rest", title: "Recovery", focus: "Recovery", iconKey: "moon", colorKey: "blue", notes: "", exercises: [] };
    }
    const title = draft.explicitRest ? "Recovery" : (draft.title || "Training day").slice(0, 40);
    const workoutType = draft.explicitRest ? "rest" : inferWorkoutType(title);
    const visuals = dayVisuals(workoutType, index);
    const exercises = workoutType === "rest" ? [] : draft.exercises.map((exercise) => finalizeExercise(exercise, title, warnings));
    return {
      weekday,
      workoutType,
      title,
      focus: workoutType === "rest" ? "Recovery" : title.slice(0, 32),
      ...visuals,
      notes: (draft.notes ?? "").slice(0, 240),
      exercises,
    };
  });

  ensureNoThreeConsecutiveRest(days, warnings);
  return {
    title: (sourceTitle.replace(/\.[^.]+$/u, "").trim() || "Imported training plan").slice(0, 80),
    days,
    warnings: [...new Set(warnings)].slice(0, 12),
  };
}

export function parseSpreadsheetPlan(sheets: SpreadsheetSheet[], sourceTitle = "Imported spreadsheet"): ImportedPlan | null {
  const drafts = sheets.flatMap(parseRowsIntoDrafts);
  const exerciseCount = drafts.reduce((sum, draft) => sum + draft.exercises.length, 0);
  if (exerciseCount === 0 && !drafts.some((draft) => draft.explicitRest)) return null;
  return toPlan(drafts, sourceTitle);
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

export function parseTextPlan(text: string, sourceTitle = "Imported plan", csv = false): ImportedPlan | null {
  const cleaned = text.replace(/\r\n/g, "\n").trim();
  if (cleaned.length < 4) return null;
  const rows = csv
    ? parseCsvRows(cleaned)
    : cleaned.split("\n").map((line) => line.split(/\t|\s{2,}|\s*\|\s*/u).map((cell) => cell.trim()));
  return parseSpreadsheetPlan([{ name: sourceTitle, rows }], sourceTitle);
}
