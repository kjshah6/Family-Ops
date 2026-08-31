"use client";

import { useCallback, useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Loader2, X } from "lucide-react";
import { useSchool } from "../SchoolProvider";
import { useDismissOnOutside } from "../useDismissOnOutside";
import { coupleAccent, kidAccent } from "@/lib/constants";
import { formatTime, timeOptions } from "@/lib/dates";
import type { Parent, PickupSlot } from "./types";

const TIME_CHOICES = timeOptions();

export default function SlotRow({
  slot,
  parents,
  me,
  busy,
  readOnly,
  onAssign,
  onTimeChange,
  onRemoveOverride,
}: {
  slot: PickupSlot;
  parents: Parent[];
  me: Parent | null;
  busy: boolean;
  readOnly?: boolean;
  onAssign: (slot: PickupSlot, parentIds: string[]) => void;
  onTimeChange: (slot: PickupSlot, timeMinutes: number) => void;
  onRemoveOverride?: (slot: PickupSlot) => void;
}) {
  const { theme } = useSchool();
  const [editingTime, setEditingTime] = useState(false);
  const [picking, setPicking] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useDismissOnOutside(
    pickerRef,
    picking,
    useCallback(() => setPicking(false), []),
  );

  const isDropoff = slot.type === "dropoff";
  const Icon = isDropoff ? ArrowDownRight : ArrowUpRight;
  const label = isDropoff ? "Drop-off" : "Pick-up";
  const isOverride = !!slot.kid;

  const assignees = [slot.assignedParent, slot.assignedParent2].filter(Boolean) as Parent[];
  const assignedIds = assignees.map((p) => p.id);

  // Toggling a name in the list: add if absent, remove if present. Adding a
  // third replaces the second, so a slot never exceeds two people.
  function toggle(parentId: string) {
    if (assignedIds.includes(parentId)) {
      onAssign(slot, assignedIds.filter((id) => id !== parentId));
    } else if (assignedIds.length < 2) {
      onAssign(slot, [...assignedIds, parentId]);
    } else {
      onAssign(slot, [assignedIds[0], parentId]);
    }
  }

  return (
    <div
      className="py-2"
      style={{
        opacity: readOnly ? 0.55 : 1,
        paddingLeft: isOverride ? 10 : 0,
        borderLeft: isOverride ? `2px solid ${kidAccent(theme, slot.kid!.slug)}` : "none",
      }}
    >
      <div className="flex items-center gap-1.5">
        <Icon size={14} color={isDropoff ? theme.navy : theme.maroon} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 12.5, fontWeight: 600, color: theme.ink }}>{label}</span>

        {editingTime && !readOnly ? (
          <select
            autoFocus
            value={slot.timeMinutes}
            onChange={(e) => {
              onTimeChange(slot, Number(e.target.value));
              setEditingTime(false);
            }}
            onBlur={() => setEditingTime(false)}
            style={{
              background: theme.ivory,
              border: `1px solid ${theme.gold}`,
              borderRadius: 3,
              color: theme.ink,
              fontSize: 11,
              padding: "1px 2px",
            }}
          >
            {TIME_CHOICES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        ) : (
          <button
            onClick={() => !readOnly && setEditingTime(true)}
            disabled={readOnly}
            title={readOnly ? undefined : "Change the time"}
            style={{
              background: "none",
              border: "none",
              borderBottom: readOnly ? "none" : `1px dotted ${theme.slate}`,
              color: theme.slate,
              cursor: readOnly ? "default" : "pointer",
              fontSize: 11.5,
              padding: 0,
            }}
          >
            {formatTime(slot.timeMinutes)}
          </button>
        )}

        <span className="flex-1" />

        {busy && <Loader2 size={13} color={theme.slate} className="animate-spin" />}

        {!busy && !readOnly && assignees.length === 0 && me && (
          <button
            onClick={() => onAssign(slot, [me.id])}
            title="Assign this to me"
            style={{
              background: theme.maroon,
              border: "none",
              borderRadius: 3,
              color: theme.ivory,
              cursor: "pointer",
              fontSize: 10.5,
              fontWeight: 600,
              padding: "2px 7px",
            }}
          >
            Claim
          </button>
        )}

        {!busy && !readOnly && isOverride && onRemoveOverride && (
          <button
            onClick={() => onRemoveOverride(slot)}
            title="Remove this kid-specific slot"
            style={{ background: "none", border: "none", cursor: "pointer", color: theme.slate }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {isOverride && (
        <div
          style={{
            color: kidAccent(theme, slot.kid!.slug),
            fontSize: 10.5,
            fontWeight: 600,
            marginTop: 1,
          }}
        >
          {slot.kid!.name.split(" ")[0]} only
        </div>
      )}

      {assignees.length > 0 && (
        <div className="flex items-center flex-wrap gap-1 mt-1">
          {assignees.map((p, i) => (
            <span key={p.id} className="flex items-center gap-1">
              {i > 0 && <span style={{ color: theme.slate, fontSize: 12 }}>/</span>}
              <span
                style={{
                  background: coupleAccent(theme, p),
                  borderRadius: 3,
                  color: theme.ivory,
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 6px",
                }}
              >
                {p.name}
              </span>
            </span>
          ))}
        </div>
      )}

      {!readOnly && (
        <div ref={pickerRef} style={{ marginTop: 3 }}>
          <button
            onClick={() => setPicking((v) => !v)}
            aria-expanded={picking}
            style={{
              background: "none",
              border: "none",
              color: theme.slate,
              cursor: "pointer",
              fontSize: 10.5,
              padding: 0,
            }}
          >
            {assignees.length === 0 ? "Assign someone…" : "Change…"}
          </button>

          {picking && (
          <div className="flex flex-col gap-0.5 mt-1">
            {parents.map((p) => {
              const on = assignedIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  className="flex items-center gap-1.5 text-left"
                  style={{
                    background: on ? coupleAccent(theme, p) : "transparent",
                    border: `1px solid ${on ? "transparent" : theme.line}`,
                    borderRadius: 3,
                    color: on ? theme.ivory : theme.ink,
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: on ? 600 : 400,
                    padding: "2px 6px",
                  }}
                >
                  <span
                    style={{
                      background: on ? theme.ivory : coupleAccent(theme, p),
                      borderRadius: "50%",
                      display: "inline-block",
                      height: 6,
                      width: 6,
                      flexShrink: 0,
                    }}
                  />
                  {p.name}
                  {me && p.id === me.id ? " (me)" : ""}
                </button>
              );
            })}
            {assignees.length > 0 && (
              <button
                onClick={() => {
                  onAssign(slot, []);
                  setPicking(false);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: theme.maroon,
                  cursor: "pointer",
                  fontSize: 10.5,
                  padding: "2px 0 0",
                  textAlign: "left",
                }}
              >
                Clear
              </button>
            )}
          </div>
          )}
        </div>
      )}
    </div>
  );
}
