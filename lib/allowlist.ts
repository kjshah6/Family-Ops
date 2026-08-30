// Only these email addresses may create an account and sign in.
// Set as a comma-separated env var so you don't have to redeploy to update it.
// Example: ALLOWED_PARENT_EMAILS="parent1@example.com,parent2@example.com"
export function isAllowedParent(email: string | undefined | null): boolean {
  if (!email) return false;
  const list = (process.env.ALLOWED_PARENT_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}
