import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createProjectRecord,
  deleteProjectRecord,
  updateProjectRecord,
} from "@/services/projects";

import {
  createProject,
  deleteProject,
  updateProject,
} from "./actions";

vi.mock("@/services/projects", () => ({
  createProjectRecord: vi.fn(),
  updateProjectRecord: vi.fn(),
  deleteProjectRecord: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

function prismaP2002() {
  return new Prisma.PrismaClientKnownRequestError(
    "Unique constraint failed",
    { code: "P2002", clientVersion: "6.18.0" },
  );
}

function validProjectForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set("name", "ManDev");
  formData.set("slug", "mandev");
  formData.set("description", "Internal tools");
  formData.set("repoUrl", "https://github.com/example/mandev");
  formData.set("localPath", "/Users/dev/mandev");
  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }
  return formData;
}

const normalizedProjectData = {
  name: "ManDev",
  slug: "mandev",
  description: "Internal tools",
  repoUrl: "https://github.com/example/mandev",
  localPath: "/Users/dev/mandev",
};

describe("createProject", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(redirect).mockImplementation((url: string) => {
      throw new Error(`REDIRECT:${url}`);
    });
  });

  it("returns field errors when validation fails", async () => {
    const formData = validProjectForm({ name: "", slug: "Bad Slug" });

    const result = await createProject(undefined, formData);

    expect(result.fieldErrors?.name).toContain("Name is required");
    expect(result.fieldErrors?.slug).toBeDefined();
    expect(createProjectRecord).not.toHaveBeenCalled();
  });

  it("calls createProjectRecord and revalidates on success", async () => {
    vi.mocked(createProjectRecord).mockResolvedValue({
      id: "proj-1",
      ...normalizedProjectData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(createProject(undefined, validProjectForm())).rejects.toThrow(
      "REDIRECT:/projects/proj-1",
    );

    expect(createProjectRecord).toHaveBeenCalledWith(normalizedProjectData);
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/projects");
    expect(redirect).toHaveBeenCalledWith("/projects/proj-1");
  });

  it("maps Prisma P2002 to slug field error", async () => {
    vi.mocked(createProjectRecord).mockRejectedValue(prismaP2002());

    const result = await createProject(undefined, validProjectForm());

    expect(result.fieldErrors?.slug).toEqual(["This slug is already in use"]);
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("updateProject", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns field errors when validation fails", async () => {
    const formData = validProjectForm({ id: "", name: "" });

    const result = await updateProject(undefined, formData);

    expect(result.fieldErrors?.id).toBeDefined();
    expect(result.fieldErrors?.name).toContain("Name is required");
    expect(updateProjectRecord).not.toHaveBeenCalled();
  });

  it("returns success state and revalidates on success", async () => {
    vi.mocked(updateProjectRecord).mockResolvedValue({
      id: "proj-1",
      ...normalizedProjectData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await updateProject(
      undefined,
      validProjectForm({ id: "proj-1" }),
    );

    expect(result).toEqual({ ok: true, message: "Project updated" });
    expect(updateProjectRecord).toHaveBeenCalledWith(
      "proj-1",
      normalizedProjectData,
    );
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/projects");
    expect(revalidatePath).toHaveBeenCalledWith("/projects/proj-1");
  });
});

describe("deleteProject", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(redirect).mockImplementation((url: string) => {
      throw new Error(`REDIRECT:${url}`);
    });
  });

  it("does not call delete service when id is missing", async () => {
    const formData = new FormData();

    await deleteProject(formData);

    expect(deleteProjectRecord).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });
});
