"use client";

import { Languages } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface LanguageSwitcherProps {
  variant?: "compact" | "panel";
  className?: string;
}

export function LanguageSwitcher({ variant = "compact", className = "" }: LanguageSwitcherProps) {
  const { language, setLanguage, toggleLanguage } = useLanguage();

  if (variant === "panel") {
    return (
      <section data-no-localize className={`rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-300/10 text-indigo-200">
            <Languages className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-bold">{language === "ar" ? "لغة التطبيق" : "App language"}</h2>
            <p className="text-xs text-neutral-500">
              {language === "ar" ? "غيّر اللغة من غير ما بيانات تمرينك تتأثر." : "Switch language without changing your workout data."}
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2" role="group" aria-label={language === "ar" ? "اختار لغة التطبيق" : "Choose app language"}>
          <button
            type="button"
            onClick={() => setLanguage("ar")}
            aria-pressed={language === "ar"}
            className={`min-h-11 rounded-xl border px-3 text-sm font-bold transition ${language === "ar" ? "border-indigo-300/45 bg-indigo-300 text-[#11131a]" : "border-white/[0.08] bg-white/[0.025] text-neutral-300"}`}
          >
            العربية
          </button>
          <button
            type="button"
            onClick={() => setLanguage("en")}
            aria-pressed={language === "en"}
            className={`min-h-11 rounded-xl border px-3 text-sm font-bold transition ${language === "en" ? "border-indigo-300/45 bg-indigo-300 text-[#11131a]" : "border-white/[0.08] bg-white/[0.025] text-neutral-300"}`}
          >
            English
          </button>
        </div>
      </section>
    );
  }

  const label = language === "ar" ? "Switch to English" : "حوّل للعربي";
  return (
    <button
      data-no-localize
      type="button"
      onClick={toggleLanguage}
      title={label}
      aria-label={label}
      className={`inline-flex h-10 min-w-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.035] px-2.5 text-xs font-black text-neutral-300 transition hover:border-indigo-300/30 hover:text-white ${className}`}
    >
      <Languages className="h-4 w-4 text-indigo-200" aria-hidden />
      <span dir="ltr">{language === "ar" ? "EN" : "ع"}</span>
    </button>
  );
}
