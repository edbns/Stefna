// Prompt enhancement utilities for razor-sharp results with subject locking

export const CLARITY_BOOST_SOFT   = "increase micro-contrast and edge fidelity; subtle sharpening; preserve natural skin texture; no halos";
export const CLARITY_BOOST_MEDIUM = "strong micro-contrast; crisp edges; enhance fine textures (hair, neoprene seams); avoid halos or crunchy artifacts";
export const CLARITY_BOOST_HARD   = "maximize micro-contrast and fine detail; razor-sharp edges; crisp textures; retain natural grain; strictly no halos, no plastic skin";

export type DetailLevel = "soft" | "medium" | "hard";

// Subject-specific locks to prevent drift
export const POS_SURFER_LOCK =
  "same person, adult male surfer, holding a surfboard, same pose and angle, same composition, beach and ocean waves";

export const NEG_SURFER_DRIFT =
  "female, woman, girl, bikini, long hair blowing, dress, banana, banana boat, inflatable, kayak, canoe, paddle, raft, extra people, different subject, face swap, toy boat";

export const SUBJECT_LOCK_NEG =
  "deformed subject, new faces, age change, child, baby, extra people, different subject, face swap, plastic skin, waxy skin, heavy smoothing";

export interface PromptOptions {
  mode?: "story" | "time_machine" | "restore";
  prompt?: string;
  negative_prompt?: string;
  strength?: number;
  guidance_scale?: number;
  num_inference_steps?: number;
  detail?: DetailLevel;
  base?: string;
  user?: string;
  lockSurfer?: boolean;
  extraNeg?: string;
}

export function buildPrompt(opts: PromptOptions): string {
  const basePrompt = opts.prompt || '';
  const subjectLock = opts.mode === "story" ? SUBJECT_LOCK_NEG : "";
  
  const clarity =
    opts.detail === "hard" ? CLARITY_BOOST_HARD :
    opts.detail === "medium" ? CLARITY_BOOST_MEDIUM :
    CLARITY_BOOST_SOFT;

  const positives = [
    opts.base,
    opts.user,
    clarity,
    opts.lockSurfer ? POS_SURFER_LOCK : ""
  ].filter(Boolean).join(". ").replace(/\s+/g, " ").trim();

  const negatives = [
    opts.extraNeg,
    opts.lockSurfer ? NEG_SURFER_DRIFT : "",
    (opts.mode === "time_machine" || opts.mode === "restore") ? SUBJECT_LOCK_NEG : ""
  ].filter(Boolean).join(", ");

  return { positives, negatives };
}
