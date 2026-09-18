export function errorMessage(value: unknown, fallback = "Something went wrong. Try again."): string {
  if (typeof value === "string" && value.trim()) return value;
  if (value instanceof Error && value.message.trim()) return value.message;
  if (value && typeof value === "object") {
    const record = value as { message?: unknown; error?: unknown };
    if (typeof record.message === "string" && record.message.trim()) return record.message;
    if (typeof record.error === "string" && record.error.trim()) return record.error;
    if (record.error && typeof record.error === "object") {
      const nested = record.error as { message?: unknown };
      if (typeof nested.message === "string" && nested.message.trim()) return nested.message;
    }
  }
  return fallback;
}
