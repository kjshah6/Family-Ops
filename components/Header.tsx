"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fingerprint, LogOut, ChevronDown, Check, GraduationCap, ExternalLink } from "lucide-react";
import { useSession, signOut, authClient } from "@/lib/auth-client";
import { useSchool } from "./SchoolProvider";
import { useDismissOnOutside } from "./useDismissOnOutside";

const NAV = [
  { href: "/app", label: "Roster" },
  { href: "/app/pickup", label: "Pickup" },
  { href: "/app/calendar", label: "School calendar" },
];

export default function Header() {
  const { data: session } = useSession();
  const { school, theme, schools, setSchool } = useSchool();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useDismissOnOutside(
    menuRef,
    menuOpen,
    useCallback(() => setMenuOpen(false), []),
  );

  async function registerPasskey() {
    await authClient.passkey.addPasskey();
  }

  return (
    <div
      style={{ background: theme.navy, borderBottom: `3px solid ${theme.gold}` }}
      className="pt-6 sm:pt-8"
    >
      <div className="shell flex items-center gap-4">
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: `2px solid ${theme.gold}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ fontFamily: "var(--font-display)", color: theme.gold, fontWeight: 700, fontSize: 19 }}>
            C
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h1 style={{ fontFamily: "var(--font-display)", color: theme.ivory, fontSize: 24, fontWeight: 700 }}>
            Cubby
          </h1>
          <p style={{ color: theme.parchment, fontSize: 13, marginTop: 2 }} className="truncate">
            Signed in as {session?.user?.email ?? "..."}
          </p>
        </div>

        <div ref={menuRef} style={{ position: "relative" }}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-1.5"
            style={{
              background: "transparent",
              border: `1px solid ${theme.gold}`,
              borderRadius: 6,
              color: theme.parchment,
              cursor: "pointer",
              padding: "6px 10px",
              fontSize: 12.5,
            }}
          >
            <GraduationCap size={15} color={theme.gold} />
            <span className="hidden sm:inline">{school.name}</span>
            <ChevronDown size={13} />
          </button>

          {menuOpen && (
            <div
              role="menu"
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 6px)",
                background: theme.ivory,
                border: `1px solid ${theme.line}`,
                borderRadius: 6,
                minWidth: 210,
                zIndex: 20,
                boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
                overflow: "hidden",
              }}
            >
              {schools.map((s) => (
                <button
                  key={s.id}
                  role="menuitem"
                  onClick={() => {
                    setSchool(s.id);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between gap-3 text-left"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "9px 12px",
                    fontSize: 13,
                    color: theme.ink,
                    fontWeight: s.id === school.id ? 600 : 400,
                  }}
                >
                  {s.name}
                  {s.id === school.id && <Check size={14} color={theme.maroon} />}
                </button>
              ))}
              <div
                style={{
                  borderTop: `1px solid ${theme.line}`,
                  padding: "8px 12px",
                  fontSize: 11.5,
                  color: theme.slate,
                }}
              >
                More schools coming soon
              </div>
            </div>
          )}
        </div>

        <button
          onClick={registerPasskey}
          title="Add a passkey for faster sign-in"
          style={{ color: theme.gold, background: "none", border: "none", cursor: "pointer" }}
        >
          <Fingerprint size={20} />
        </button>
        <button
          onClick={() => signOut()}
          title="Sign out"
          style={{ color: theme.parchment, background: "none", border: "none", cursor: "pointer" }}
        >
          <LogOut size={18} />
        </button>
      </div>

      <nav className="shell flex items-center flex-wrap gap-5 mt-5">
        {NAV.map((item) => {
          const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                color: active ? theme.ivory : theme.parchment,
                fontSize: 13.5,
                fontWeight: active ? 600 : 500,
                textDecoration: "none",
                paddingBottom: 8,
                borderBottom: `2px solid ${active ? theme.gold : "transparent"}`,
              }}
            >
              {item.label}
            </Link>
          );
        })}

        {/* Leaves the app for the school's own site, so it reads as a link out
            rather than another tab and never takes the active underline. */}
        {school.links.resourceGuide && (
          <a
            href={school.links.resourceGuide}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1"
            style={{
              color: theme.parchment,
              fontSize: 13.5,
              fontWeight: 500,
              textDecoration: "none",
              paddingBottom: 8,
              borderBottom: "2px solid transparent",
            }}
          >
            Resource guide
            <ExternalLink size={12} />
          </a>
        )}
      </nav>
    </div>
  );
}
