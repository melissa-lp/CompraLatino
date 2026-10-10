import { createCachedResource } from './cachedResource.js'

const usePricingResource = createCachedResource('/pricing')

// Tipo de cambio vigente
export function usePricing() {
  return usePricingResource().data
}
