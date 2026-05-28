import { describe, it, expect } from 'vitest'
import { money } from '../src/money'
import { format } from '../src/format'

// Use bigint literals so amounts are raw subunits (123456789n cents = $1,234,567.89)
describe('format', () => {
  it('USD en-US', () => {
    expect(format(money(123456789n, 'USD'), 'en-US')).toBe('$1,234,567.89')
  })

  it('JPY ja-JP (0 decimals) — matches Intl output', () => {
    const expected = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(1999)
    expect(format(money(1999n, 'JPY'), 'ja-JP')).toBe(expected)
  })

  it('negative USD', () => {
    expect(format(money(-1099n, 'USD'), 'en-US')).toBe('-$10.99')
  })

  it('custom currencyDisplay name', () => {
    expect(format(money(123456789n, 'USD'), 'en-US', { currencyDisplay: 'name' }))
      .toBe('1,234,567.89 US dollars')
  })
})
