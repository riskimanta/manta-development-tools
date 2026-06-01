"use server";

import {
  getCommandPaletteRecent,
  searchCommandPalette,
} from "@/services/search";

export async function searchCommandPaletteAction(query: string) {
  return searchCommandPalette(query);
}

export async function getCommandPaletteRecentAction() {
  return getCommandPaletteRecent();
}
