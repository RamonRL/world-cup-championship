/**
 * Email allowlist resolver. The variable `ADMIN_EMAILS` is a comma-separated
 * list. Whitespace and case are normalized so "Foo@Bar.com, baz@qux.io" works.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const raw = process.env.ADMIN_EMAILS ?? "";
  const list = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}
