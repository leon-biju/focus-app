import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createCategory,
  fetchCategories,
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
