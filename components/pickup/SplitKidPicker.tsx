"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useSchool } from "../SchoolProvider";
import { KIDS, kidAccent } from "@/lib/constants";
import type { PickupSlot } from "./types";

export default function SplitKidPicker({
  dateISO,
  type,
  existing,
  onSplit,
}: {
  dateISO: string;
  type: PickupSlot["type"];
  existing: PickupSlot[];
  onSplit: (dateISO: string, type: PickupSlot["type"], kidSlug: string) => void;
}) {
  const { theme } = useSchool();
  const [open, setOpen] = useState(false);

  const taken = new Set(existing.map((s) => s.kid?.slug).filter(Boolean));
  const available = KIDS.filter((k) => !taken.has(k.id));

  if (available.length === 0) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: theme.slate,
          fontSize: 11.5,
          padding: "2px 0 2px 22px",
        }}
      >
        <Plus size={12} />
        Split for one kid
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap" style={{ padding: "2px 0 2px 22px" }}>
      {available.map((k) => (
        <button
          key={k.id}
          onClick={() => {
            onSplit(dateISO, type, k.id);
            setOpen(false);
          }}
          style={{
            background: "transparent",
            border: `1px solid ${kidAccent(theme, k.id)}`,
            borderRadius: 4,
            color: kidAccent(theme, k.id),
            cursor: "pointer",
            fontSize: 11.5,
            fontWeight: 600,
            padding: "3px 8px",
          }}
        >
          {k.name.split(" ")[0]}
        </button>
      ))}
      <button
        onClick={() => setOpen(false)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: theme.slate,
          fontSize: 11.5,
          padding: "3px 4px",
        }}
      >
        Cancel
      </button>
    </div>
  );
}
