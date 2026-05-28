import { describe, it, expect } from 'vitest'
import { money } from '../src/money'
import { allocate } from '../src/allocate'
import { add } from '../src/arithmetic'
import { eq } from '../src/compare'

describe('allocate', () => {
  it('splits evenly and gives remainder to first', () => {
    const parts = allocate(money(10, 'USD'), [1, 1, 1])
    expect(parts[0]!.amount).toBe(334n)
    expect(parts[1]!.amount).toBe(333n)
    expect(parts[2]!.amount).toBe(333n)
  })

  it('total of parts always equals original', () => {
    const parts = allocate(money(10, 'USD'), [1, 1, 1])
    const total = parts.reduce((acc, p) => add(acc, p), money(0, 'USD'))
    expect(eq(total, money(10, 'USD'))).toBe(true)
  })

  it('60/40 split', () => {
    const parts = allocate(money(100, 'USD'), [60, 40])
    expect(parts[0]!.amount).toBe(6000n)
    expect(parts[1]!.amount).toBe(4000n)
  })

  it('indivisible penny', () => {
    const parts = allocate(money(0.01, 'USD'), [1, 1])
    expect(parts[0]!.amount).toBe(1n)
    expect(parts[1]!.amount).toBe(0n)
  })

  it('zero ratio gets nothing', () => {
    const parts = allocate(money(10, 'USD'), [0, 100])
    expect(parts[0]!.amount).toBe(0n)
    expect(parts[1]!.amount).toBe(1000n)
  })
})
