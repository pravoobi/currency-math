import { describe, it, expect, beforeEach } from 'vitest'
import { money } from '../src/money'
import { convert, setConverter } from '../src/convert'
import { eq } from '../src/compare'
import { NoConverterError } from '../src/errors'

// Reset converter to null before each test
beforeEach(() => {
  // Force reset by setting a no-op then clearing
  setConverter(null as unknown as Parameters<typeof setConverter>[0])
})

describe('convert', () => {
  it('same currency returns original', async () => {
    setConverter(async () => 1)
    const m = money(100, 'USD')
    const result = await convert(m, 'USD')
    expect(result).toBe(m)
  })

  it('converts USD to EUR at 0.9234', async () => {
    setConverter(async (from, to) => from === 'USD' && to === 'EUR' ? 0.9234 : 1)
    const result = await convert(money(100, 'USD'), 'EUR')
    expect(eq(result, money(92.34, 'EUR'))).toBe(true)
  })

  it('throws NoConverterError when no converter', async () => {
    await expect(convert(money(1, 'USD'), 'EUR')).rejects.toThrow(NoConverterError)
  })
})
