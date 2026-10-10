import { createCachedResource } from './cachedResource.js'

const useCategoriesResource = createCachedResource('/categories')

// Categorías
export function useCategories() {
  const { data, isLoading, error } = useCategoriesResource()
  return { categories: data ?? [], isLoading, error }
}
