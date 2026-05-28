import { describe, it, expect } from 'vitest'
import { money } from '../src/money'
import { eq, gt, lt, gte, lte, isZero, isPositive, isNegative, min, max } from '../src/compare'
import { CurrencyMismatchError } from '../src/errors'

describe('eq / gt / lt / gte / lte', () => {
  it('eq same', () => expect(eq(money(1, 'USD'), money(1, 'USD'))).toBe(true))
  it('eq different', () => expect(eq(money(1, 'USD'), money(2, 'USD'))).toBe(false))
  it('gt', () => expect(gt(money(2, 'USD'), money(1, 'USD'))).toBe(true))
  it('lt', () => expect(lt(money(1, 'USD'), money(2, 'USD'))).toBe(true))
  it('gte equal', () => expect(gte(money(1, 'USD'), money(1, 'USD'))).toBe(true))
  it('lte less', () => expect(lte(money(1, 'USD'), money(2, 'USD'))).toBe(true))

  it('throws on currency mismatch', () => {
    expect(() => eq(money(1, 'USD'), money(1, 'EUR'))).toThrow(CurrencyMismatchError)
  })
})

describe('isZero / isPositive / isNegative', () => {
  it('isZero', () => expect(isZero(money(0, 'USD'))).toBe(true))
  it('isPositive', () => expect(isPositive(money(1, 'USD'))).toBe(true))
  it('isNegative', () => expect(isNegative(money(-1, 'USD'))).toBe(true))
})

describe('min / max', () => {
  const a = money(1, 'USD'), b = money(3, 'USD'), c = money(2, 'USD')
  it('min', () => expect(min(a, b, c).amount).toBe(100n))
  it('max', () => expect(max(a, b, c).amount).toBe(300n))
})
