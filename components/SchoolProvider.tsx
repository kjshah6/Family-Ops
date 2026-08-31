"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { SCHOOLS, DEFAULT_SCHOOL_ID, type School, type Theme } from "@/lib/constants";

const STORAGE_KEY = "cubby.school";

type SchoolContextValue = {
  school: School;
  theme: Theme;
  schools: School[];
  setSchool: (id: string) => void;
};

const SchoolContext = createContext<SchoolContextValue | null>(null);

export function SchoolProvider({ children }: { children: React.ReactNode }) {
  const [schoolId, setSchoolId] = useState(DEFAULT_SCHOOL_ID);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && SCHOOLS.some((s) => s.id === saved)) setSchoolId(saved);
    } catch {
      // Private browsing or blocked storage — the default school is fine.
    }
  }, []);

  function setSchool(id: string) {
    if (!SCHOOLS.some((s) => s.id === id)) return;
    setSchoolId(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Preference just won't persist; the switch still applies this session.
    }
  }

  const school = SCHOOLS.find((s) => s.id === schoolId) ?? SCHOOLS[0];

  return (
    <SchoolContext.Provider value={{ school, theme: school.theme, schools: SCHOOLS, setSchool }}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const ctx = useContext(SchoolContext);
  if (!ctx) throw new Error("useSchool must be used inside a SchoolProvider");
  return ctx;
}
