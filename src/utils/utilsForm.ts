export function areAllRowsFilled<T extends Record<string, any>>(
  values: T[] | undefined,
  requiredFields: (keyof T)[]
): boolean {
  if (!values || values.length === 0) return true;

  return values.every((row) =>
    requiredFields.every((field) => !!row[field]?.toString().trim())
  );
}
