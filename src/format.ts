import { Money } from './money'
import { currencyInfo } from './currencies'
import { subunitsToDecimalString } from './utils/bigint'
import { getConfig } from './config'

const formatterCache = new Map<string, Intl.NumberFormat>()

function getFormatter(currency: string, locale: string, options?: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}:${currency}:${JSON.stringify(options ?? {})}`
  if (!formatterCache.has(key)) {
    formatterCache.set(key, new Intl.NumberFormat(locale, { style: 'currency', currency, ...options }))
  }
  return formatterCache.get(key)!
}

export function format(amount: Money, locale?: string, options?: Intl.NumberFormatOptions): string {
  const info = currencyInfo(amount.currency)
  const resolvedLocale = locale ?? getConfig().defaultLocale
  const decimalStr = subunitsToDecimalString(amount.amount, info.decimals)
  const numericValue = Number(decimalStr)
  return getFormatter(amount.currency, resolvedLocale, options).format(numericValue)
}
