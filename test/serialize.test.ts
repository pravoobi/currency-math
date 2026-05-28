import { describe, it, expect } from 'vitest'
import { money } from '../src/money'
import { serialize, deserialize, toStorageInt, toStorageString, fromStorageInt, fromStorageString } from '../src/serialize'

describe('serialize / deserialize', () => {
  it('round-trips', () => {
    const m = money(19.99, 'USD')
    const s = serialize(m)
    expect(s.amount).toBe('1999')
    expect(s.currency).toBe('USD')
    const d = deserialize(s)
    expect(d.amount).toBe(1999n)
    expect(d.currency).toBe('USD')
  })
})

describe('storage helpers', () => {
  it('toStorageInt / fromStorageInt round-trip', () => {
    const m = money(19.99, 'USD')
    expect(fromStorageInt(toStorageInt(m), 'USD').amount).toBe(1999n)
  })

  it('toStorageString / fromStorageString round-trip', () => {
    const m = money(19.99, 'USD')
    expect(fromStorageString(toStorageString(m), 'USD').amount).toBe(1999n)
  })
})
