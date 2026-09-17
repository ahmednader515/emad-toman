export const GRADE_OPTIONS = [
  { value: "GRADE_1", label: "الصف الأول الثانوي" },
  { value: "GRADE_2", label: "الصف الثاني الثانوي" },
  { value: "GRADE_3", label: "الصف الثالث الثانوي" },
] as const;

export type GradeValue = (typeof GRADE_OPTIONS)[number]["value"];

export const GRADE_VALUES = GRADE_OPTIONS.map((option) => option.value) as GradeValue[];

export const isValidGrade = (value: unknown): value is GradeValue => {
  return typeof value === "string" && GRADE_VALUES.includes(value as GradeValue);
};

export const getGradeLabel = (value: string | null | undefined): string => {
  if (!value) return "غير محدد";
  return GRADE_OPTIONS.find((option) => option.value === value)?.label || value;
};
