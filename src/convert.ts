import { Money } from './money'
import { currencyInfo } from './currencies'
import { multiply } from './arithmetic'
import { NoConverterError } from './errors'

export type ConverterFn = (from: string, to: string) => Promise<number>

let globalConverter: ConverterFn | null = null

export function setConverter(fn: ConverterFn): void {
  globalConverter = fn
}

export async function convert(amount: Money, toCurrency: string): Promise<Money> {
  if (amount.currency === toCurrency) return amount
  if (!globalConverter) throw new NoConverterError()

  const rate = await globalConverter(amount.currency, toCurrency)
  const rateStr = String(rate)

  // multiply gives us the result in the source currency's subunits scaled by rate.
  // We need to re-express it as toCurrency subunits.
  const sourceInfo = currencyInfo(amount.currency)
  const targetInfo = currencyInfo(toCurrency)

  const scaled = multiply(amount, rateStr)

  // Adjust for decimal difference between source and target currency
  const decimalDiff = targetInfo.decimals - sourceInfo.decimals
  let newAmount: bigint
  if (decimalDiff > 0) {
    newAmount = scaled.amount * BigInt(10 ** decimalDiff)
  } else if (decimalDiff < 0) {
    newAmount = scaled.amount / BigInt(10 ** -decimalDiff)
  } else {
    newAmount = scaled.amount
  }

  return { amount: newAmount, currency: toCurrency }
}

export function withCache(fn: ConverterFn, options: { ttlSeconds: number }): ConverterFn {
  const cache = new Map<string, { rate: number; expiresAt: number }>()

  return async (from: string, to: string): Promise<number> => {
    const key = `${from}:${to}`
    const cached = cache.get(key)
    if (cached && Date.now() < cached.expiresAt) {
      return cached.rate
    }

    const rate = await fn(from, to)
    cache.set(key, { rate, expiresAt: Date.now() + options.ttlSeconds * 1000 })
    return rate
  }
}
