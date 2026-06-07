import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CaptureWorkProgressButton } from "@/components/projects/capture-work-progress-button";
import { WorkProgressList } from "@/components/projects/work-progress-list";
import type { WorkProgressRecord } from "@/services/work-progress";

type Props = {
  projectId: string;
  localPath: string | null;
  entries: WorkProgressRecord[];
};

export function ProjectWorkProgressCard({
  projectId,
  localPath,
  entries,
}: Props) {
  return (
    <Card>
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="text-base font-medium">Work progress</CardTitle>
        <CardDescription>
          Capture a Git snapshot of branch, latest commit, and working tree
          changes for this project.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <CaptureWorkProgressButton
          projectId={projectId}
          localPath={localPath}
        />

        <section className="space-y-2">
          <h3 className="text-sm font-medium">Recent snapshots</h3>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No work progress snapshots yet.
            </p>
          ) : (
            <WorkProgressList entries={entries} className="space-y-2" />
          )}
        </section>
      </CardContent>
    </Card>
  );
}
