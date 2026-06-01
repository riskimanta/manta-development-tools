"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  featureCreateSchema,
  featureUpdateSchema,
} from "@/lib/validations/feature";
import {
  createFeatureRecord,
  deleteFeatureRecord,
  updateFeatureRecord,
} from "@/services/features";

export type FeatureActionState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function flattenZodErrors(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  const fe = error.flatten().fieldErrors;
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(fe)) {
    if (v?.length) out[k] = v;
  }
  return out;
}

export async function createFeature(
  _prev: FeatureActionState | undefined,
  formData: FormData,
): Promise<FeatureActionState> {
  const raw = {
    projectId: formData.get("projectId"),
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
    priority: formData.get("priority"),
  };

  const parsed = featureCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: flattenZodErrors(parsed.error) };
  }

  try {
    const feature = await createFeatureRecord(parsed.data);
    revalidatePath("/");
    revalidatePath("/features");
    revalidatePath(`/projects/${parsed.data.projectId}`);
    redirect(`/features/${feature.id}`);
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2003"
    ) {
      return {
        fieldErrors: { projectId: ["Invalid project"] },
      };
    }
    throw e;
  }
}

export async function updateFeature(
  _prev: FeatureActionState | undefined,
  formData: FormData,
): Promise<FeatureActionState> {
  const raw = {
    id: formData.get("id"),
    projectId: formData.get("projectId"),
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
    priority: formData.get("priority"),
  };

  const parsed = featureUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: flattenZodErrors(parsed.error) };
  }

  const { id, ...data } = parsed.data;

  await updateFeatureRecord(id, data);

  revalidatePath("/");
  revalidatePath("/features");
  revalidatePath(`/features/${id}`);
  revalidatePath(`/projects/${data.projectId}`);
  return { ok: true, message: "Feature updated" };
}

export async function deleteFeature(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return;
  }

  const existing = await deleteFeatureRecord(id);
  if (!existing) {
    return;
  }

  revalidatePath("/");
  revalidatePath("/features");
  revalidatePath(`/projects/${existing.projectId}`);
  redirect("/features");
}
