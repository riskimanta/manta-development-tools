import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getProjectById } from "@/services/projects";
import {
  createRunProfileRecord,
  deleteRunProfileRecord,
  importProjectRunProfilesFromLocalFile,
  updateRunProfileRecord,
} from "@/services/run-profiles";

import {
  createRunProfile,
  deleteRunProfile,
  importRunProfilesFromLocalPathAction,
  updateRunProfile,
} from "./actions";

vi.mock("@/services/run-profiles", () => ({
  createRunProfileRecord: vi.fn(),
  updateRunProfileRecord: vi.fn(),
  deleteRunProfileRecord: vi.fn(),
  importProjectRunProfilesFromLocalFile: vi.fn(),
  RunProfileServiceError: class RunProfileServiceError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
  RunProfileImportServiceError: class RunProfileImportServiceError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
}));

vi.mock("@/services/projects", () => ({
  getProjectById: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

function validRunProfileForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set("projectId", "proj-1");
  formData.set("name", "Dev server");
  formData.set("command", "pnpm dev");
  formData.set("workingDirectory", "/Users/dev/app");
  formData.set("description", "Local Next.js");
  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }
  return formData;
}

describe("createRunProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getProjectById).mockResolvedValue({
      id: "proj-1",
      localPath: "/Users/dev/app",
    } as never);
  });

  it("returns field errors when validation fails", async () => {
    const result = await createRunProfile(
      undefined,
      validRunProfileForm({ command: "" }),
    );

    expect(result.fieldErrors?.command).toBeDefined();
    expect(createRunProfileRecord).not.toHaveBeenCalled();
  });

  it("creates profile and revalidates project page on success", async () => {
    vi.mocked(createRunProfileRecord).mockResolvedValue({
      id: "rp-1",
      projectId: "proj-1",
      name: "Dev server",
      command: "pnpm dev",
      workingDirectory: "/Users/dev/app",
      description: "Local Next.js",
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createRunProfile(undefined, validRunProfileForm());

    expect(createRunProfileRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "proj-1",
        name: "Dev server",
        command: "pnpm dev",
      }),
      "/Users/dev/app",
    );
    expect(revalidatePath).toHaveBeenCalledWith("/projects/proj-1");
    expect(result).toEqual({ ok: true, message: "Run profile created" });
  });
});

describe("updateRunProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getProjectById).mockResolvedValue({
      id: "proj-1",
      localPath: "/Users/dev/app",
    } as never);
  });

  it("updates profile and revalidates on success", async () => {
    const formData = validRunProfileForm();
    formData.set("id", "rp-1");
    formData.set("isDefault", "on");

    vi.mocked(updateRunProfileRecord).mockResolvedValue({
      id: "rp-1",
      projectId: "proj-1",
      name: "Dev server",
      command: "pnpm dev",
      workingDirectory: "/Users/dev/app",
      description: "Local Next.js",
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await updateRunProfile(undefined, formData);

    expect(updateRunProfileRecord).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/projects/proj-1");
    expect(result).toEqual({ ok: true, message: "Run profile updated" });
  });
});

describe("importRunProfilesFromLocalPathAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when project id is missing", async () => {
    const formData = new FormData();

    const result = await importRunProfilesFromLocalPathAction(
      undefined,
      formData,
    );

    expect(result).toEqual({ message: "Project is required" });
    expect(importProjectRunProfilesFromLocalFile).not.toHaveBeenCalled();
  });

  it("imports profiles and revalidates on success", async () => {
    vi.mocked(importProjectRunProfilesFromLocalFile).mockResolvedValue({
      created: 2,
      updated: 0,
    });

    const formData = new FormData();
    formData.set("projectId", "proj-1");

    const result = await importRunProfilesFromLocalPathAction(
      undefined,
      formData,
    );

    expect(importProjectRunProfilesFromLocalFile).toHaveBeenCalledWith(
      "proj-1",
    );
    expect(revalidatePath).toHaveBeenCalledWith("/projects/proj-1");
    expect(result).toEqual({
      ok: true,
      message: "Run profiles loaded from local path",
    });
  });
});

describe("deleteRunProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes profile and revalidates project page", async () => {
    const formData = new FormData();
    formData.set("id", "rp-1");
    formData.set("projectId", "proj-1");

    await deleteRunProfile(formData);

    expect(deleteRunProfileRecord).toHaveBeenCalledWith("rp-1");
    expect(revalidatePath).toHaveBeenCalledWith("/projects/proj-1");
  });
});
