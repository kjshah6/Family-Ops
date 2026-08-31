import { SchoolProvider } from "@/components/SchoolProvider";
import Header from "@/components/Header";
import AppShell from "@/components/AppShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SchoolProvider>
      <AppShell>
        <Header />
        {children}
      </AppShell>
    </SchoolProvider>
  );
}
