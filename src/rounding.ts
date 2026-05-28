export enum RoundingMode {
  HALF_EVEN = 'HALF_EVEN',
  HALF_UP = 'HALF_UP',
  HALF_DOWN = 'HALF_DOWN',
  FLOOR = 'FLOOR',
  CEILING = 'CEILING',
  TRUNCATE = 'TRUNCATE',
}

export interface RoundingOptions {
  rounding?: RoundingMode
}

/**
 * Given integerPart = floor(numerator / divisor) and remainder = numerator % divisor,
 * apply the rounding mode and return the final integer value.
 * Works correctly for negative amounts (remainder is always same sign as integerPart).
 */
export function applyRounding(
  integerPart: bigint,
  remainder: bigint,
  divisor: bigint,
  mode: RoundingMode,
): bigint {
  if (remainder === 0n) return integerPart

  const absRemainder = remainder < 0n ? -remainder : remainder
  const absDivisor = divisor < 0n ? -divisor : divisor
  const isNegative = integerPart < 0n || (integerPart === 0n && remainder < 0n)

  const doubleRemainder = absRemainder * 2n

  switch (mode) {
    case RoundingMode.TRUNCATE:
      return integerPart

    case RoundingMode.FLOOR:
      return isNegative ? integerPart - 1n : integerPart

    case RoundingMode.CEILING:
      return isNegative ? integerPart : integerPart + 1n

    case RoundingMode.HALF_UP:
      return doubleRemainder >= absDivisor
        ? isNegative ? integerPart - 1n : integerPart + 1n
        : integerPart

    case RoundingMode.HALF_DOWN:
      return doubleRemainder > absDivisor
        ? isNegative ? integerPart - 1n : integerPart + 1n
        : integerPart

    case RoundingMode.HALF_EVEN: {
      if (doubleRemainder < absDivisor) return integerPart
      if (doubleRemainder > absDivisor) return isNegative ? integerPart - 1n : integerPart + 1n
      // Exactly half — round to even
      const absInt = integerPart < 0n ? -integerPart : integerPart
      return absInt % 2n === 0n
        ? integerPart
        : isNegative ? integerPart - 1n : integerPart + 1n
    }
  }
}
