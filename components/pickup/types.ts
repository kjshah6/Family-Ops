export type Parent = {
  id: string;
  slug: string;
  name: string;
  email?: string | null;
  kid: { slug: string; name?: string; initials?: string };
};

export type PickupSlot = {
  id: string;
  date: string; // YYYY-MM-DD
  type: "dropoff" | "pickup";
  kidId: string | null;
  kid: { slug: string; name: string; initials: string } | null;
  timeMinutes: number;
  assignedParentId: string | null;
  assignedParent: Parent | null;
  assignedParent2Id: string | null;
  assignedParent2: Parent | null;
  assignedBy: string | null;
  assignedAt: string | null;
};

export type Holiday = {
  id: string;
  date: string;
  label: string;
};

export type WeekResponse = {
  weekStart: string;
  windowEnd: string;
  weeksVisible: number;
  minWeekStart: string;
  maxWeekStart: string;
  slots: PickupSlot[];
  holidays: Holiday[];
};
