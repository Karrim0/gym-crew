"use client";

import { useState } from "react";
import { ChevronRight, FileUp, LayoutTemplate, Loader2, PencilRuler, Sparkles, X } from "lucide-react";
import type { StarterPlanKey } from "../types";
import { applySplitTemplate } from "../services/split.service";
import { SplitImportWizard } from "./SplitImportWizard";

interface SplitSetupChooserProps {
  onChanged: () => Promise<void>;
}

const STARTERS: Array<{ key: Exclude<StarterPlanKey, "manual">; title: string; detail: string }> = [
  { key: "full_body_3", title: "Full body · 3 days", detail: "Simple, balanced and easy to recover from" },
  { key: "upper_lower_4", title: "Upper / Lower · 4 days", detail: "Two upper and two lower sessions" },
  { key: "ppl_ul_5", title: "PPL + Upper / Lower · 5 days", detail: "More frequency with two recovery days" },
  { key: "ppl_6", title: "Push / Pull / Legs · 6 days", detail: "A full six-day rotation" },
];

export function SplitSetupChooser({ onChanged }: SplitSetupChooserProps) {
  const [starterOpen, setStarterOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [busyKey, setBusyKey] = useState<StarterPlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function apply(key: StarterPlanKey) {
    const warning = key === "manual"
      ? "Start with a blank seven-day plan? Your current exercises will be removed."
      : "Replace your current split with this starter plan?";
    if (!window.confirm(warning)) return;
    setBusyKey(key);
    setError(null);
    try {
      await applySplitTemplate(key);
      await onChanged();
      setStarterOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to build the split.");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <>
      <section className="relative overflow-hidden rounded-[28px] border border-indigo-300/15 bg-[linear-gradient(135deg,rgba(139,158,255,.14),rgba(17,20,29,.98)_55%)] p-4 sm:p-5">
        <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-indigo-300/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-indigo-200" /><p className="gc-eyebrow">Build or replace your plan</p></div>
          <h2 className="mt-2 text-xl font-bold">How do you want to create your split?</h2>
          <p className="mt-1 text-sm leading-6 text-neutral-500">Start from zero, choose a proven structure, or let Gym Crew read the plan you already use.</p>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <button type="button" disabled={Boolean(busyKey)} onClick={() => void apply("manual")} className="group rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 text-left transition hover:border-indigo-300/30 hover:bg-indigo-300/[0.07]">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.06] text-indigo-200"><PencilRuler className="h-5 w-5" /></span>
              <strong className="mt-3 flex items-center justify-between">Create manually {busyKey === "manual" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4 text-neutral-600 group-hover:text-indigo-200" />}</strong>
              <span className="mt-1 block text-xs leading-5 text-neutral-500">A blank week you can shape completely.</span>
            </button>
            <button type="button" disabled={Boolean(busyKey)} onClick={() => setStarterOpen(true)} className="group rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 text-left transition hover:border-indigo-300/30 hover:bg-indigo-300/[0.07]">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.06] text-indigo-200"><LayoutTemplate className="h-5 w-5" /></span>
              <strong className="mt-3 flex items-center justify-between">Use a starter plan <ChevronRight className="h-4 w-4 text-neutral-600 group-hover:text-indigo-200" /></strong>
              <span className="mt-1 block text-xs leading-5 text-neutral-500">Pick 3, 4, 5 or 6 training days.</span>
            </button>
            <button type="button" disabled={Boolean(busyKey)} onClick={() => setImportOpen(true)} className="group rounded-2xl border border-indigo-300/20 bg-indigo-300/[0.07] p-4 text-left transition hover:border-indigo-300/40 hover:bg-indigo-300/[0.11]">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-300/12 text-indigo-200"><FileUp className="h-5 w-5" /></span>
              <strong className="mt-3 flex items-center justify-between">Import your plan <ChevronRight className="h-4 w-4 text-indigo-200" /></strong>
              <span className="mt-1 block text-xs leading-5 text-neutral-400">Photo, PDF, Excel, CSV or pasted text.</span>
            </button>
          </div>
          {error ? <p className="mt-3 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm font-semibold text-red-300">{error}</p> : null}
        </div>
      </section>

      {starterOpen ? (
        <div className="fixed inset-0 z-[85] flex items-end bg-black/65 p-3 backdrop-blur-sm sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-label="Choose a starter plan">
          <section className="w-full max-w-lg rounded-[26px] border border-white/10 bg-[#12151e] p-4 shadow-2xl sm:p-5">
            <div className="flex items-start justify-between gap-3"><div><p className="gc-eyebrow">Starter plans</p><h3 className="mt-1 text-xl font-bold">Choose your training frequency</h3><p className="mt-1 text-sm text-neutral-500">Every name, day, exercise and target stays editable.</p></div><button type="button" onClick={() => setStarterOpen(false)} className="grid h-10 w-10 place-items-center rounded-full border border-white/10"><X className="h-5 w-5" /></button></div>
            <div className="mt-4 space-y-2">
              {STARTERS.map((starter) => (
                <button key={starter.key} type="button" disabled={Boolean(busyKey)} onClick={() => void apply(starter.key)} className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-left transition hover:border-indigo-300/30">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-300/10 text-indigo-200"><LayoutTemplate className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1"><strong className="block">{starter.title}</strong><span className="mt-0.5 block text-xs text-neutral-500">{starter.detail}</span></span>
                  {busyKey === starter.key ? <Loader2 className="h-5 w-5 animate-spin text-indigo-200" /> : <ChevronRight className="h-5 w-5 text-neutral-600" />}
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {importOpen ? <SplitImportWizard onClose={() => setImportOpen(false)} onImported={onChanged} /> : null}
    </>
  );
}
