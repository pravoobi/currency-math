export class CurrencyMathError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CurrencyMathError'
  }
}

export class CurrencyMismatchError extends CurrencyMathError {
  constructor(a: string, b: string) {
    super(`Cannot operate on ${a} and ${b}. Convert to the same currency first.`)
    this.name = 'CurrencyMismatchError'
  }
}

export class UnknownCurrencyError extends CurrencyMathError {
  constructor(code: string) {
    super(`Unknown currency: "${code}". Use registerCurrency() to add custom currencies.`)
    this.name = 'UnknownCurrencyError'
  }
}

export class DivisionByZeroError extends CurrencyMathError {
  constructor() {
    super('Division by zero.')
    this.name = 'DivisionByZeroError'
  }
}

export class NoConverterError extends CurrencyMathError {
  constructor() {
    super('No converter registered. Call setConverter() before using convert().')
    this.name = 'NoConverterError'
  }
}

export class ConversionFetchError extends CurrencyMathError {
  readonly cause: unknown
  constructor(message: string, cause: unknown) {
    super(message)
    this.name = 'ConversionFetchError'
    this.cause = cause
  }
}

export class InvalidAmountError extends CurrencyMathError {
  constructor(value: unknown, currency: string) {
    super(`Invalid amount "${String(value)}" for currency ${currency}.`)
    this.name = 'InvalidAmountError'
  }
}
