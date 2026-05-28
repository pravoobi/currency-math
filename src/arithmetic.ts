import { Money } from './money'
import { CurrencyMismatchError, DivisionByZeroError } from './errors'
import { RoundingOptions } from './rounding'
import { getConfig } from './config'
import { applyRounding } from './rounding'
import { factorToBigIntFraction } from './utils/bigint'

export function add(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new CurrencyMismatchError(a.currency, b.currency)
  return { amount: a.amount + b.amount, currency: a.currency }
}

export function subtract(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new CurrencyMismatchError(a.currency, b.currency)
  return { amount: a.amount - b.amount, currency: a.currency }
}

export function multiply(a: Money, factor: number | string | bigint, options?: RoundingOptions): Money {
  const mode = options?.rounding ?? getConfig().rounding

  if (typeof factor === 'bigint') {
    return { amount: a.amount * factor, currency: a.currency }
  }

  const factorStr = String(factor)
  const { numerator, denominator } = factorToBigIntFraction(factorStr)

  if (denominator === 1n) {
    return { amount: a.amount * numerator, currency: a.currency }
  }

  const product = a.amount * numerator
  const integerPart = product / denominator
  const remainder = product % denominator

  return {
    amount: applyRounding(integerPart, remainder, denominator, mode),
    currency: a.currency,
  }
}

export function divide(a: Money, divisor: number | string | bigint, options?: RoundingOptions): Money {
  const mode = options?.rounding ?? getConfig().rounding

  if (typeof divisor === 'bigint') {
    if (divisor === 0n) throw new DivisionByZeroError()
    const integerPart = a.amount / divisor
    const remainder = a.amount % divisor
    return {
      amount: applyRounding(integerPart, remainder, divisor, mode),
      currency: a.currency,
    }
  }

  const divisorStr = String(divisor)
  const { numerator, denominator } = factorToBigIntFraction(divisorStr)

  if (numerator === 0n) throw new DivisionByZeroError()

  // a / (num/den) = a * den / num
  const product = a.amount * denominator
  const integerPart = product / numerator
  const remainder = product % numerator

  return {
    amount: applyRounding(integerPart, remainder, numerator, mode),
    currency: a.currency,
  }
}

export function abs(a: Money): Money {
  return { amount: a.amount < 0n ? -a.amount : a.amount, currency: a.currency }
}

export function negate(a: Money): Money {
  return { amount: -a.amount, currency: a.currency }
}
