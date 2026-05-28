import { describe, it, expect } from 'vitest'
import { money } from '../src/money'
import { add, subtract, multiply, divide, abs, negate } from '../src/arithmetic'
import { CurrencyMismatchError, DivisionByZeroError } from '../src/errors'
import { RoundingMode } from '../src/rounding'

describe('add', () => {
  it('0.1 + 0.2 = 0.3 exactly', () => {
    expect(add(money(0.1, 'USD'), money(0.2, 'USD')).amount).toBe(30n)
  })

  it('throws on currency mismatch', () => {
    expect(() => add(money(1, 'USD'), money(1, 'EUR'))).toThrow(CurrencyMismatchError)
  })
})

describe('subtract', () => {
  it('produces negative result', () => {
    expect(subtract(money(5, 'USD'), money(10, 'USD')).amount).toBe(-500n)
  })
})

describe('multiply', () => {
  it('integer factor is exact', () => {
    expect(multiply(money(19.99, 'USD'), 3).amount).toBe(5997n)
  })

  it('$100 * 1.005 = 100.50 (factor precision, not 100.49)', () => {
    // multiply(money(100, 'USD'), 1.005): factor goes through string path → no float drift
    expect(multiply(money(100, 'USD'), 1.005).amount).toBe(10050n)
  })

  it('fractional factor 0.2', () => {
    expect(multiply(money(100, 'USD'), 0.2).amount).toBe(2000n)
  })

  it('bigint factor', () => {
    expect(multiply(money(5, 'USD'), 3n).amount).toBe(1500n)
  })
})

describe('divide', () => {
  it('exact division', () => {
    expect(divide(money(10, 'USD'), 2).amount).toBe(500n)
  })

  it('10 / 3 with HALF_EVEN = 333 cents', () => {
    expect(divide(money(10, 'USD'), 3).amount).toBe(333n)
  })

  it('throws DivisionByZeroError', () => {
    expect(() => divide(money(1, 'USD'), 0)).toThrow(DivisionByZeroError)
  })

  it('CEILING rounding', () => {
    expect(divide(money(10, 'USD'), 3, { rounding: RoundingMode.CEILING }).amount).toBe(334n)
  })

  it('FLOOR rounding', () => {
    expect(divide(money(10, 'USD'), 3, { rounding: RoundingMode.FLOOR }).amount).toBe(333n)
  })
})

describe('abs / negate', () => {
  it('abs of negative', () => {
    expect(abs(money(-5, 'USD')).amount).toBe(500n)
  })

  it('negate of positive', () => {
    expect(negate(money(5, 'USD')).amount).toBe(-500n)
  })
})
