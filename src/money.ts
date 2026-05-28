import { currencyInfo } from './currencies'
import { floatToSubunits } from './utils/bigint'

export interface Money {
  readonly amount: bigint
  readonly currency: string
}

export function money(value: number | string | bigint, currency: string): Money {
  const info = currencyInfo(currency) // throws UnknownCurrencyError if invalid

  if (typeof value === 'bigint') {
    return { amount: value, currency }
  }

  const amount = floatToSubunits(value, info.decimals, currency)
  return { amount, currency }
}
