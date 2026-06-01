import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createFeatureRecord,
  deleteFeatureRecord,
  updateFeatureRecord,
} from "@/services/features";

import {
  createFeature,
  deleteFeature,
  updateFeature,
} from "./actions";

vi.mock("@/services/features", () => ({
  createFeatureRecord: vi.fn(),
  updateFeatureRecord: vi.fn(),
  deleteFeatureRecord: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

function prismaP2003() {
  return new Prisma.PrismaClientKnownRequestError(
    "Foreign key constraint failed",
    { code: "P2003", clientVersion: "6.18.0" },
  );
}

function validFeatureForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set("projectId", "proj-1");
  formData.set("title", "Dashboard hub");
  formData.set("description", "Central landing page");
  formData.set("status", "draft");
  formData.set("priority", "50");
  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }
  return formData;
}

const normalizedFeatureData = {
  projectId: "proj-1",
  title: "Dashboard hub",
  description: "Central landing page",
  status: "draft" as const,
  priority: 50,
};

describe("createFeature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(redirect).mockImplementation((url: string) => {
      throw new Error(`REDIRECT:${url}`);
    });
  });

  it("returns field errors when validation fails", async () => {
    const formData = validFeatureForm({ title: "", status: "invalid" });

    const result = await createFeature(undefined, formData);

    expect(result.fieldErrors?.title).toContain("Title is required");
    expect(result.fieldErrors?.status).toBeDefined();
    expect(createFeatureRecord).not.toHaveBeenCalled();
  });

  it("calls createFeatureRecord and revalidates on success", async () => {
    vi.mocked(createFeatureRecord).mockResolvedValue({
      id: "feat-1",
      ...normalizedFeatureData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(createFeature(undefined, validFeatureForm())).rejects.toThrow(
      "REDIRECT:/features/feat-1",
    );

    expect(createFeatureRecord).toHaveBeenCalledWith(normalizedFeatureData);
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/features");
    expect(revalidatePath).toHaveBeenCalledWith("/projects/proj-1");
    expect(redirect).toHaveBeenCalledWith("/features/feat-1");
  });

  it("maps Prisma P2003 to projectId field error", async () => {
    vi.mocked(createFeatureRecord).mockRejectedValue(prismaP2003());

    const result = await createFeature(undefined, validFeatureForm());

    expect(result.fieldErrors?.projectId).toEqual(["Invalid project"]);
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("updateFeature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns field errors when validation fails", async () => {
    const formData = validFeatureForm({ id: "", title: "" });

    const result = await updateFeature(undefined, formData);

    expect(result.fieldErrors?.id).toBeDefined();
    expect(result.fieldErrors?.title).toContain("Title is required");
    expect(updateFeatureRecord).not.toHaveBeenCalled();
  });

  it("returns success state and revalidates on success", async () => {
    vi.mocked(updateFeatureRecord).mockResolvedValue({
      id: "feat-1",
      ...normalizedFeatureData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await updateFeature(
      undefined,
      validFeatureForm({ id: "feat-1" }),
    );

    expect(result).toEqual({ ok: true, message: "Feature updated" });
    expect(updateFeatureRecord).toHaveBeenCalledWith(
      "feat-1",
      normalizedFeatureData,
    );
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/features");
    expect(revalidatePath).toHaveBeenCalledWith("/features/feat-1");
    expect(revalidatePath).toHaveBeenCalledWith("/projects/proj-1");
  });
});

describe("deleteFeature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(redirect).mockImplementation((url: string) => {
      throw new Error(`REDIRECT:${url}`);
    });
  });

  it("does not call delete service when id is missing", async () => {
    const formData = new FormData();

    await deleteFeature(formData);

    expect(deleteFeatureRecord).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });
});
