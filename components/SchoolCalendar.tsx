"use client";

import { useEffect, useState } from "react";
import { CalendarDays, CalendarOff, ExternalLink, Loader2, LogIn, Plus, Trash2 } from "lucide-react";
import { useSchool } from "./SchoolProvider";
import { formatMonthDay, formatWeekdayLong, fromISODate, isValidISODate, toISODate } from "@/lib/dates";
import type { Holiday } from "./pickup/types";

export default function SchoolCalendar() {
  const { school, theme } = useSchool();

  const [holidays, setHolidays] = useState<Holiday[] | null>(null);
  const [date, setDate] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/holidays")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setHolidays(d.holidays))
      .catch(() => setError("Couldn't load the calendar."));
  }, []);

  async function add() {
    if (!isValidISODate(date)) {
      setError("Pick a date first.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, label }),
      });
      if (!res.ok) throw new Error();
      const created: Holiday = await res.json();
      setHolidays((prev) =>
        [...(prev ?? []).filter((h) => h.date !== created.date), created].sort((a, b) =>
          a.date.localeCompare(b.date),
        ),
      );
      setDate("");
      setLabel("");
    } catch {
      setError("Couldn't add that day. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(h: Holiday) {
    setError(null);
    try {
      const res = await fetch(`/api/holidays?date=${h.date}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setHolidays((prev) => (prev ?? []).filter((x) => x.date !== h.date));
    } catch {
      setError("Couldn't remove that day. Try again.");
    }
  }

  const todayISO = toISODate(new Date());
  const upcoming = (holidays ?? []).filter((h) => h.date >= todayISO);
  const past = (holidays ?? []).filter((h) => h.date < todayISO);

  const inputStyle = {
    background: theme.ivory,
    border: `1px solid ${theme.line}`,
    borderRadius: 4,
    color: theme.ink,
    fontSize: 13,
    padding: "7px 9px",
  };

  return (
    <div className="shell py-7">
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 20,
          fontWeight: 700,
          color: theme.navy,
          marginBottom: 4,
        }}
      >
        School calendar
      </h2>
      <p style={{ color: theme.slate, fontSize: 13, marginBottom: 16 }}>
        Days marked here show as no-school on the pickup schedule. Assignments on those days are
        kept, just hidden — unmark a day and they come back.
      </p>

      {(school.links.calendar || school.links.portal) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {school.links.calendar && (
            <OutboundLink
              href={school.links.calendar}
              icon={CalendarDays}
              title={school.links.calendarLabel ?? "Official school calendar"}
              subtitle={`${school.name} — published dates`}
              theme={theme}
            />
          )}
          {school.links.portal && (
            <OutboundLink
              href={school.links.portal}
              icon={LogIn}
              title="Full events calendar"
              subtitle="Sign in to the parent portal"
              theme={theme}
            />
          )}
        </div>
      )}

      {error && (
        <div
          style={{
            background: "#FBEAEA",
            border: `1px solid ${theme.maroon}`,
            borderRadius: 6,
            color: theme.maroonDeep,
            fontSize: 13,
            marginBottom: 18,
            padding: "10px 14px",
          }}
        >
          {error}
        </div>
      )}

      <div
        className="flex flex-wrap items-end gap-2 mb-7"
        style={{ border: `1px dashed ${theme.line}`, borderRadius: 8, padding: 14 }}
      >
        <label className="flex flex-col gap-1">
          <span style={{ color: theme.slate, fontSize: 11, fontWeight: 600 }}>DATE</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
        </label>
        <label className="flex flex-col gap-1 flex-1" style={{ minWidth: 200 }}>
          <span style={{ color: theme.slate, fontSize: 11, fontWeight: 600 }}>
            WHAT IS IT? (OPTIONAL)
          </span>
          <input
            placeholder="No school"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            style={{ ...inputStyle, width: "100%" }}
          />
        </label>
        <button
          onClick={add}
          disabled={saving}
          className="flex items-center gap-1.5"
          style={{
            background: theme.maroon,
            border: "none",
            borderRadius: 4,
            color: theme.ivory,
            cursor: saving ? "wait" : "pointer",
            fontSize: 13,
            fontWeight: 600,
            padding: "8px 14px",
          }}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Add day
        </button>
      </div>

      {holidays === null ? (
        <div className="flex justify-center py-16">
          <Loader2 size={22} color={theme.slate} className="animate-spin" />
        </div>
      ) : (
        <>
          <Section title="Upcoming" items={upcoming} theme={theme} onRemove={remove} />
          {past.length > 0 && <Section title="Past" items={past} theme={theme} onRemove={remove} muted />}
        </>
      )}
    </div>
  );
}

// A link out to something the school publishes on its own site.
function OutboundLink({
  href,
  icon: Icon,
  title,
  subtitle,
  theme,
}: {
  href: string;
  icon: typeof CalendarDays;
  title: string;
  subtitle: string;
  theme: ReturnType<typeof useSchool>["theme"];
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2.5"
      style={{
        background: theme.parchment,
        border: `1px solid ${theme.line}`,
        borderRadius: 6,
        color: theme.ink,
        padding: "9px 13px",
        textDecoration: "none",
      }}
    >
      <Icon size={16} color={theme.maroon} style={{ flexShrink: 0 }} />
      <span>
        <span style={{ display: "block", fontSize: 13, fontWeight: 600 }}>{title}</span>
        <span style={{ display: "block", color: theme.slate, fontSize: 11.5 }}>{subtitle}</span>
      </span>
      <ExternalLink size={12} color={theme.slate} style={{ flexShrink: 0 }} />
    </a>
  );
}

function Section({
  title,
  items,
  theme,
  onRemove,
  muted,
}: {
  title: string;
  items: Holiday[];
  theme: ReturnType<typeof useSchool>["theme"];
  onRemove: (h: Holiday) => void;
  muted?: boolean;
}) {
  return (
    <div className="mb-7" style={{ opacity: muted ? 0.6 : 1 }}>
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 13,
          fontWeight: 700,
          color: theme.slate,
          borderBottom: `1px solid ${theme.line}`,
          letterSpacing: 0.6,
          marginBottom: 10,
          paddingBottom: 5,
          textTransform: "uppercase",
        }}
      >
        {title}
      </h3>

      {items.length === 0 ? (
        <p style={{ color: theme.slate, fontSize: 13, fontStyle: "italic" }}>
          Nothing on the calendar yet.
        </p>
      ) : (
        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((h) => {
            const d = fromISODate(h.date);
            return (
              <div
                key={h.id}
                className="flex items-center gap-2.5"
                style={{
                  background: theme.parchment,
                  border: `1px solid ${theme.line}`,
                  borderRadius: 6,
                  padding: "9px 12px",
                }}
              >
                <CalendarOff size={15} color={theme.maroon} style={{ flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <div style={{ color: theme.ink, fontSize: 13, fontWeight: 600 }}>
                    {formatWeekdayLong(d)}, {formatMonthDay(d)}
                  </div>
                  <div style={{ color: theme.slate, fontSize: 11.5 }} className="truncate">
                    {h.label}
                  </div>
                </div>
                <button
                  onClick={() => onRemove(h)}
                  title="Remove from the calendar"
                  style={{ background: "none", border: "none", cursor: "pointer", color: theme.slate }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
