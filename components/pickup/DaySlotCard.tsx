"use client";

import { CalendarOff, Undo2 } from "lucide-react";
import { useSchool } from "../SchoolProvider";
import { SLOT_TYPES } from "@/lib/constants";
import { formatMonthDay, formatWeekdayLong, fromISODate } from "@/lib/dates";
import SlotRow from "./SlotRow";
import SplitKidPicker from "./SplitKidPicker";
import type { Holiday, Parent, PickupSlot } from "./types";

export default function DaySlotCard({
  dateISO,
  slots,
  parents,
  me,
  holiday,
  busyId,
  isToday,
  onAssign,
  onTimeChange,
  onSplit,
  onRemoveOverride,
  onToggleHoliday,
}: {
  dateISO: string;
  slots: PickupSlot[];
  parents: Parent[];
  me: Parent | null;
  holiday: Holiday | null;
  busyId: string | null;
  isToday: boolean;
  onAssign: (slot: PickupSlot, parentIds: string[]) => void;
  onTimeChange: (slot: PickupSlot, timeMinutes: number) => void;
  onSplit: (dateISO: string, type: PickupSlot["type"], kidSlug: string) => void;
  onRemoveOverride: (slot: PickupSlot) => void;
  onToggleHoliday: (dateISO: string, holiday: Holiday | null) => void;
}) {
  const { theme } = useSchool();
  const date = fromISODate(dateISO);
  const isHoliday = !!holiday;

  return (
    <div
      style={{
        background: isHoliday ? theme.ivory : theme.parchment,
        border: `1px ${isHoliday ? "dashed" : "solid"} ${isToday ? theme.gold : theme.line}`,
        borderRadius: 8,
        padding: "12px 14px",
      }}
    >
      <div className="flex items-baseline gap-2 mb-1.5">
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: theme.navy }}>
          {formatWeekdayLong(date)}
        </span>
        <span style={{ fontSize: 12, color: theme.slate }}>{formatMonthDay(date)}</span>
        {isToday && (
          <span
            style={{
              background: theme.gold,
              color: theme.navy,
              borderRadius: 3,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.4,
              padding: "1px 5px",
            }}
          >
            TODAY
          </span>
        )}
        <span className="flex-1" />
        <button
          onClick={() => onToggleHoliday(dateISO, holiday)}
          title={isHoliday ? "This is a school day after all" : "Mark as a school holiday"}
          style={{ background: "none", border: "none", cursor: "pointer", color: theme.slate, padding: 0 }}
        >
          {isHoliday ? <Undo2 size={13} /> : <CalendarOff size={13} />}
        </button>
      </div>

      {isHoliday && (
        <div
          style={{
            background: theme.parchment,
            border: `1px solid ${theme.line}`,
            borderRadius: 4,
            color: theme.maroon,
            fontSize: 11.5,
            fontWeight: 600,
            marginBottom: 6,
            padding: "4px 8px",
            textAlign: "center",
          }}
        >
          {holiday.label}
        </div>
      )}

      {SLOT_TYPES.map(({ id: type }) => {
        const family = slots.find((s) => s.type === type && !s.kidId);
        const overrides = slots.filter((s) => s.type === type && s.kidId);

        return (
          <div key={type} style={{ borderTop: `1px solid ${theme.line}`, paddingTop: 2 }}>
            {family && (
              <SlotRow
                slot={family}
                parents={parents}
                me={me}
                busy={busyId === family.id}
                readOnly={isHoliday}
                onAssign={onAssign}
                onTimeChange={onTimeChange}
              />
            )}
            {overrides.map((slot) => (
              <SlotRow
                key={slot.id}
                slot={slot}
                parents={parents}
                me={me}
                busy={busyId === slot.id}
                readOnly={isHoliday}
                onAssign={onAssign}
                onTimeChange={onTimeChange}
                onRemoveOverride={onRemoveOverride}
              />
            ))}
            {!isHoliday && (
              <SplitKidPicker dateISO={dateISO} type={type} existing={overrides} onSplit={onSplit} />
            )}
          </div>
        );
      })}
    </div>
  );
}
