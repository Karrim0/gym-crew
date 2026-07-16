import type { MuscleGroup, Weekday, WorkoutType } from "@/types";

export const WEEKDAY_LABELS_AR: Record<Weekday, string> = {
  saturday: "السبت",
  sunday: "الأحد",
  monday: "الاثنين",
  tuesday: "الثلاثاء",
  wednesday: "الأربعاء",
  thursday: "الخميس",
  friday: "الجمعة",
};

export const WEEKDAY_SHORT_LABELS_AR: Record<Weekday, string> = {
  saturday: "سبت",
  sunday: "أحد",
  monday: "اتنين",
  tuesday: "تلات",
  wednesday: "أربع",
  thursday: "خميس",
  friday: "جمعة",
};

export const WORKOUT_TYPE_LABELS_AR: Record<WorkoutType, string> = {
  push: "بوش",
  pull: "بول",
  legs: "رجل",
  rest: "راحة",
  custom: "مخصص",
};

export function formatDateArEg(value: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const date = typeof value === "string" ? new Date(`${value}T12:00:00`) : value;
  return new Intl.DateTimeFormat("ar-EG", options ?? {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatRelativeTimeArEg(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSeconds);
  const formatter = new Intl.RelativeTimeFormat("ar-EG", { numeric: "auto" });

  if (abs < 60) return formatter.format(diffSeconds, "second");
  if (abs < 3600) return formatter.format(Math.round(diffSeconds / 60), "minute");
  if (abs < 86400) return formatter.format(Math.round(diffSeconds / 3600), "hour");
  if (abs < 604800) return formatter.format(Math.round(diffSeconds / 86400), "day");
  return formatter.format(Math.round(diffSeconds / 604800), "week");
}

export function setsLabel(count: number): string {
  if (count === 1) return "سِت واحدة";
  if (count === 2) return "سِتين";
  return `${count} سِتات`;
}

export function repsLabel(count: number): string {
  if (count === 1) return "عدة واحدة";
  if (count === 2) return "عدتين";
  return `${count} عدات`;
}

export function exercisesLabel(count: number): string {
  if (count === 1) return "تمرين واحد";
  if (count === 2) return "تمرينين";
  return `${count} تمارين`;
}


export const MUSCLE_LABELS_AR: Record<MuscleGroup, string> = {
  chest: "الصدر",
  back: "الضهر",
  shoulders: "الكتف",
  biceps: "الباي",
  triceps: "التراي",
  quads: "عضلات الفخذ الأمامية",
  hamstrings: "عضلات الفخذ الخلفية",
  glutes: "المؤخرة",
  calves: "السمانة",
  core: "البطن والكور",
};

const EXERCISE_NAMES_AR: Record<string, string> = {
  "bench press": "بنش بريس",
  "incline dumbbell press": "بنش عالي دمبل",
  "chest fly": "تفتيح صدر",
  "overhead press": "ضغط كتف فوق الرأس",
  "lateral raise": "رفرفة جانبي",
  "triceps pushdown": "تراي بالكابل لتحت",
  dips: "متوازي",
  "lat pulldown": "سحب عالي",
  "pull-up": "عقلة",
  "pull up": "عقلة",
  "barbell row": "تجديف بار",
  "seated cable row": "تجديف كابل قاعد",
  "face pull": "فيس بول",
  "barbell curl": "باي بار",
  "hammer curl": "هامر كيرل",
  "rear delt fly": "تفتيح كتف خلفي",
  "back squat": "سكوات بار خلفي",
  "leg press": "ليج بريس",
  "romanian deadlift": "ديدليفت روماني",
  "leg extension": "فرد رجل",
  "leg curl": "خلفيات رجل",
  "hip thrust": "هيب ثرست",
  "standing calf raise": "سمانة واقف",
  "walking lunge": "لانجز مشي",
  "cable crunch": "بطن كابل",
};

export function translateExerciseName(name: string): string {
  return EXERCISE_NAMES_AR[name.trim().toLowerCase()] ?? name;
}

export function muscleLabelAr(muscle: MuscleGroup | string): string {
  return MUSCLE_LABELS_AR[muscle as MuscleGroup] ?? muscle;
}

export const GROUP_ROLE_LABELS_AR: Record<string, string> = {
  owner: "صاحب الجروب",
  admin: "أدمن",
  member: "عضو",
};

export function groupRoleLabelAr(role: string): string {
  return GROUP_ROLE_LABELS_AR[role] ?? role;
}

export const WORKOUT_STATUS_LABELS_AR: Record<string, string> = {
  planned: "متخطط لها",
  in_progress: "شغالة دلوقتي",
  completed: "خلصت",
  cancelled: "اتلغت",
};

export const PERSONAL_RECORD_TYPE_LABELS_AR: Record<string, string> = {
  max_weight: "أعلى وزن",
  max_reps: "أعلى عدات",
  max_volume: "أعلى حجم تمرين",
};

const WORKOUT_LABELS_AR: Record<string, string> = {
  "push day": "بوش",
  push: "بوش",
  "pull day": "بول",
  pull: "بول",
  "legs day": "رجل",
  legs: "رجل",
  "leg day": "رجل",
  "upper body": "أبر",
  upper: "أبر",
  "lower body": "لوور",
  lower: "لوور",
  "full body": "فل بادي",
  "rest day": "راحة",
  recovery: "راحة",
  rest: "راحة",
  custom: "مخصص",
};

export function translateWorkoutLabel(label: string | null | undefined): string {
  if (!label) return "";
  return WORKOUT_LABELS_AR[label.trim().toLowerCase()] ?? label;
}

export function workoutStatusLabelAr(status: string): string {
  return WORKOUT_STATUS_LABELS_AR[status] ?? status;
}

export function personalRecordTypeLabelAr(type: string): string {
  return PERSONAL_RECORD_TYPE_LABELS_AR[type] ?? type;
}
