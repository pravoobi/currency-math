import { Money } from './money'
import { CurrencyMismatchError } from './errors'

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) throw new CurrencyMismatchError(a.currency, b.currency)
}

export function eq(a: Money, b: Money): boolean {
  assertSameCurrency(a, b)
  return a.amount === b.amount
}

export function gt(a: Money, b: Money): boolean {
  assertSameCurrency(a, b)
  return a.amount > b.amount
}

export function lt(a: Money, b: Money): boolean {
  assertSameCurrency(a, b)
  return a.amount < b.amount
}

export function gte(a: Money, b: Money): boolean {
  assertSameCurrency(a, b)
  return a.amount >= b.amount
}

export function lte(a: Money, b: Money): boolean {
  assertSameCurrency(a, b)
  return a.amount <= b.amount
}

export function isZero(a: Money): boolean {
  return a.amount === 0n
}

export function isPositive(a: Money): boolean {
  return a.amount > 0n
}

export function isNegative(a: Money): boolean {
  return a.amount < 0n
}

export function min(...amounts: Money[]): Money {
  if (amounts.length === 0) throw new Error('min() requires at least one argument')
  let result = amounts[0]!
  for (let i = 1; i < amounts.length; i++) {
    const m = amounts[i]!
    assertSameCurrency(result, m)
    if (m.amount < result.amount) result = m
  }
  return result
}

export function max(...amounts: Money[]): Money {
  if (amounts.length === 0) throw new Error('max() requires at least one argument')
  let result = amounts[0]!
  for (let i = 1; i < amounts.length; i++) {
    const m = amounts[i]!
    assertSameCurrency(result, m)
    if (m.amount > result.amount) result = m
  }
  return result
}
