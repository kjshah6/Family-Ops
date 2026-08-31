"use client";

import { ArrowDownRight, ArrowUpRight, Loader2 } from "lucide-react";
import { useSchool } from "../SchoolProvider";
import { coupleAccent, kidAccent } from "@/lib/constants";
import { formatMonthDay, formatTime, formatWeekdayLong, fromISODate } from "@/lib/dates";
import type { Parent, PickupSlot } from "./types";

export default function MyCommitmentsList({
  slots,
  me,
  busyId,
  onRelease,
}: {
  slots: PickupSlot[];
  me: Parent | null;
  busyId: string | null;
  onRelease: (slot: PickupSlot) => void;
}) {
  const { theme } = useSchool();

  if (slots.length === 0) {
    return (
      <div
        style={{
          background: theme.parchment,
          border: `1px solid ${theme.line}`,
          borderRadius: 8,
          color: theme.slate,
          fontStyle: "italic",
          padding: "28px 20px",
          textAlign: "center",
        }}
      >
        Nothing assigned to you yet. Switch to the schedule to pick some up.
      </div>
    );
  }

  return (
    <div
      style={{
        background: theme.parchment,
        border: `1px solid ${theme.line}`,
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      {slots.map((slot, i) => {
        const isDropoff = slot.type === "dropoff";
        const Icon = isDropoff ? ArrowDownRight : ArrowUpRight;
        const date = fromISODate(slot.date);

        return (
          <div
            key={slot.id}
            className="flex items-center gap-3 px-4 py-3"
            style={{ borderTop: i === 0 ? "none" : `1px solid ${theme.line}` }}
          >
            <Icon size={16} color={isDropoff ? theme.navy : theme.maroon} style={{ flexShrink: 0 }} />

            <div style={{ width: 190, flexShrink: 0 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: theme.ink }}>
                {formatWeekdayLong(date)}
              </span>
              <span style={{ fontSize: 12.5, color: theme.slate }}> · {formatMonthDay(date)}</span>
            </div>

            <div className="flex-1 min-w-0" style={{ fontSize: 13 }}>
              <span style={{ color: theme.ink, fontWeight: 500 }}>
                {isDropoff ? "Drop-off" : "Pick-up"}
              </span>
              <span style={{ color: theme.slate }}> · {formatTime(slot.timeMinutes)}</span>
              <span style={{ color: theme.slate }}>
                {slot.kid ? (
                  <>
                    {" · "}
                    <span style={{ color: kidAccent(theme, slot.kid.slug), fontWeight: 600 }}>
                      {slot.kid.name} only
                    </span>
                  </>
                ) : (
                  " · Whole family"
                )}
              </span>
              {(() => {
                const partner = [slot.assignedParent, slot.assignedParent2].find(
                  (p) => p && p.id !== me?.id,
                );
                return partner ? (
                  <span style={{ color: coupleAccent(theme, partner), fontWeight: 600 }}>
                    {" "}
                    / with {partner.name}
                  </span>
                ) : null;
              })()}
            </div>

            {busyId === slot.id ? (
              <Loader2 size={15} color={theme.slate} className="animate-spin" />
            ) : (
              <button
                onClick={() => onRelease(slot)}
                style={{
                  background: "transparent",
                  border: `1px solid ${theme.maroon}`,
                  borderRadius: 4,
                  color: theme.maroon,
                  cursor: "pointer",
                  fontSize: 11.5,
                  fontWeight: 600,
                  padding: "4px 9px",
                  flexShrink: 0,
                }}
              >
                Release
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
