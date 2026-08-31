"use client";

import { useState, useEffect } from "react";
import {
  Plus, Trash2, Loader2,
  LayoutList, Trophy, BookOpen, CalendarDays,
} from "lucide-react";
import { useSchool } from "./SchoolProvider";
import { KIDS, kidAccent, type Theme } from "@/lib/constants";

const CATEGORIES = [
  { id: "sports", label: "Sports" },
  { id: "classes", label: "Classes" },
];

const EMPTY_KID_DATA: any = { sports: [], classes: [] };

const FORM_DEFAULTS: any = {
  sports: { title: "", day: "", time: "", location: "" },
  classes: { subject: "", day: "", time: "", room: "" },
};

const EMPTY_COPY: any = {
  sports: "No games or practices on the board yet — add the first one below.",
  classes: "No classes logged yet — add a subject, day, and time below.",
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY_TOKENS = [
  ["monday", "mon"], ["tuesday", "tue", "tues"], ["wednesday", "wed", "weds"],
  ["thursday", "thu", "thur", "thurs"], ["friday", "fri"], ["saturday", "sat"], ["sunday", "sun"],
];
function classifyWeekday(dayText: string) {
  if (!dayText) return null;
  const d = dayText.toLowerCase();
  for (let i = 0; i < WEEKDAY_TOKENS.length; i++) if (WEEKDAY_TOKENS[i].some((t) => d.includes(t))) return i;
  return null;
}
function entryLabel(catId: string, data: any) {
  const title = catId === "sports" ? data.title : data.subject;
  const detail = [data.day, data.time].filter(Boolean).join(" ");
  return detail ? `${title} (${detail})` : title;
}

function Shield({ initials, active, theme }: { initials: string; active: boolean; theme: Theme }) {
  return (
    <div style={{
      width: 44, height: 50, clipPath: "polygon(50% 0%, 100% 15%, 100% 62%, 50% 100%, 0% 62%, 0% 15%)",
      background: active ? `linear-gradient(160deg, ${theme.maroon}, ${theme.maroonDeep})` : theme.navyLight,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      border: `1px solid ${active ? theme.gold : "transparent"}`,
    }}>
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: theme.ivory, letterSpacing: 1 }}>
        {initials}
      </span>
    </div>
  );
}

