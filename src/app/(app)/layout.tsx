import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { isMandevAuthConfigured } from "@/lib/mandev-session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell authEnabled={isMandevAuthConfigured()}>
      {children}
    </DashboardShell>
  );
}
