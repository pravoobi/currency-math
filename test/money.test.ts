import { describe, it, expect } from 'vitest'
import { money } from '../src/money'
import { UnknownCurrencyError, InvalidAmountError } from '../src/errors'

describe('money()', () => {
  it('converts decimal number to subunits', () => {
    expect(money(19.99, 'USD').amount).toBe(1999n)
  })

  it('converts decimal string to subunits', () => {
    expect(money('19.99', 'USD').amount).toBe(1999n)
  })

  it('passes bigint through as-is', () => {
    expect(money(1999n, 'USD').amount).toBe(1999n)
  })

  it('handles 0-decimal currency (JPY)', () => {
    expect(money(1999, 'JPY').amount).toBe(1999n)
  })

  it('handles 3-decimal currency (BHD)', () => {
    expect(money('1.234', 'BHD').amount).toBe(1234n)
  })

  it('handles 8-decimal crypto (BTC)', () => {
    expect(money('0.001', 'BTC').amount).toBe(100000n)
  })

  it('handles float trap: 0.1 + 0.2 input', () => {
    // 0.1 + 0.2 in JS = 0.30000000000000004 — must still parse to 30n
    expect(money(0.1 + 0.2, 'USD').amount).toBe(30n)
  })

  it('throws UnknownCurrencyError for unknown currency', () => {
    expect(() => money(1, 'FAKE')).toThrow(UnknownCurrencyError)
  })

  it('throws InvalidAmountError for too many decimal places', () => {
    expect(() => money('1.999', 'USD')).toThrow(InvalidAmountError)
  })
})
