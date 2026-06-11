export const DOC_STAGES = ["research", "shoot", "edit", "published"] as const;
export type DocStage = (typeof DOC_STAGES)[number];

/** Strictly-next transition only: no skipping a stage, no regressing. */
export function canAdvance(from: DocStage, to: DocStage): boolean {
  const i = DOC_STAGES.indexOf(from);
  const j = DOC_STAGES.indexOf(to);
  return i >= 0 && j === i + 1;
}

export function nextStage(from: DocStage): DocStage | null {
  const i = DOC_STAGES.indexOf(from);
  return i >= 0 && i < DOC_STAGES.length - 1 ? DOC_STAGES[i + 1]! : null;
}
