import { describe, it, expect } from 'vitest'
import { currencyInfo, isCurrency, registerCurrency } from '../src/currencies'
import { UnknownCurrencyError } from '../src/errors'

describe('currencyInfo', () => {
  it('JPY has 0 decimals', () => expect(currencyInfo('JPY').decimals).toBe(0))
  it('BHD has 3 decimals', () => expect(currencyInfo('BHD').decimals).toBe(3))
  it('BTC has 8 decimals', () => expect(currencyInfo('BTC').decimals).toBe(8))
  it('ETH has 18 decimals', () => expect(currencyInfo('ETH').decimals).toBe(18))
  it('USD has 2 decimals', () => expect(currencyInfo('USD').decimals).toBe(2))
  it('throws for unknown currency', () => expect(() => currencyInfo('FAKE')).toThrow(UnknownCurrencyError))
})

describe('isCurrency', () => {
  it('returns true for USD', () => expect(isCurrency('USD')).toBe(true))
  it('returns false for XXX', () => expect(isCurrency('XXX')).toBe(false))
})

describe('registerCurrency', () => {
  it('registers a custom currency', () => {
    registerCurrency({ code: 'MAGIC', decimals: 2, symbol: '✦', name: 'Magic Coin' })
    expect(isCurrency('MAGIC')).toBe(true)
    expect(currencyInfo('MAGIC').decimals).toBe(2)
  })
})
