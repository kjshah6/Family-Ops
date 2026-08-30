"use client";

import { useState, useEffect } from "react";
import {
  Plus, Trash2, ArrowUpRight, ArrowDownRight, Loader2,
  LayoutList, Trophy, BookOpen, CalendarDays, LogOut, Fingerprint,
} from "lucide-react";
import { useSession, signOut, authClient } from "@/lib/auth-client";

const COLORS = {
  maroon: "#7A1B2E", maroonDeep: "#591420", navy: "#16213E", navyLight: "#29365C",
  ivory: "#F7F2E7", parchment: "#EFE6D3", gold: "#B08D3E", ink: "#231F1B",
  slate: "#6B6357", line: "#DDD1B4",
};

const KIDS = [
  { id: "nyra", name: "Nyra Shah", initials: "NS" },
  { id: "eve", name: "Eve Edwards", initials: "EE" },
  { id: "jack", name: "Jack Baker", initials: "JB" },
];
const KID_ACCENT: Record<string, string> = { nyra: COLORS.maroon, eve: COLORS.navy, jack: COLORS.gold };

const CATEGORIES = [
  { id: "sports", label: "Sports" },
  { id: "classes", label: "Classes" },
  { id: "pickup", label: "Pickup & Drop-off" },
];

const EMPTY_KID_DATA: any = { sports: [], classes: [], pickup: [] };

const FORM_DEFAULTS: any = {
  sports: { title: "", day: "", time: "", location: "" },
  classes: { subject: "", day: "", time: "", room: "" },
  pickup: { type: "Drop-off", person: "", day: "", time: "", notes: "" },
};

const EMPTY_COPY: any = {
  sports: "No games or practices on the board yet — add the first one below.",
  classes: "No classes logged yet — add a subject, day, and time below.",
  pickup: "No pickups or drop-offs set — add who's covering and when below.",
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
  const title = catId === "sports" ? data.title : catId === "classes" ? data.subject : `${data.type} — ${data.person}`;
  const detail = [data.day, data.time].filter(Boolean).join(" ");
  return detail ? `${title} (${detail})` : title;
}

function Shield({ initials, active }: { initials: string; active: boolean }) {
  return (
    <div style={{
      width: 44, height: 50, clipPath: "polygon(50% 0%, 100% 15%, 100% 62%, 50% 100%, 0% 62%, 0% 15%)",
      background: active ? `linear-gradient(160deg, ${COLORS.maroon}, ${COLORS.maroonDeep})` : COLORS.navyLight,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      border: `1px solid ${active ? COLORS.gold : "transparent"}`,
    }}>
      <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 15, color: COLORS.ivory, letterSpacing: 1 }}>
        {initials}
      </span>
    </div>
  );
}

