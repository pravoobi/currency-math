import { Money } from './money'
import { CurrencyMathError } from './errors'

export function allocate(amount: Money, ratios: number[]): Money[] {
  if (ratios.length === 0) throw new CurrencyMathError('allocate() requires at least one ratio')
  if (amount.amount < 0n) throw new CurrencyMathError('allocate() requires a non-negative amount')

  const total = ratios.reduce((s, r) => s + r, 0)
  if (total <= 0) throw new CurrencyMathError('allocate() ratios must sum to a positive number')
  if (ratios.some(r => r < 0)) throw new CurrencyMathError('allocate() ratios must be non-negative')

  const totalBig = BigInt(Math.round(total * 1e10))

  const shares: bigint[] = ratios.map(r => {
    const rBig = BigInt(Math.round(r * 1e10))
    return (amount.amount * rBig) / totalBig
  })

  const distributed = shares.reduce((s, v) => s + v, 0n)
  let remainder = amount.amount - distributed

  const step = remainder >= 0n ? 1n : -1n
  let i = 0
  while (remainder !== 0n) {
    shares[i % shares.length]! += step
    remainder -= step
    i++
  }

  return shares.map(s => ({ amount: s, currency: amount.currency }))
}
