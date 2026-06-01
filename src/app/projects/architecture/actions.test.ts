import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ArchitectureImportServiceError,
  importProjectArchitectureFromLocalFile,
  upsertProjectArchitecture,
} from "@/services/architectures";

import {
  importProjectArchitectureFromLocalFileAction,
  saveProjectArchitecture,
} from "./actions";

vi.mock("@/services/architectures", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/services/architectures")>();
  return {
    ...actual,
    upsertProjectArchitecture: vi.fn(),
    importProjectArchitectureFromLocalFile: vi.fn(),
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

function validArchitectureForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set("projectId", "proj-1");
  formData.set("summary", "Layered app overview");
  formData.set(
    "mermaidSource",
    "flowchart TD\n  User --> UI\n  UI --> Services",
  );
  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }
  return formData;
}

describe("saveProjectArchitecture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns field errors when validation fails", async () => {
    const formData = validArchitectureForm({ mermaidSource: "" });

    const result = await saveProjectArchitecture(undefined, formData);

    expect(result.fieldErrors?.mermaidSource).toBeDefined();
    expect(upsertProjectArchitecture).not.toHaveBeenCalled();
  });

  it("upserts architecture and revalidates project page on success", async () => {
    vi.mocked(upsertProjectArchitecture).mockResolvedValue({
      id: "arch-1",
      projectId: "proj-1",
      summary: "Layered app overview",
      mermaidSource: "flowchart TD\n  User --> UI\n  UI --> Services",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await saveProjectArchitecture(
      undefined,
      validArchitectureForm(),
    );

    expect(upsertProjectArchitecture).toHaveBeenCalledWith({
      projectId: "proj-1",
      summary: "Layered app overview",
      mermaidSource: "flowchart TD\n  User --> UI\n  UI --> Services",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/projects/proj-1");
    expect(result).toEqual({
      ok: true,
      message: "Architecture diagram saved",
    });
  });
});

describe("importProjectArchitectureFromLocalFileAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when projectId is missing", async () => {
    const formData = new FormData();

    const result = await importProjectArchitectureFromLocalFileAction(
      undefined,
      formData,
    );

    expect(result).toEqual({ message: "Project is required" });
    expect(importProjectArchitectureFromLocalFile).not.toHaveBeenCalled();
  });

  it("imports architecture and revalidates project page on success", async () => {
    vi.mocked(importProjectArchitectureFromLocalFile).mockResolvedValue({
      id: "arch-1",
      projectId: "proj-1",
      summary: "Imported",
      mermaidSource: "flowchart TD\n  A --> B",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const formData = new FormData();
    formData.set("projectId", "proj-1");

    const result = await importProjectArchitectureFromLocalFileAction(
      undefined,
      formData,
    );

    expect(importProjectArchitectureFromLocalFile).toHaveBeenCalledWith(
      "proj-1",
    );
    expect(revalidatePath).toHaveBeenCalledWith("/projects/proj-1");
    expect(result).toEqual({
      ok: true,
      message: "Architecture loaded from local path",
    });
  });

  it("returns user-friendly message when import fails", async () => {
    vi.mocked(importProjectArchitectureFromLocalFile).mockRejectedValue(
      new ArchitectureImportServiceError(
        "FILE_MISSING",
        "Could not find `.mandev/architecture.json` at the configured local path. Create the file in your target project first, then try again.",
      ),
    );

    const formData = new FormData();
    formData.set("projectId", "proj-1");

    const result = await importProjectArchitectureFromLocalFileAction(
      undefined,
      formData,
    );

    expect(result).toEqual({
      message:
        "Could not find `.mandev/architecture.json` at the configured local path. Create the file in your target project first, then try again.",
    });
  });
});
