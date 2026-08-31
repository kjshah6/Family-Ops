"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, ListChecks, Loader2 } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useSchool } from "../SchoolProvider";
import { addWeeks, formatWeekRangeLabel, fromISODate, toISODate, weekdayDates } from "@/lib/dates";
import WeekNav from "./WeekNav";
import DaySlotCard from "./DaySlotCard";
import MyCommitmentsList from "./MyCommitmentsList";
import type { Holiday, Parent, PickupSlot, WeekResponse } from "./types";

const MODES = [
  { id: "week", label: "Schedule", Icon: CalendarDays },
  { id: "mine", label: "My commitments", Icon: ListChecks },
] as const;

type Mode = (typeof MODES)[number]["id"];

export default function PickupWeekView() {
  const { data: session } = useSession();
  const { theme } = useSchool();

  const [mode, setMode] = useState<Mode>("week");
  const [week, setWeek] = useState<WeekResponse | null>(null);
  const [parents, setParents] = useState<Parent[]>([]);
  const [mine, setMine] = useState<PickupSlot[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const myEmail = session?.user?.email ?? "";
  const me = parents.find((p) => p.email && p.email.toLowerCase() === myEmail.toLowerCase()) ?? null;

  const loadWeek = useCallback(async (start: string | null) => {
    const res = await fetch(`/api/pickup${start ? `?weekStart=${start}` : ""}`);
    if (!res.ok) throw new Error("week");
    setWeek(await res.json());
  }, []);

  const loadMine = useCallback(async () => {
    const res = await fetch("/api/pickup/mine");
    if (!res.ok) throw new Error("mine");
    const data = await res.json();
    setMine(data.slots);
  }, []);

  // Parents are needed by both modes and never change during a session.
  useEffect(() => {
    fetch("/api/parents")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setParents(d.parents))
      .catch(() => setError("Couldn't load the parent list."));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (mode === "week" ? loadWeek(week?.weekStart ?? null) : loadMine())
      .catch(() => {
        if (!cancelled) setError("Couldn't load the schedule. Try refreshing.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  async function goToWeek(next: string) {
    setLoading(true);
    setError(null);
    try {
      await loadWeek(next);
    } catch {
      setError("Couldn't load that week.");
    } finally {
      setLoading(false);
    }
  }

  function applySlotUpdate(updated: PickupSlot) {
    setWeek((prev) =>
      prev ? { ...prev, slots: prev.slots.map((s) => (s.id === updated.id ? updated : s)) } : prev,
    );
    setMine((prev) => {
      if (!prev) return prev;
      const without = prev.filter((s) => s.id !== updated.id);
      const isMine =
        !!me && (updated.assignedParentId === me.id || updated.assignedParent2Id === me.id);
      if (!isMine) return without;
      return [...without, updated].sort((a, b) => a.date.localeCompare(b.date));
    });
  }

  async function assign(slot: PickupSlot, parentIds: string[]) {
    setBusyId(slot.id);
    setError(null);
    try {
      const res = await fetch(`/api/pickup/${slot.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentIds }),
      });
      if (!res.ok) throw new Error();
      applySlotUpdate(await res.json());
    } catch {
      setError("Couldn't update that slot. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function changeTime(slot: PickupSlot, timeMinutes: number) {
    setBusyId(slot.id);
    setError(null);
    try {
      const res = await fetch(`/api/pickup/${slot.id}/time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeMinutes }),
      });
      if (!res.ok) throw new Error();
      applySlotUpdate(await res.json());
    } catch {
      setError("Couldn't change that time. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleHoliday(dateISO: string, existing: Holiday | null) {
    setError(null);
    try {
      if (existing) {
        const res = await fetch(`/api/holidays?date=${dateISO}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        setWeek((prev) =>
          prev ? { ...prev, holidays: prev.holidays.filter((h) => h.date !== dateISO) } : prev,
        );
      } else {
        const res = await fetch("/api/holidays", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: dateISO }),
        });
        if (!res.ok) throw new Error();
        const created: Holiday = await res.json();
        setWeek((prev) => (prev ? { ...prev, holidays: [...prev.holidays, created] } : prev));
      }
    } catch {
      setError("Couldn't update the calendar. Try again.");
    }
  }

  async function split(dateISO: string, type: PickupSlot["type"], kidSlug: string) {
    setError(null);
    try {
      const res = await fetch("/api/pickup/split", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateISO, type, kidSlug }),
      });
      if (!res.ok) throw new Error();
      const created: PickupSlot = await res.json();
      setWeek((prev) =>
        prev && !prev.slots.some((s) => s.id === created.id)
          ? { ...prev, slots: [...prev.slots, created] }
          : prev,
      );
    } catch {
      setError("Couldn't split that slot. Try again.");
    }
  }

  async function removeOverride(slot: PickupSlot) {
    setBusyId(slot.id);
    setError(null);
    try {
      const res = await fetch(`/api/pickup/${slot.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setWeek((prev) => (prev ? { ...prev, slots: prev.slots.filter((s) => s.id !== slot.id) } : prev));
      setMine((prev) => (prev ? prev.filter((s) => s.id !== slot.id) : prev));
    } catch {
      setError("Couldn't remove that slot. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  const todayISO = toISODate(new Date());

  return (
    <div className="shell py-7">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        {mode === "week" && week ? (
          <WeekNav
            weekStart={week.weekStart}
            windowEnd={week.windowEnd}
            atMin={week.weekStart === week.minWeekStart}
            atMax={week.weekStart === week.maxWeekStart}
            onPrev={() => goToWeek(toISODate(addWeeks(fromISODate(week.weekStart), -1)))}
            onNext={() => goToWeek(toISODate(addWeeks(fromISODate(week.weekStart), 1)))}
            onToday={() => goToWeek(week.minWeekStart)}
          />
        ) : (
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: theme.navy }}>
            Everything assigned to you
          </h2>
        )}

        <div className="flex" style={{ border: `1px solid ${theme.line}`, borderRadius: 6, overflow: "hidden" }}>
          {MODES.map(({ id, label, Icon }) => {
            const active = mode === id;
            return (
              <button
                key={id}
                onClick={() => setMode(id)}
                className="flex items-center gap-1.5"
                style={{
                  background: active ? theme.navy : theme.parchment,
                  border: "none",
                  color: active ? theme.ivory : theme.slate,
                  cursor: "pointer",
                  fontSize: 12.5,
                  fontWeight: active ? 600 : 500,
                  padding: "8px 14px",
                }}
              >
                <Icon size={14} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

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

      {!loading && mode === "week" && !me && parents.length > 0 && (
        <div
          style={{
            background: theme.parchment,
            border: `1px solid ${theme.gold}`,
            borderRadius: 6,
            color: theme.slate,
            fontSize: 12.5,
            marginBottom: 18,
            padding: "10px 14px",
          }}
        >
          You're signed in as {myEmail}, which isn't matched to a parent yet — you can still assign
          anyone from the dropdowns, but "Claim" and "My commitments" need that link.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={22} color={theme.slate} className="animate-spin" />
        </div>
      ) : mode === "mine" ? (
        <MyCommitmentsList
          slots={mine ?? []}
          me={me}
          busyId={busyId}
          onRelease={(s) =>
            assign(
              s,
              [s.assignedParentId, s.assignedParent2Id].filter(
                (id): id is string => !!id && id !== me?.id,
              ),
            )
          }
        />
      ) : week ? (
        <div className="flex flex-col gap-7">
          {Array.from({ length: week.weeksVisible }, (_, i) => {
            const monday = addWeeks(fromISODate(week.weekStart), i);
            return (
              <section key={toISODate(monday)}>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 14,
                    fontWeight: 700,
                    color: theme.slate,
                    borderBottom: `1px solid ${theme.line}`,
                    marginBottom: 12,
                    paddingBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                  }}
                >
                  {formatWeekRangeLabel(monday)}
                </h3>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {weekdayDates(monday).map((date) => {
                    const iso = toISODate(date);
                    return (
                      <DaySlotCard
                        key={iso}
                        dateISO={iso}
                        slots={week.slots.filter((s) => s.date === iso)}
                        parents={parents}
                        me={me}
                        holiday={week.holidays.find((h) => h.date === iso) ?? null}
                        busyId={busyId}
                        isToday={iso === todayISO}
                        onAssign={assign}
                        onTimeChange={changeTime}
                        onSplit={split}
                        onRemoveOverride={removeOverride}
                        onToggleHoliday={toggleHoliday}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : null}

      <p style={{ color: theme.slate, fontSize: 11.5, marginTop: 22, textAlign: "center" }}>
        Anyone signed in can fill out the schedule for any parent. Changes are shared instantly.
      </p>
    </div>
  );
}
