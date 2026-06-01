"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  projectCreateSchema,
  projectUpdateSchema,
} from "@/lib/validations/project";
import {
  createProjectRecord,
  deleteProjectRecord,
  updateProjectRecord,
} from "@/services/projects";

export type ActionState = {
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

export async function createProject(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    repoUrl: formData.get("repoUrl"),
    localPath: formData.get("localPath"),
  };

  const parsed = projectCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: flattenZodErrors(parsed.error) };
  }

  try {
    const project = await createProjectRecord(parsed.data);
    revalidatePath("/");
    revalidatePath("/projects");
    redirect(`/projects/${project.id}`);
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return {
        fieldErrors: { slug: ["This slug is already in use"] },
      };
    }
    throw e;
  }
}

export async function updateProject(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    id: formData.get("id"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    repoUrl: formData.get("repoUrl"),
    localPath: formData.get("localPath"),
  };

  const parsed = projectUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: flattenZodErrors(parsed.error) };
  }

  const { id, ...data } = parsed.data;

  try {
    await updateProjectRecord(id, data);
    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    return { ok: true, message: "Project updated" };
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return {
        fieldErrors: { slug: ["This slug is already in use"] },
      };
    }
    throw e;
  }
}

export async function deleteProject(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return;
  }

  await deleteProjectRecord(id);
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/features");
  redirect("/projects");
}
