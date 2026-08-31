"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSchool } from "../SchoolProvider";
import { formatMonthDay, fromISODate } from "@/lib/dates";

export default function WeekNav({
  weekStart,
  windowEnd,
  atMin,
  atMax,
  onPrev,
  onNext,
  onToday,
}: {
  weekStart: string;
  windowEnd: string;
  atMin: boolean;
  atMax: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const { theme } = useSchool();

  const arrowStyle = (disabled: boolean) => ({
    background: disabled ? "transparent" : theme.parchment,
    border: `1px solid ${disabled ? theme.line : theme.gold}`,
    borderRadius: 6,
    color: disabled ? theme.line : theme.navy,
    cursor: disabled ? "default" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 34,
    width: 34,
  });

  return (
    <div className="flex items-center gap-3">
      <button onClick={onPrev} disabled={atMin} aria-label="Previous week" style={arrowStyle(atMin)}>
        <ChevronLeft size={17} />
      </button>
      <button onClick={onNext} disabled={atMax} aria-label="Next week" style={arrowStyle(atMax)}>
        <ChevronRight size={17} />
      </button>

      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 20,
          fontWeight: 700,
          color: theme.navy,
        }}
      >
        {formatMonthDay(fromISODate(weekStart))} – {formatMonthDay(fromISODate(windowEnd))}
      </h2>

      {!atMin && (
        <button
          onClick={onToday}
          style={{
            background: "none",
            border: "none",
            color: theme.maroon,
            cursor: "pointer",
            fontSize: 12.5,
            fontWeight: 600,
          }}
        >
          This week
        </button>
      )}
    </div>
  );
}
