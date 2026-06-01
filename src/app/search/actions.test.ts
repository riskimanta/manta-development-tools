import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getCommandPaletteRecent,
  searchCommandPalette,
} from "@/services/search";

import {
  getCommandPaletteRecentAction,
  searchCommandPaletteAction,
} from "./actions";

vi.mock("@/services/search", () => ({
  searchCommandPalette: vi.fn(),
  getCommandPaletteRecent: vi.fn(),
}));

const mockSearchResult = {
  projects: [
    {
      id: "proj-1",
      name: "ManDev",
      slug: "mandev",
      description: "Internal tools",
    },
  ],
  features: [
    {
      id: "feat-1",
      title: "Dashboard hub",
      description: "Central landing page",
      status: "draft" as const,
      project: { name: "ManDev" },
    },
  ],
};

describe("searchCommandPaletteAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls searchCommandPalette with the query and returns the result", async () => {
    vi.mocked(searchCommandPalette).mockResolvedValue(mockSearchResult);

    const result = await searchCommandPaletteAction("dashboard");

    expect(searchCommandPalette).toHaveBeenCalledWith("dashboard");
    expect(result).toEqual(mockSearchResult);
  });

  it("passes the query through unchanged (trimming happens in the service)", async () => {
    vi.mocked(searchCommandPalette).mockResolvedValue({
      projects: [],
      features: [],
    });

    await searchCommandPaletteAction("  dashboard  ");

    expect(searchCommandPalette).toHaveBeenCalledWith("  dashboard  ");
  });

  it("delegates empty query handling to the service", async () => {
    const emptyResult = { projects: [], features: [] };
    vi.mocked(searchCommandPalette).mockResolvedValue(emptyResult);

    const result = await searchCommandPaletteAction("");

    expect(searchCommandPalette).toHaveBeenCalledWith("");
    expect(result).toEqual(emptyResult);
  });
});

describe("getCommandPaletteRecentAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls getCommandPaletteRecent and returns recent projects and features", async () => {
    vi.mocked(getCommandPaletteRecent).mockResolvedValue(mockSearchResult);

    const result = await getCommandPaletteRecentAction();

    expect(getCommandPaletteRecent).toHaveBeenCalledOnce();
    expect(result).toEqual(mockSearchResult);
  });
});
