import { describe, it, expect } from 'vitest'
import { money } from '../src/money'
import { divide } from '../src/arithmetic'
import { RoundingMode } from '../src/rounding'

// Use bigint literals so amount passes through as-is (e.g. money(25n, 'USD') = 25 cents)
describe('HALF_EVEN (banker\'s rounding)', () => {
  it('2.5 cents → 2 (rounds to even)', () => {
    expect(divide(money(25n, 'USD'), 10).amount).toBe(2n)
  })

  it('3.5 cents → 4 (rounds to even)', () => {
    expect(divide(money(35n, 'USD'), 10).amount).toBe(4n)
  })

  it('4.5 cents → 4 (rounds to even)', () => {
    expect(divide(money(45n, 'USD'), 10).amount).toBe(4n)
  })

  it('5.5 cents → 6 (rounds to even)', () => {
    expect(divide(money(55n, 'USD'), 10).amount).toBe(6n)
  })
})

describe('HALF_UP', () => {
  it('2.5 cents → 3', () => {
    expect(divide(money(25n, 'USD'), 10, { rounding: RoundingMode.HALF_UP }).amount).toBe(3n)
  })
})

describe('TRUNCATE', () => {
  it('drops fractional part toward zero', () => {
    expect(divide(money(10n, 'USD'), 3, { rounding: RoundingMode.TRUNCATE }).amount).toBe(3n)
  })
})

describe('CEILING / FLOOR on divide(money(10, USD), 3)', () => {
  it('CEILING', () => {
    expect(divide(money(10, 'USD'), 3, { rounding: RoundingMode.CEILING }).amount).toBe(334n)
  })

  it('FLOOR', () => {
    expect(divide(money(10, 'USD'), 3, { rounding: RoundingMode.FLOOR }).amount).toBe(333n)
  })
})