export default function FamilySchedule() {
  const { data: session } = useSession();
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
          const grouped: any = { sports: [], classes: [], pickup: [] };
          for (const row of rows) grouped[row.category].push({ id: row.id, ...row.data });
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
    const required = catId === "sports" ? form.title.trim() : catId === "classes" ? form.subject.trim() : form.person.trim();
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

  async function registerPasskey() {
    await authClient.passkey.addPasskey();
  }

  const kid = KIDS.find((k) => k.id === activeKid);
  const kidData = data[activeKid] || EMPTY_KID_DATA;
  const form = activeKid !== "summary" && activeKid !== "week" ? forms[activeKid][activeCat] : null;

  return (
    <div style={{ background: COLORS.ivory, minHeight: "100vh", color: COLORS.ink }}>
      <div style={{ background: COLORS.navy, borderBottom: `3px solid ${COLORS.gold}` }} className="px-5 py-6 sm:px-8 sm:py-8">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: `2px solid ${COLORS.gold}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontFamily: "'Playfair Display', serif", color: COLORS.gold, fontWeight: 700, fontSize: 15 }}>FS</span>
          </div>
          <div className="flex-1">
            <h1 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.ivory, fontSize: 24, fontWeight: 700 }}>Family Roster</h1>
            <p style={{ color: COLORS.parchment, fontSize: 13, marginTop: 2 }}>Signed in as {session?.user?.email ?? "..."}</p>
          </div>
          <button onClick={registerPasskey} title="Add a passkey for faster sign-in" style={{ color: COLORS.gold, background: "none", border: "none", cursor: "pointer" }}>
            <Fingerprint size={20} />
          </button>
          <button onClick={() => signOut()} title="Sign out" style={{ color: COLORS.parchment, background: "none", border: "none", cursor: "pointer" }}>
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-6">
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
                <Shield initials={k.initials} active={isActive} />
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
                <button key={c.id} onClick={() => setActiveCat(c.id)} style={{ background: "none", border: "none", cursor: "pointer", paddingBottom: 10, fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: isActive ? COLORS.navy : COLORS.slate, borderBottom: isActive ? `2px solid ${COLORS.maroon}` : "2px solid transparent", marginBottom: -1 }}>
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
              const total = kd.sports.length + kd.classes.length + kd.pickup.length;
              return (
                <div key={k.id} style={{ background: COLORS.parchment, border: `1px solid ${COLORS.line}`, borderRadius: 6 }} className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield initials={k.initials} active={false} />
                    <div>
                      <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 14, color: COLORS.navy }}>{k.name}</p>
                      <p style={{ fontSize: 11, color: COLORS.slate }}>{total} item{total === 1 ? "" : "s"}</p>
                    </div>
                  </div>
                  {CATEGORIES.map((c) => (
                    <div key={c.id} className="mb-3 last:mb-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        {c.id === "sports" && <Trophy size={12} color={COLORS.maroon} />}
                        {c.id === "classes" && <BookOpen size={12} color={COLORS.maroon} />}
                        {c.id === "pickup" && <ArrowUpRight size={12} color={COLORS.maroon} />}
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
                      <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 13, color: COLORS.navy }} className="mb-2">{label}</p>
                      {buckets[i].length === 0 ? <p style={{ fontSize: 11, color: COLORS.slate, fontStyle: "italic" }}>—</p> : (
                        <div className="space-y-1.5">
                          {buckets[i].map((item: any) => (
                            <div key={item.entry.id}>
                              <span style={{ fontSize: 9.5, fontWeight: 700, color: KID_ACCENT[item.kidId] }}>{item.initials}</span>
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
                          <span style={{ fontWeight: 700, color: KID_ACCENT[item.kidId] }}>{item.initials}</span> {entryLabel(item.catId, item.entry)}
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
                    {activeCat === "pickup" && (
                      <span style={{ color: entry.type === "Drop-off" ? COLORS.navy : COLORS.maroon }}>
                        {entry.type === "Drop-off" ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p style={{ fontWeight: 600, fontSize: 14 }} className="truncate">
                        {activeCat === "sports" && entry.title}
                        {activeCat === "classes" && entry.subject}
                        {activeCat === "pickup" && `${entry.type} — ${entry.person}`}
                      </p>
                      <p style={{ fontSize: 12.5, color: COLORS.slate }}>
                        {[entry.day, entry.time, entry.location, entry.room, entry.notes].filter(Boolean).join(" · ")}
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
              {activeCat === "pickup" && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <select value={form.type} onChange={(e) => updateForm(activeKid, "pickup", "type", e.target.value)} className="border rounded px-3 py-2 text-sm" style={{ borderColor: COLORS.line }}>
                    <option>Drop-off</option>
                    <option>Pick-up</option>
                  </select>
                  <input placeholder="Person" value={form.person} onChange={(e) => updateForm(activeKid, "pickup", "person", e.target.value)} className="border rounded px-3 py-2 text-sm" style={{ borderColor: COLORS.line }} />
                  <input placeholder="Day / date" value={form.day} onChange={(e) => updateForm(activeKid, "pickup", "day", e.target.value)} className="border rounded px-3 py-2 text-sm" style={{ borderColor: COLORS.line }} />
                  <input placeholder="Time" value={form.time} onChange={(e) => updateForm(activeKid, "pickup", "time", e.target.value)} className="border rounded px-3 py-2 text-sm" style={{ borderColor: COLORS.line }} />
                  <input placeholder="Notes" value={form.notes} onChange={(e) => updateForm(activeKid, "pickup", "notes", e.target.value)} className="border rounded px-3 py-2 text-sm" style={{ borderColor: COLORS.line }} />
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
    </div>
  );
}
