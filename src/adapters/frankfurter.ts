import { ConversionFetchError } from '../errors'
import type { ConverterFn } from '../convert'

export function frankfurterAdapter(): ConverterFn {
  return async (from: string, to: string): Promise<number> => {
    const params = new URLSearchParams({ from, to })
    const url = `https://api.frankfurter.app/latest?${params}`
    let res: Response
    try {
      res = await fetch(url)
    } catch (err) {
      throw new ConversionFetchError(`Network error fetching rate ${from}→${to}`, err)
    }
    if (!res.ok) {
      throw new ConversionFetchError(`Frankfurter API error ${res.status} ${res.statusText} for ${from}→${to}`, null)
    }
    const data = await res.json() as { rates?: Record<string, number> }
    const rate = data.rates?.[to]
    if (typeof rate !== 'number') {
      throw new ConversionFetchError(`No rate found for ${to} in Frankfurter response`, null)
    }
    return rate
  }
}
