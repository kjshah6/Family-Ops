import { db } from "./db";
import {
  DEFAULT_DROPOFF_MINUTES,
  DEFAULT_PICKUP_MINUTES,
  WEEKS_AHEAD,
  addWeeks,
  mondayOfWeek,
  toISODate,
  weekdayDates,
} from "./dates";
import { SLOT_TYPES, type SlotType } from "./constants";

// Shared shape for every endpoint that returns slots, so the client always gets
// the same fields.
const PARENT_SELECT = {
  select: { id: true, slug: true, name: true, kid: { select: { slug: true } } },
} as const;

export const SLOT_INCLUDE = {
  kid: { select: { slug: true, name: true, initials: true } },
  assignedParent: PARENT_SELECT,
  assignedParent2: PARENT_SELECT,
} as const;

export function defaultTimeFor(type: string): number {
  return type === "dropoff" ? DEFAULT_DROPOFF_MINUTES : DEFAULT_PICKUP_MINUTES;
}

export function slotKeyFor(dateISO: string, type: SlotType, kidId: string | null): string {
  return `${dateISO}|${type}|${kidId ?? "family"}`;
}

export function navBounds() {
  const minWeekStart = mondayOfWeek(new Date());
  return {
    minWeekStart,
    maxWeekStart: addWeeks(minWeekStart, WEEKS_AHEAD - 1),
    horizonEnd: weekdayDates(addWeeks(minWeekStart, WEEKS_AHEAD - 1))[4],
  };
}

// Creates the family-wide slots for every weekday in the rolling window. Safe to
// call on every request: it's ~90 rows and skipDuplicates makes repeat calls a
// no-op, so the horizon rolls forward without a scheduled job.
export async function ensurePickupSlots() {
  const { minWeekStart } = navBounds();

  const rows: {
    date: Date;
    type: string;
    kidId: null;
    slotKey: string;
    timeMinutes: number;
  }[] = [];
  for (let w = 0; w < WEEKS_AHEAD; w++) {
    for (const date of weekdayDates(addWeeks(minWeekStart, w))) {
      const iso = toISODate(date);
      for (const { id: type } of SLOT_TYPES) {
        rows.push({
          date,
          type,
          kidId: null,
          slotKey: slotKeyFor(iso, type, null),
          timeMinutes: defaultTimeFor(type),
        });
      }
    }
  }

  await db.pickupSlot.createMany({ data: rows, skipDuplicates: true });
}

export function isSlotType(value: unknown): value is SlotType {
  return SLOT_TYPES.some((t) => t.id === value);
}
