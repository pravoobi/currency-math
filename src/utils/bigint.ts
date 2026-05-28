import { InvalidAmountError } from '../errors'

export function floatToSubunits(value: number | string, decimals: number, currency: string): bigint {
  if (typeof value === 'number') {
    if (!isFinite(value) || isNaN(value)) throw new InvalidAmountError(value, currency)
  }

  const str = typeof value === 'number' ? value.toFixed(decimals + 2) : String(value)

  if (str === '' || str === '-') throw new InvalidAmountError(value, currency)

  const normalized = normalizeNumberString(str, value, currency)

  const dotIndex = normalized.indexOf('.')
  if (dotIndex === -1) {
    return BigInt(normalized) * BigInt(10 ** decimals)
  }

  const intPart = normalized.slice(0, dotIndex) || '0'
  const decPart = normalized.slice(dotIndex + 1)

  if (decPart.length > decimals) {
    if (typeof value === 'string') throw new InvalidAmountError(value, currency)
    // number: toFixed() may give extra trailing digits — truncate silently
  }

  const paddedDec = decPart.slice(0, decimals).padEnd(decimals, '0')
  const isNeg = intPart.startsWith('-')
  const absInt = isNeg ? intPart.slice(1) : intPart
  const combined = absInt + paddedDec
  const result = BigInt(combined)
  return isNeg ? -result : result
}

export function subunitsToDecimalString(amount: bigint, decimals: number): string {
  if (decimals === 0) return amount.toString()

  const isNeg = amount < 0n
  const abs = isNeg ? -amount : amount
  const str = abs.toString().padStart(decimals + 1, '0')
  const intPart = str.slice(0, -decimals) || '0'
  const decPart = str.slice(-decimals)
  return `${isNeg ? '-' : ''}${intPart}.${decPart}`
}

export function factorToBigIntFraction(factor: string): { numerator: bigint; denominator: bigint } {
  const normalized = normalizeNumberString(factor, factor, 'factor')
  const dotIndex = normalized.indexOf('.')
  if (dotIndex === -1) {
    return { numerator: BigInt(normalized), denominator: 1n }
  }
  const decPart = normalized.slice(dotIndex + 1)
  const denominator = BigInt(10 ** decPart.length)
  const numerator = BigInt(normalized.replace('.', ''))
  return { numerator, denominator }
}

function normalizeNumberString(str: string, originalValue: unknown, currency: string): string {
  if (!/[eE]/.test(str)) return str
  const n = Number(str)
  if (!isFinite(n) || isNaN(n)) throw new InvalidAmountError(originalValue, currency)
  return n.toFixed(20).replace(/\.?0+$/, '')
}
