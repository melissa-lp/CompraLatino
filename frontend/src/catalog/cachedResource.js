import { useEffect, useState } from 'react'
import { apiFetch } from '../api/client.js'

// Hook para datos que casi no cambian (categorías, tipo de cambio)
export function createCachedResource(path) {
  let promise = null

  function load() {
    if (!promise) {
      promise = apiFetch(path).catch((error) => {
        promise = null
        throw error
      })
    }
    return promise
  }

  return function useCachedResource() {
    const [state, setState] = useState({ data: null, isLoading: true, error: '' })

    useEffect(() => {
      let cancelled = false
      load()
        .then((data) => {
          if (!cancelled) setState({ data, isLoading: false, error: '' })
        })
        .catch((err) => {
          if (!cancelled) setState({ data: null, isLoading: false, error: err.message })
        })
      return () => {
        cancelled = true
      }
    }, [])

    return state
  }
}
