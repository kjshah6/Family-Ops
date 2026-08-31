// Pickup/drop-off slots are pure calendar dates, never instants. Every Date here
// is UTC midnight of the day in question, so a "day" can't drift across timezones.

export const WEEKS_AHEAD = 9;

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function fromISODate(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

export function startOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() + n);
  return out;
}

export function addWeeks(d: Date, n: number): Date {
  return addDays(d, n * 7);
}

export function mondayOfWeek(d: Date): Date {
  const start = startOfDay(d);
  const weekday = start.getUTCDay();
  return addDays(start, weekday === 0 ? -6 : 1 - weekday);
}

export function weekdayDates(monday: Date): Date[] {
  return [0, 1, 2, 3, 4].map((i) => addDays(monday, i));
}

export function isValidISODate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && toISODate(d) === s;
}

const MONTH_DAY = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const WEEKDAY_LONG = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  timeZone: "UTC",
});

const WEEKDAY_SHORT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  timeZone: "UTC",
});

export function formatWeekdayLong(d: Date): string {
  return WEEKDAY_LONG.format(d);
}

export function formatWeekdayShort(d: Date): string {
  return WEEKDAY_SHORT.format(d);
}

export function formatMonthDay(d: Date): string {
  return MONTH_DAY.format(d);
}

// --- Time of day, stored as minutes past midnight ---

export const TIME_STEP_MINUTES = 15;
export const DEFAULT_DROPOFF_MINUTES = 6 * 60 + 45; // 6:45 am
export const DEFAULT_PICKUP_MINUTES = 16 * 60 + 30; // 4:30 pm

const EARLIEST_MINUTES = 5 * 60; // 5:00 am
const LATEST_MINUTES = 20 * 60; // 8:00 pm

export function formatTime(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h24 >= 12 ? "pm" : "am";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")}${suffix}`;
}

export function timeOptions(): { value: number; label: string }[] {
  const out = [];
  for (let m = EARLIEST_MINUTES; m <= LATEST_MINUTES; m += TIME_STEP_MINUTES) {
    out.push({ value: m, label: formatTime(m) });
  }
  return out;
}

export function isValidSlotTime(minutes: unknown): minutes is number {
  return (
    typeof minutes === "number" &&
    Number.isInteger(minutes) &&
    minutes >= EARLIEST_MINUTES &&
    minutes <= LATEST_MINUTES &&
    minutes % TIME_STEP_MINUTES === 0
  );
}

export function formatWeekRangeLabel(monday: Date): string {
  const friday = addDays(monday, 4);
  return `${MONTH_DAY.format(monday)} – ${MONTH_DAY.format(friday)}`;
}
