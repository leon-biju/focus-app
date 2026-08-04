import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
  type Category,
  type CategoryType,
} from "@/lib/categories"

export const categoriesKey = (type: CategoryType) => ["categories", type] as const

export function useCategories(type: CategoryType) {
  return useQuery({
    queryKey: categoriesKey(type),
    queryFn: () => fetchCategories(type),
  })
}

export function useCreateCategory(type: CategoryType) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: createCategory,
    onSuccess: (created) => {
      qc.setQueryData<Category[]>(categoriesKey(type), (prev) => [
        ...(prev ?? []),
        created,
      ])
    },
  })
}

export function useUpdateCategory(type: CategoryType) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: Partial<Pick<Category, "label" | "color">> }) =>
      updateCategory(id, changes),
    onSuccess: (updated) => {
      qc.setQueryData<Category[]>(categoriesKey(type), (prev) =>
        (prev ?? []).map((c) => (c.id === updated.id ? updated : c)),
      )
    },
  })
}

export function useDeleteCategory(type: CategoryType) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: (_data, deletedId) => {
      qc.setQueryData<Category[]>(categoriesKey(type), (prev) =>
        (prev ?? []).filter((c) => c.id !== deletedId),
      )
    },
  })
}
