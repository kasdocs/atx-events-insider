// lib/supabase-auth-errors.ts
export function isAuthSessionMissingError(err: unknown) {
  const anyErr = err as any;
  return (
    !!anyErr &&
    (anyErr.name === 'AuthSessionMissingError' ||
      anyErr.__isAuthError === true && anyErr.status === 400) // fallback
  );
}