export default function FamilySchedule() {
  const { theme } = useSchool();
  const COLORS = theme;
  const [activeKid, setActiveKid] = useState("summary");
  const [activeCat, setActiveCat] = useState("sports");
  const [data, setData] = useState<any>({ nyra: null, eve: null, jack: null });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [forms, setForms] = useState<any>({
    nyra: JSON.parse(JSON.stringify(FORM_DEFAULTS)),
    eve: JSON.parse(JSON.stringify(FORM_DEFAULTS)),
    jack: JSON.parse(JSON.stringify(FORM_DEFAULTS)),
  });
  const [savingKid, setSavingKid] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadAll() {
      const next: any = {};
      for (const kid of KIDS) {
        try {
          const res = await fetch(`/api/kids/${kid.id}/entries`);
          const rows = await res.json();
          const grouped: any = { sports: [], classes: [] };
          // Retired categories (the old free-text "pickup") may still be in the
          // database — skip them rather than indexing into an absent bucket.
          for (const row of rows) grouped[row.category]?.push({ id: row.id, ...row.data });
          next[kid.id] = grouped;
        } catch {
          next[kid.id] = { ...EMPTY_KID_DATA };
        }
      }
      if (!cancelled) { setData(next); setLoading(false); }
    }
    loadAll().catch(() => { if (!cancelled) { setLoadError(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  function updateForm(kidId: string, catId: string, field: string, value: string) {
    setForms((prev: any) => ({ ...prev, [kidId]: { ...prev[kidId], [catId]: { ...prev[kidId][catId], [field]: value } } }));
  }

  async function addEntry(kidId: string, catId: string) {
    const form = forms[kidId][catId];
    const required = catId === "sports" ? form.title.trim() : form.subject.trim();
    if (!required) return;

    setSavingKid(kidId);
    try {
      const res = await fetch(`/api/kids/${kidId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: catId, data: form }),
      });
      const row = await res.json();
      setData((prev: any) => {
        const kidData = prev[kidId] || { ...EMPTY_KID_DATA };
        return { ...prev, [kidId]: { ...kidData, [catId]: [...kidData[catId], { id: row.id, ...form }] } };
      });
      setForms((prev: any) => ({ ...prev, [kidId]: { ...prev[kidId], [catId]: JSON.parse(JSON.stringify(FORM_DEFAULTS[catId])) } }));
    } finally {
      setSavingKid(null);
    }
  }

  async function removeEntry(kidId: string, catId: string, id: string) {
    setSavingKid(kidId);
    try {
      await fetch(`/api/kids/${kidId}/entries/${id}`, { method: "DELETE" });
      setData((prev: any) => {
        const kidData = prev[kidId] || { ...EMPTY_KID_DATA };
        return { ...prev, [kidId]: { ...kidData, [catId]: kidData[catId].filter((e: any) => e.id !== id) } };
      });
    } finally {
      setSavingKid(null);
    }
  }

  const kid = KIDS.find((k) => k.id === activeKid);
  const kidData = data[activeKid] || EMPTY_KID_DATA;
  const form = activeKid !== "summary" && activeKid !== "week" ? forms[activeKid][activeCat] : null;

  return (
    <>
      <div className="shell py-7">
        {loadError && (
          <div style={{ background: "#FBEAEA", border: `1px solid ${COLORS.maroon}`, color: COLORS.maroonDeep }} className="rounded px-4 py-3 mb-5 text-sm">
            Couldn't load the schedule. Try refreshing.
          </div>
        )}

        <div className="flex items-end gap-3 mb-6">
          <button onClick={() => setActiveKid("summary")} className="flex flex-col items-center gap-2" style={{ background: "none", border: "none", cursor: "pointer" }}>
            <div style={{ width: 44, height: 50, borderRadius: 6, background: activeKid === "summary" ? `linear-gradient(160deg, ${COLORS.navy}, ${COLORS.navyLight})` : COLORS.parchment, border: `1px solid ${activeKid === "summary" ? COLORS.gold : COLORS.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LayoutList size={18} color={activeKid === "summary" ? COLORS.ivory : COLORS.navy} />
            </div>
            <span style={{ fontSize: 12, fontWeight: activeKid === "summary" ? 600 : 500, color: activeKid === "summary" ? COLORS.maroon : COLORS.slate, borderBottom: activeKid === "summary" ? `2px solid ${COLORS.gold}` : "2px solid transparent", paddingBottom: 2 }}>Summary</span>
          </button>
          <button onClick={() => setActiveKid("week")} className="flex flex-col items-center gap-2" style={{ background: "none", border: "none", cursor: "pointer" }}>
            <div style={{ width: 44, height: 50, borderRadius: 6, background: activeKid === "week" ? `linear-gradient(160deg, ${COLORS.navy}, ${COLORS.navyLight})` : COLORS.parchment, border: `1px solid ${activeKid === "week" ? COLORS.gold : COLORS.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CalendarDays size={18} color={activeKid === "week" ? COLORS.ivory : COLORS.navy} />
            </div>
            <span style={{ fontSize: 12, fontWeight: activeKid === "week" ? 600 : 500, color: activeKid === "week" ? COLORS.maroon : COLORS.slate, borderBottom: activeKid === "week" ? `2px solid ${COLORS.gold}` : "2px solid transparent", paddingBottom: 2 }}>Week</span>
          </button>
          <div style={{ width: 1, alignSelf: "stretch", background: COLORS.line, margin: "0 2px" }} />
          {KIDS.map((k) => {
            const isActive = k.id === activeKid;
            return (
              <button key={k.id} onClick={() => setActiveKid(k.id)} className="flex flex-col items-center gap-2" style={{ background: "none", border: "none", cursor: "pointer" }}>
                <Shield initials={k.initials} active={isActive} theme={theme} />
                <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 500, color: isActive ? COLORS.maroon : COLORS.slate, borderBottom: isActive ? `2px solid ${COLORS.gold}` : "2px solid transparent", paddingBottom: 2 }}>{k.name}</span>
              </button>
            );
          })}
        </div>

        {activeKid !== "summary" && activeKid !== "week" && (
          <div style={{ borderBottom: `1px solid ${COLORS.line}` }} className="flex gap-6 mb-5">
            {CATEGORIES.map((c) => {
              const isActive = c.id === activeCat;
              return (
                <button key={c.id} onClick={() => setActiveCat(c.id)} style={{ background: "none", border: "none", cursor: "pointer", paddingBottom: 10, fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, color: isActive ? COLORS.navy : COLORS.slate, borderBottom: isActive ? `2px solid ${COLORS.maroon}` : "2px solid transparent", marginBottom: -1 }}>
                  {c.label}
                </button>
              );
            })}
            <div className="flex-1" />
            {savingKid === activeKid && <span className="flex items-center gap-1 text-xs" style={{ color: COLORS.slate }}><Loader2 size={12} className="animate-spin" /> saving</span>}
          </div>
        )}

        {loading ? (
          <div className="py-16 flex justify-center" style={{ color: COLORS.slate }}><Loader2 size={20} className="animate-spin" /></div>
        ) : activeKid === "summary" ? (
          <div className="grid sm:grid-cols-3 gap-4 mb-5">
            {KIDS.map((k) => {
              const kd = data[k.id] || EMPTY_KID_DATA;
              const total = kd.sports.length + kd.classes.length;
              return (
                <div key={k.id} style={{ background: COLORS.parchment, border: `1px solid ${COLORS.line}`, borderRadius: 6 }} className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield initials={k.initials} active={false} theme={theme} />
                    <div>
                      <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: COLORS.navy }}>{k.name}</p>
                      <p style={{ fontSize: 11, color: COLORS.slate }}>{total} item{total === 1 ? "" : "s"}</p>
                    </div>
                  </div>
                  {CATEGORIES.map((c) => (
                    <div key={c.id} className="mb-3 last:mb-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        {c.id === "sports" && <Trophy size={12} color={COLORS.maroon} />}
                        {c.id === "classes" && <BookOpen size={12} color={COLORS.maroon} />}
                        <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.maroon }} className="uppercase">{c.label}</span>
                      </div>
                      {kd[c.id].length === 0 ? <p style={{ fontSize: 12, color: COLORS.slate, fontStyle: "italic" }}>Nothing yet</p> : (
                        <ul style={{ fontSize: 12.5 }} className="space-y-0.5">
                          {kd[c.id].slice(0, 3).map((e: any) => <li key={e.id} className="truncate">{entryLabel(c.id, e)}</li>)}
                          {kd[c.id].length > 3 && <li style={{ color: COLORS.slate }}>+{kd[c.id].length - 3} more</li>}
                        </ul>
                      )}
                    </div>
                  ))}
                  <button onClick={() => setActiveKid(k.id)} style={{ color: COLORS.maroon, fontSize: 12, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}>View & edit →</button>
                </div>
              );
            })}
          </div>
        ) : activeKid === "week" ? (
          (() => {
            const buckets: any[] = Array.from({ length: 7 }, () => []);
            const unscheduled: any[] = [];
            KIDS.forEach((k) => {
              const kd = data[k.id] || EMPTY_KID_DATA;
              CATEGORIES.forEach((c) => {
                kd[c.id].forEach((e: any) => {
                  const item = { kidId: k.id, initials: k.initials, catId: c.id, entry: e };
                  const idx = classifyWeekday(e.day);
                  if (idx === null) unscheduled.push(item); else buckets[idx].push(item);
                });
              });
            });
            return (
              <div className="mb-5">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {WEEKDAY_LABELS.map((label, i) => (
                    <div key={label} style={{ minWidth: 128, background: COLORS.parchment, border: `1px solid ${COLORS.line}`, borderRadius: 6 }} className="p-3 flex-shrink-0">
                      <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: COLORS.navy }} className="mb-2">{label}</p>
                      {buckets[i].length === 0 ? <p style={{ fontSize: 11, color: COLORS.slate, fontStyle: "italic" }}>—</p> : (
                        <div className="space-y-1.5">
                          {buckets[i].map((item: any) => (
                            <div key={item.entry.id}>
                              <span style={{ fontSize: 9.5, fontWeight: 700, color: kidAccent(theme, item.kidId) }}>{item.initials}</span>
                              <p style={{ fontSize: 11.5 }} className="truncate leading-tight">{entryLabel(item.catId, item.entry)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {unscheduled.length > 0 && (
                  <div style={{ border: `1px solid ${COLORS.line}`, borderRadius: 6 }} className="mt-3 p-3">
                    <p style={{ fontSize: 11, fontWeight: 600, color: COLORS.slate }} className="uppercase mb-2">Dated / other entries</p>
                    <div className="space-y-1">
                      {unscheduled.map((item: any) => (
                        <p key={item.entry.id} style={{ fontSize: 12.5 }}>
                          <span style={{ fontWeight: 700, color: kidAccent(theme, item.kidId) }}>{item.initials}</span> {entryLabel(item.catId, item.entry)}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        ) : (
          <>
            <div style={{ background: COLORS.parchment, border: `1px solid ${COLORS.line}`, borderRadius: 6 }} className="mb-5 overflow-hidden">
              {kidData[activeCat].length === 0 ? (
                <p style={{ color: COLORS.slate, fontStyle: "italic" }} className="text-sm px-5 py-6">{EMPTY_COPY[activeCat]}</p>
              ) : (
                kidData[activeCat].map((entry: any, idx: number) => (
                  <div key={entry.id} style={{ borderTop: idx === 0 ? "none" : `1px solid ${COLORS.line}` }} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p style={{ fontWeight: 600, fontSize: 14 }} className="truncate">
                        {activeCat === "sports" ? entry.title : entry.subject}
                      </p>
                      <p style={{ fontSize: 12.5, color: COLORS.slate }}>
                        {[entry.day, entry.time, entry.location, entry.room].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <button onClick={() => removeEntry(activeKid, activeCat, entry.id)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.slate }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div style={{ border: `1px dashed ${COLORS.line}`, borderRadius: 6 }} className="p-4">
              <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.slate }} className="uppercase mb-3">
                Add to {kid?.name.split(" ")[0]}'s {CATEGORIES.find((c) => c.id === activeCat)!.label.toLowerCase()}
              </p>

              {activeCat === "sports" && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <input placeholder="Event (e.g. vs Eagles)" value={form.title} onChange={(e) => updateForm(activeKid, "sports", "title", e.target.value)} className="col-span-2 sm:col-span-1 border rounded px-3 py-2 text-sm" style={{ borderColor: COLORS.line }} />
                  <input placeholder="Day / date" value={form.day} onChange={(e) => updateForm(activeKid, "sports", "day", e.target.value)} className="border rounded px-3 py-2 text-sm" style={{ borderColor: COLORS.line }} />
                  <input placeholder="Time" value={form.time} onChange={(e) => updateForm(activeKid, "sports", "time", e.target.value)} className="border rounded px-3 py-2 text-sm" style={{ borderColor: COLORS.line }} />
                  <input placeholder="Location" value={form.location} onChange={(e) => updateForm(activeKid, "sports", "location", e.target.value)} className="border rounded px-3 py-2 text-sm" style={{ borderColor: COLORS.line }} />
                </div>
              )}
              {activeCat === "classes" && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <input placeholder="Subject" value={form.subject} onChange={(e) => updateForm(activeKid, "classes", "subject", e.target.value)} className="col-span-2 sm:col-span-1 border rounded px-3 py-2 text-sm" style={{ borderColor: COLORS.line }} />
                  <input placeholder="Day" value={form.day} onChange={(e) => updateForm(activeKid, "classes", "day", e.target.value)} className="border rounded px-3 py-2 text-sm" style={{ borderColor: COLORS.line }} />
                  <input placeholder="Time" value={form.time} onChange={(e) => updateForm(activeKid, "classes", "time", e.target.value)} className="border rounded px-3 py-2 text-sm" style={{ borderColor: COLORS.line }} />
                  <input placeholder="Room / teacher" value={form.room} onChange={(e) => updateForm(activeKid, "classes", "room", e.target.value)} className="border rounded px-3 py-2 text-sm" style={{ borderColor: COLORS.line }} />
                </div>
              )}

              <button onClick={() => addEntry(activeKid, activeCat)} className="mt-3 flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded" style={{ background: COLORS.maroon, color: COLORS.ivory }}>
                <Plus size={14} /> Add entry
              </button>
            </div>
          </>
        )}

        <p style={{ color: COLORS.slate, fontSize: 11.5 }} className="mt-8 text-center">Changes save automatically for every signed-in parent.</p>
      </div>
    </>
  );
}
