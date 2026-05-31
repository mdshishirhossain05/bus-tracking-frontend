/**
 * Canonical academic options used by passenger registration and the
 * profile screen. Department is free-text on the backend (no enum),
 * so this list is purely a frontend convenience — edit it here to add
 * or remove options without touching any other file.
 */
export const ACADEMIC_DEPARTMENTS = [
  "Computer Science and Engineering (CSE)",
  "Electrical and Electronics Engineering (EEE)",
  "Food Engineering",
  "Bachelor of Business Administration (BBA)",
  "Master of Business Administration (MBA)",
  "B.A in English",
] as const;

/** Placeholder shown in the batch field — ordinal format, e.g. 12th. */
export const ACADEMIC_BATCH_PLACEHOLDER = "e.g. 12th";
