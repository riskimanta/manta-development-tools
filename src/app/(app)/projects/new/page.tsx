import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { ProjectCreateForm } from "@/components/projects/project-create-form";
import { cn } from "@/lib/utils";

export default function NewProjectPage() {
  return (
    <>
      <PageHeader
        items={[
          { label: "Dashboard", href: "/" },
          { label: "Projects", href: "/projects" },
          { label: "New" },
        ]}
        title="New project"
        description="Define a slug and optional links so features can be routed to the right codebase."
        actions={
          <Link
            href="/projects"
            className={cn(buttonVariants({ variant: "outline" }), "hidden sm:inline-flex")}
          >
            Cancel
          </Link>
        }
      />
      <ProjectCreateForm />
    </>
  );
}
