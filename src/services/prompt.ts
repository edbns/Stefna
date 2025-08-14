// Prompt enhancement utilities for better mode results

export const CLARITY_BOOST_SOFT =
  "increase micro-contrast and edge fidelity; subtle sharpening; preserve natural skin texture; no halos; no oversharpening";

export const SUBJECT_LOCK_NEG =
  "deformed subject, new faces, age change, child, baby, extra people, different subject, face swap, plastic skin, waxy skin, heavy smoothing";

export interface PromptBuildOptions {
  base?: string;            // presetDef?.prompt
  user?: string;            // user custom prompt (optional)
  mode?: "story" | "time_machine" | "restore";
  wantDetailBoost?: boolean;
  extraNeg?: string;        // presetDef?.negative_prompt
}

export function buildEffectivePrompt(opts: PromptBuildOptions) {
  const parts = [
    opts.base?.trim(),
    opts.user?.trim(),
    opts.wantDetailBoost ? CLARITY_BOOST_SOFT : "",
  ].filter(Boolean);

  const positive = parts.join(". ").replace(/\s+/g, " ").trim();

  const negatives = [
    opts.extraNeg,
    (opts.mode === "time_machine" || opts.mode === "restore") ? SUBJECT_LOCK_NEG : ""
  ].filter(Boolean).join(", ");

  return { positive, negatives };
}
