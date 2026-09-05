"use client";
import { useId, type ReactElement, cloneElement } from "react";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "@/lib/api";
export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactElement;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {cloneElement(children, {
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": error ? `${id}-error` : undefined,
      })}
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
export function applyErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
) {
  if (error instanceof ApiError)
    Object.entries(error.fieldErrors).forEach(([key, value]) =>
      setError(key as Path<T>, { message: value }),
    );
}
export function MutationError({ error }: { error: Error | null }) {
  return error ? (
    <p className="alert" role="alert">
      {error.message}
    </p>
  ) : null;
}
