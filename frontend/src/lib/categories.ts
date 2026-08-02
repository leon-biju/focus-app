import { del, get, patch, post } from "@/lib/api"

export type CategoryType = "task" | "time_block"

export interface Category {
  id: string
  label: string
  color: string
  type: CategoryType
  created_at: string
}

export interface CategoryDraft {
  label: string
  color: string
  type: CategoryType
}

export function fetchCategories(type: CategoryType): Promise<Category[]> {
  return get<Category[]>(`/categories?type=${type}`)
}

export function createCategory(draft: CategoryDraft): Promise<Category> {
  return post<Category>("/categories", draft)
}

export function updateCategory(id: string, changes: Partial<Pick<CategoryDraft, "label" | "color">>): Promise<Category> {
  return patch<Category>(`/categories/${id}`, changes)
}

export function deleteCategory(id: string): Promise<void> {
  return del(`/categories/${id}`)
}

export const CATEGORY_COLORS = [
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Emerald", value: "#10b981" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Sky", value: "#0ea5e9" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Pink", value: "#ec4899" },
  { name: "Slate", value: "#64748b" },
] as const
