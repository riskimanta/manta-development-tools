import { DashboardShell } from "@/components/layout/dashboard-shell";
import { NotFoundView } from "@/components/layout/not-found-view";
import { isMandevAuthConfigured } from "@/lib/mandev-session";

export default function NotFound() {
  return (
    <DashboardShell authEnabled={isMandevAuthConfigured()}>
      <NotFoundView />
    </DashboardShell>
  );
}
