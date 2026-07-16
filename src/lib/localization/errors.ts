const ARABIC_TEXT = /[\u0600-\u06ff]/u;

const ERROR_TRANSLATIONS: Array<[RegExp, string]> = [
  [/invalid login credentials/iu, "الإيميل أو الباسورد مش صح."],
  [/email not confirmed/iu, "أكد إيميلك الأول وبعدها سجّل دخول."],
  [/user already registered|already been registered|already exists/iu, "الإيميل ده معمول بيه حساب قبل كده."],
  [/password should be at least/iu, "الباسورد قصير. خليه 8 حروف على الأقل."],
  [/email rate limit|rate limit|too many requests/iu, "جربت مرات كتير بسرعة. استنى شوية وجرّب تاني."],
  [/failed to fetch|network request failed|networkerror|fetch failed/iu, "النت فصل أو السيرفر مش بيرد. اتأكد من الاتصال وجرّب تاني."],
  [/jwt expired|session.*expired|refresh token.*not found|invalid refresh token/iu, "جلسة الدخول انتهت. سجّل دخول من جديد."],
  [/foreign key constraint|violates foreign key/iu, "فيه بيانات مرتبطة بالحساب محتاجة تتظبط الأول."],
  [/duplicate key|unique constraint/iu, "البيانات دي موجودة قبل كده."],
  [/row-level security|permission denied|not authorized|unauthorized/iu, "مش مسموح تعمل الخطوة دي بالحساب الحالي."],
  [/storage.*object|bucket/iu, "معرفناش نتعامل مع الملف المرفوع. جرّب ملف تاني."],
  [/quota|insufficient_quota|billing/iu, "الخدمة الذكية مش متاحة دلوقتي. استخدم الاستيراد المجاني بملف Excel أو CSV أو نص."],
];

export function getArabicErrorMessage(error: unknown, fallback: string): string {
  const message = error instanceof Error
    ? error.message.trim()
    : typeof error === "string"
      ? error.trim()
      : "";

  if (!message) return fallback;
  if (ARABIC_TEXT.test(message)) return message;

  for (const [pattern, translated] of ERROR_TRANSLATIONS) {
    if (pattern.test(message)) return translated;
  }

  return fallback;
}
