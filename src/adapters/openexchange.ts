import { ConversionFetchError } from '../errors'
import type { ConverterFn } from '../convert'

export function openExchangeAdapter(options: { appId: string }): ConverterFn {
  return async (from: string, to: string): Promise<number> => {
    const params = new URLSearchParams({ app_id: options.appId, base: from, symbols: to })
    const url = `https://openexchangerates.org/api/latest.json?${params}`
    let res: Response
    try {
      res = await fetch(url)
    } catch (err) {
      throw new ConversionFetchError(`Network error fetching rate ${from}→${to}`, err)
    }
    if (!res.ok) {
      throw new ConversionFetchError(`OpenExchangeRates API error ${res.status} ${res.statusText} for ${from}→${to}`, null)
    }
    const data = await res.json() as { rates?: Record<string, number> }
    const rate = data.rates?.[to]
    if (typeof rate !== 'number') {
      throw new ConversionFetchError(`No rate found for ${to} in OpenExchangeRates response`, null)
    }
    return rate
  }
}
