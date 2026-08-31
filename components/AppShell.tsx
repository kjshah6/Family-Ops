"use client";

import { useSchool } from "./SchoolProvider";

// Owns the themed page background, which has to live in a client component so it
// can read the active school's theme.
export default function AppShell({ children }: { children: React.ReactNode }) {
  const { theme } = useSchool();
  return <div style={{ background: theme.ivory, minHeight: "100vh", color: theme.ink }}>{children}</div>;
}
