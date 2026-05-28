# currency-math

A safe, ergonomic money arithmetic library for JavaScript/TypeScript. Stores all values as BigInt in the smallest currency unit (cents, paise, satoshi) to eliminate floating point errors. Provides locale-aware formatting via native `Intl.NumberFormat`, pluggable currency conversion hooks, correct allocation/splitting, and full ISO 4217 + crypto currency support.

---

## Project goal

Build and publish a production-ready npm package (`currency-math`) that:
- Makes floating point money bugs impossible by design (BigInt-backed, integer storage)
- Formats correctly for any locale with zero bundled locale data (native Intl)
- Lets teams plug in any exchange rate source via a single adapter function
- Handles the edge cases every other library ignores: 3-decimal currencies (BHD), crypto (BTC), banker's rounding, penny-perfect allocation

---

## Repository structure

```
currency-math/
├── src/
│   ├── index.ts                  # Public API exports
│   ├── money.ts                  # Money type + constructor
│   ├── arithmetic.ts             # add, subtract, multiply, divide
│   ├── compare.ts                # eq, gt, lt, gte, lte, isZero, isNegative, isPositive
│   ├── format.ts                 # format() + Intl.NumberFormat cache
│   ├── allocate.ts               # allocate() — penny-perfect splitting
│   ├── convert.ts                # convert() + setConverter() + withCache()
│   ├── rounding.ts               # RoundingMode enum + applyRounding()
│   ├── currencies.ts             # ISO 4217 metadata + crypto entries
│   ├── config.ts                 # Global config (rounding mode, default locale)
│   ├── serialize.ts              # serialize(), deserialize(), toStorageInt(), toStorageString()
│   ├── errors.ts                 # Typed error classes
│   ├── adapters/
│   │   ├── index.ts              # Adapter exports
│   │   ├── frankfurter.ts        # Free ECB rates, no API key
│   │   ├── openexchange.ts       # openexchangerates.org adapter
│   │   └── cache.ts              # withCache() TTL wrapper for any adapter
│   └── utils/
│       └── bigint.ts             # Internal BigInt helpers
├── test/
│   ├── money.test.ts
│   ├── arithmetic.test.ts
│   ├── compare.test.ts
│   ├── format.test.ts
│   ├── allocate.test.ts
│   ├── convert.test.ts
│   ├── rounding.test.ts
│   ├── serialize.test.ts
│   └── currencies.test.ts
├── examples/
│   ├── basic.ts
│   ├── invoicing.ts
│   ├── multi-currency.ts
│   └── crypto.ts
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── vitest.config.ts
└── README.md
```

---

## Core type (`src/money.ts`)

```ts
export interface Money {
  /** Amount in smallest currency unit as BigInt. $19.99 → 1999n. ¥1999 → 1999n. 1 BTC → 100000000n */
  readonly amount: bigint
  /** ISO 4217 code or crypto ticker. e.g. "USD", "EUR", "JPY", "BTC", "ETH" */
  readonly currency: string
}

/** Primary constructor. Accepts number, string, or bigint. */
export function money(value: number | string | bigint, currency: string): Money
```

### Constructor behavior

- `money(19.99, 'USD')` → `{ amount: 1999n, currency: 'USD' }`
- `money('19.99', 'USD')` → `{ amount: 1999n, currency: 'USD' }`
- `money('0.001', 'BTC')` → `{ amount: 100000n, currency: 'BTC' }` (8 decimals)
- `money(1999n, 'USD')` → `{ amount: 1999n, currency: 'USD' }` (raw, no conversion)
- `money(0.1 + 0.2, 'USD')` → `{ amount: 30n, currency: 'USD' }` — float input is parsed via string to avoid inheriting floating point error. Internally: `String(value)` → parse decimal string → shift by currency decimals → BigInt.
- Throws `CurrencyMathError` if `currency` is not in the currencies registry.
- Throws `CurrencyMathError` if value string has more decimal places than the currency supports.

---

## Arithmetic (`src/arithmetic.ts`)

All operations return a new `Money` object. All are pure functions. None mutate inputs.

```ts
export function add(a: Money, b: Money): Money
export function subtract(a: Money, b: Money): Money
export function multiply(a: Money, factor: number | string | bigint, options?: RoundingOptions): Money
export function divide(a: Money, divisor: number | string | bigint, options?: RoundingOptions): Money
export function abs(a: Money): Money
export function negate(a: Money): Money
```

### Rules

- `add` and `subtract`: both must share the same `currency`, else throw `CurrencyMismatchError`.
- `multiply` and `divide`: `factor`/`divisor` is a plain number (not Money). Result is rounded per `RoundingOptions` or global config.
- Integer multiply (e.g. `multiply(price, 3n)`) is exact — no rounding needed.
- Fractional multiply (e.g. `multiply(price, 0.20)` for 20%): convert factor to a scaled BigInt fraction internally to avoid float contamination. Pattern: `(amount * 20n) / 100n` with rounding on remainder.
- `divide` by zero throws `DivisionByZeroError`.

### Fractional factor implementation

Never pass floats into BigInt arithmetic. Convert factor string to numerator/denominator pair:

```
factor = 0.2  →  "0.2"  →  numerator=2n, denominator=10n
result = (amount * numerator + remainder_rounding) / denominator
```

---

## Rounding (`src/rounding.ts`)

```ts
export enum RoundingMode {
  HALF_EVEN     = 'HALF_EVEN',    // Banker's rounding — default
  HALF_UP       = 'HALF_UP',      // Standard school math
  HALF_DOWN     = 'HALF_DOWN',
  FLOOR         = 'FLOOR',        // Always toward negative infinity
  CEILING       = 'CEILING',      // Always toward positive infinity
  TRUNCATE      = 'TRUNCATE',     // Drop fraction, toward zero
}

export interface RoundingOptions {
  rounding?: RoundingMode
}

export function applyRounding(
  integerPart: bigint,
  remainder: bigint,
  divisor: bigint,
  mode: RoundingMode
): bigint
```

### HALF_EVEN (banker's rounding) — implement carefully

Round half to nearest even integer. Eliminates systematic bias in financial aggregations.
- 2.5 → 2 (rounds to even)
- 3.5 → 4 (rounds to even)
- 2.4 → 2
- 2.6 → 3

---

## Comparisons (`src/compare.ts`)

```ts
export function eq(a: Money, b: Money): boolean
export function gt(a: Money, b: Money): boolean
export function lt(a: Money, b: Money): boolean
export function gte(a: Money, b: Money): boolean
export function lte(a: Money, b: Money): boolean
export function isZero(a: Money): boolean
export function isPositive(a: Money): boolean
export function isNegative(a: Money): boolean
export function min(...amounts: Money[]): Money
export function max(...amounts: Money[]): Money
```

All comparison functions that take two `Money` args throw `CurrencyMismatchError` if currencies differ.

---

## Formatting (`src/format.ts`)

Uses native `Intl.NumberFormat`. Zero bundled locale data.

```ts
export function format(
  amount: Money,
  locale?: string,
  options?: Intl.NumberFormatOptions
): string
```

### Implementation

1. Look up `CurrencyInfo` for `amount.currency` to get `decimals`.
2. Convert `amount.amount` (BigInt) to decimal string: divide by `10^decimals`, preserve all significant digits — do NOT use floating point division for this step. Use string manipulation.
3. Pass decimal string as `Number` to `Intl.NumberFormat` only for display. Loss of BigInt precision at this stage is acceptable since display values are bounded by real-world amounts.
4. Cache `Intl.NumberFormat` instances keyed by `${locale}:${currency}:${JSON.stringify(options)}`. Instantiation is expensive; reuse aggressively.

### Examples the implementation must produce correctly

```ts
format(money(123456789, 'USD'), 'en-US')   // "$1,234,567.89"
format(money(123456789, 'EUR'), 'de-DE')   // "1.234.567,89 €"
format(money(123456789, 'EUR'), 'fr-FR')   // "1 234 567,89 €"  (thin space separator)
format(money(1999, 'JPY'), 'ja-JP')        // "¥1,999"           (0 decimals)
format(money(1000, 'BHD'), 'ar-BH')        // "1,000 د.ب.‏"     (3 decimals)
format(money(100000000, 'BTC'), 'en-US')   // "₿1.00000000"
format(money(123456789, 'USD'), 'en-US', { currencyDisplay: 'name' })  // "1,234,567.89 US dollars"
format(money(123456789, 'USD'), 'en-US', { notation: 'compact' })      // "$1.2M"
```

---

## Allocation (`src/allocate.ts`)

Split a Money amount into parts by ratio. The total of all parts always equals the original — no pennies created or lost.

```ts
export function allocate(amount: Money, ratios: number[]): Money[]
```

### Algorithm

1. Validate ratios: all must be non-negative, at least one must be positive.
2. Sum all ratios.
3. For each ratio: `share = floor(amount.amount * ratio / totalRatios)`.
4. Sum all shares. Compute `remainder = amount.amount - sum`.
5. Distribute remainder one unit at a time to shares from first to last until exhausted.

### Examples

```ts
allocate(money(10, 'USD'), [1, 1, 1])
// [Money $3.34, Money $3.33, Money $3.33]  ← $10.00 total, remainder to first

allocate(money(100, 'USD'), [60, 40])
// [Money $60.00, Money $40.00]

allocate(money(0.01, 'USD'), [1, 1, 1])
// [Money $0.01, Money $0.00, Money $0.00]  ← 1 cent can't split 3 ways

allocate(money(1, 'USD'), [0, 1])
// [Money $0.00, Money $1.00]  ← zero ratio gets nothing
```

---

## Currency conversion (`src/convert.ts`)

```ts
/** A function that returns the exchange rate from `from` to `to` */
export type ConverterFn = (from: string, to: string) => Promise<number>

/** Register a global converter. Must be called before convert() is used. */
export function setConverter(fn: ConverterFn): void

/** Convert a Money amount to another currency */
export async function convert(amount: Money, toCurrency: string): Promise<Money>

/** Wrap any ConverterFn with TTL caching */
export function withCache(fn: ConverterFn, options: { ttlSeconds: number }): ConverterFn
```

### `convert()` implementation

1. If `amount.currency === toCurrency`, return `amount` unchanged.
2. Call registered `ConverterFn` to get rate (a plain `number`, e.g. `0.9234`).
3. Convert rate to a precise fraction string internally (avoid float BigInt multiply).
4. Apply: `newAmount = multiply(amount, rateString)` using existing multiply logic.
5. Re-interpret result as `toCurrency` with that currency's decimal precision.
6. Throws `NoConverterError` if no converter has been registered.

### `withCache()` implementation

Simple in-memory Map keyed by `${from}:${to}`. Each entry stores `{ rate, expiresAt }`.
On lookup: if `Date.now() > expiresAt`, evict and re-fetch.

---

## Adapters (`src/adapters/`)

### Frankfurter (`src/adapters/frankfurter.ts`)

- Endpoint: `https://api.frankfurter.app/latest?from={from}&to={to}`
- Free, no API key, ECB rates updated daily
- Returns `ConverterFn`

```ts
export function frankfurterAdapter(): ConverterFn
```

### Open Exchange Rates (`src/adapters/openexchange.ts`)

- Endpoint: `https://openexchangerates.org/api/latest.json?app_id={key}&base={from}&symbols={to}`
- Requires API key

```ts
export function openExchangeAdapter(options: { appId: string }): ConverterFn
```

Both adapters must handle network errors gracefully, throwing `ConversionFetchError` with the original cause attached.

---

## Currency registry (`src/currencies.ts`)

```ts
export interface CurrencyInfo {
  code: string       // ISO 4217 or crypto ticker
  decimals: number   // Subunit precision: USD=2, JPY=0, BHD=3, BTC=8
  symbol: string     // Display symbol: $, ¥, €, ₿
  name: string       // Full name: "US Dollar", "Bitcoin"
}

export function currencyInfo(code: string): CurrencyInfo  // throws if unknown
export function isCurrency(code: string): boolean
export function registerCurrency(info: CurrencyInfo): void  // for custom/internal currencies
```

### Must include

**All ISO 4217 active currencies** with correct decimal places. Special attention to non-2-decimal currencies:
- JPY, KRW, VND, CLP, ISK → 0 decimals
- BHD, IQD, KWD, OMR, TND → 3 decimals
- CLF, UYW → 4 decimals

**Crypto:**
- BTC → 8 decimals (satoshi)
- ETH → 18 decimals (wei) — store as BigInt, never as float
- USDC, USDT → 6 decimals

Store as a static object `Record<string, CurrencyInfo>` — no dynamic loading, treeshakeable.

---

## Global config (`src/config.ts`)

```ts
export interface CurrencyMathConfig {
  rounding: RoundingMode      // Default: HALF_EVEN
  defaultLocale: string       // Default: system locale via Intl.DateTimeFormat().resolvedOptions().locale
}

export function setConfig(config: Partial<CurrencyMathConfig>): void
export function getConfig(): Readonly<CurrencyMathConfig>
```

---

## Serialization (`src/serialize.ts`)

```ts
export interface SerializedMoney {
  amount: string    // BigInt as decimal string — JSON-safe
  currency: string
}

export function serialize(m: Money): SerializedMoney
export function deserialize(data: SerializedMoney): Money

// Convenience for DB storage
export function toStorageInt(m: Money): bigint     // store as BIGINT column
export function toStorageString(m: Money): string  // store as TEXT/VARCHAR column
export function fromStorageInt(amount: bigint, currency: string): Money
export function fromStorageString(amount: string, currency: string): Money
```

---

## Error types (`src/errors.ts`)

```ts
export class CurrencyMathError extends Error {}

export class CurrencyMismatchError extends CurrencyMathError {
  constructor(a: string, b: string)
  // message: "Cannot operate on USD and EUR. Convert to the same currency first."
}

export class UnknownCurrencyError extends CurrencyMathError {
  constructor(code: string)
}

export class DivisionByZeroError extends CurrencyMathError {}

export class NoConverterError extends CurrencyMathError {
  // message: "No converter registered. Call setConverter() before using convert()."
}

export class ConversionFetchError extends CurrencyMathError {
  constructor(message: string, cause: unknown)
}

export class InvalidAmountError extends CurrencyMathError {
  constructor(value: unknown, currency: string)
  // e.g. too many decimal places for currency
}
```

---

## Public API (`src/index.ts`)

```ts
// Construction
export { money } from './money'

// Arithmetic
export { add, subtract, multiply, divide, abs, negate } from './arithmetic'

// Comparisons
export { eq, gt, lt, gte, lte, isZero, isPositive, isNegative, min, max } from './compare'

// Formatting
export { format } from './format'

// Allocation
export { allocate } from './allocate'

// Conversion
export { convert, setConverter, withCache } from './convert'
export type { ConverterFn } from './convert'

// Config
export { setConfig, getConfig } from './config'
export { RoundingMode } from './rounding'
export type { RoundingOptions } from './rounding'

// Currency registry
export { currencyInfo, isCurrency, registerCurrency } from './currencies'
export type { CurrencyInfo } from './currencies'

// Serialization
export { serialize, deserialize, toStorageInt, toStorageString, fromStorageInt, fromStorageString } from './serialize'
export type { SerializedMoney } from './serialize'

// Types
export type { Money } from './money'

// Errors
export {
  CurrencyMathError,
  CurrencyMismatchError,
  UnknownCurrencyError,
  DivisionByZeroError,
  NoConverterError,
  ConversionFetchError,
  InvalidAmountError,
} from './errors'

// Adapters — separate entrypoint to keep core bundle clean
// Import as: import { frankfurterAdapter } from 'currency-math/adapters'
```

Adapters are exported from a separate entrypoint `currency-math/adapters` to avoid bundling fetch logic into apps that don't use conversion.

---

## package.json

```json
{
  "name": "currency-math",
  "version": "0.1.0",
  "description": "Safe money arithmetic with BigInt, locale-aware formatting, and pluggable currency conversion.",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./adapters": {
      "import": "./dist/adapters/index.mjs",
      "require": "./dist/adapters/index.js",
      "types": "./dist/adapters/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts src/adapters/index.ts --format cjs,esm --dts",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "tsup": "^8.0.0",
    "vitest": "^1.6.0",
    "@types/node": "^20.0.0"
  },
  "keywords": ["money", "currency", "bigint", "finance", "intl", "formatting", "safe-math"],
  "license": "MIT",
  "engines": { "node": ">=18.0.0" }
}
```

**Zero runtime dependencies.** No decimal.js, no big.js, no bignumber.js. Native BigInt only.

---

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "skipLibCheck": true,
    "lib": ["ES2020"]
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "test"]
}
```

---

## Testing strategy

Use **vitest**. All tests are pure unit tests — no network, no external deps.

### `arithmetic.test.ts` — critical cases

```ts
// Floating point traps — these must all pass
add(money(0.1, 'USD'), money(0.2, 'USD'))     // must equal money(0.3, 'USD')  NOT 0.30000000000000004
multiply(money(19.99, 'USD'), 3)               // must equal money(59.97, 'USD') NOT 59.970000000000006
divide(money(10, 'USD'), 3)                    // must equal money(3.33, 'USD') with HALF_EVEN
multiply(money(1.005, 'USD'), 100)             // must equal money(100.50, 'USD') NOT 100.49...

// Currency mismatch
add(money(1, 'USD'), money(1, 'EUR'))          // throws CurrencyMismatchError

// Fractional multipliers
multiply(money(100, 'USD'), 0.2)               // money(20, 'USD')
multiply(money(100, 'USD'), 1/3)               // money(33.33, 'USD') with HALF_EVEN

// Negative
subtract(money(5, 'USD'), money(10, 'USD'))    // money(-5, 'USD')
abs(money(-5, 'USD'))                          // money(5, 'USD')
negate(money(5, 'USD'))                        // money(-5, 'USD')
```

### `rounding.test.ts` — banker's rounding

```ts
// HALF_EVEN
divide(money(25, 'USD'), 10)   // 2.5 → money(2, 'USD')   (rounds to even: 2)
divide(money(35, 'USD'), 10)   // 3.5 → money(4, 'USD')   (rounds to even: 4)
divide(money(45, 'USD'), 10)   // 4.5 → money(4, 'USD')   (rounds to even: 4)
divide(money(55, 'USD'), 10)   // 5.5 → money(6, 'USD')   (rounds to even: 6)

// CEILING
divide(money(10, 'USD'), 3, { rounding: RoundingMode.CEILING })  // money(3.34, 'USD')

// FLOOR
divide(money(10, 'USD'), 3, { rounding: RoundingMode.FLOOR })    // money(3.33, 'USD')
```

### `allocate.test.ts` — penny correctness

```ts
// Total of parts always equals original
const parts = allocate(money(10, 'USD'), [1, 1, 1])
const total = parts.reduce((acc, p) => add(acc, p), money(0, 'USD'))
eq(total, money(10, 'USD'))  // must be true, always

// Indivisible penny
allocate(money(0.01, 'USD'), [1, 1])  // [money(0.01, 'USD'), money(0.00, 'USD')]

// Zero ratio
allocate(money(10, 'USD'), [0, 100]) // [money(0, 'USD'), money(10, 'USD')]
```

### `format.test.ts` — locale correctness

```ts
// Must use correct separators per locale — test against known Intl.NumberFormat output
// JPY zero decimals
format(money(1999, 'JPY'), 'ja-JP')   // "¥1,999"  (no cents)

// BHD 3 decimals
format(money(1234, 'BHD'), 'en-US')   // "BHD 1.234"

// Negative
format(money(-1099, 'USD'), 'en-US')  // "-$10.99"
```

### `currencies.test.ts` — edge cases

```ts
currencyInfo('JPY').decimals  // 0
currencyInfo('BHD').decimals  // 3
currencyInfo('BTC').decimals  // 8
currencyInfo('ETH').decimals  // 18
isCurrency('USD')             // true
isCurrency('XXX')             // false
currencyInfo('FAKE')          // throws UnknownCurrencyError
```

### `convert.test.ts` — mocked network

```ts
// Mock converter
setConverter(async (from, to) => from === 'USD' && to === 'EUR' ? 0.9234 : 1)

const result = await convert(money(100, 'USD'), 'EUR')
eq(result, money(92.34, 'EUR'))  // true

// Same currency short-circuits
const same = await convert(money(100, 'USD'), 'USD')
eq(same, money(100, 'USD'))  // true

// No converter registered
// reset converter first, then:
convert(money(1, 'USD'), 'EUR')  // throws NoConverterError
```

---

## Implementation notes

### Float → BigInt conversion (most important function in the codebase)

The `money()` constructor must never use floating point internally. Correct approach:

```ts
function floatToSubunits(value: number | string, decimals: number): bigint {
  const str = typeof value === 'number' ? value.toFixed(decimals + 2) : String(value)
  // Parse as string: split on '.', pad/truncate decimal part, concatenate, parse as BigInt
  const [intPart, decPart = ''] = str.split('.')
  const paddedDec = decPart.slice(0, decimals).padEnd(decimals, '0')
  if (decPart.length > decimals) throw new InvalidAmountError(value, currency)
  return BigInt(intPart + paddedDec)
}
```

### BigInt → decimal string (for format())

```ts
function subunitsToDecimalString(amount: bigint, decimals: number): string {
  if (decimals === 0) return amount.toString()
  const str = amount.toString().padStart(decimals + 1, '0')
  const intPart = str.slice(0, -decimals) || '0'
  const decPart = str.slice(-decimals)
  return `${intPart}.${decPart}`
}
// 1999n, 2 → "19.99"
// 1000n, 3 → "1.000"  (BHD)
// 100000000n, 8 → "1.00000000"  (BTC)
```

### Fractional multiply without float contamination

```ts
function multiplyByDecimalString(amount: bigint, factor: string): { result: bigint, remainder: bigint, divisor: bigint } {
  // "0.2" → numerator=2n, denominator=10n
  // "1.5" → numerator=15n, denominator=10n
  // "0.175" → numerator=175n, denominator=1000n
  const [, decPart = ''] = factor.split('.')
  const denominator = BigInt(10 ** decPart.length)
  const numerator = BigInt(factor.replace('.', ''))
  const product = amount * numerator
  return {
    result: product / denominator,
    remainder: product % denominator,
    divisor: denominator
  }
}
```

### Intl.NumberFormat cache

```ts
const formatterCache = new Map<string, Intl.NumberFormat>()

function getFormatter(currency: string, locale: string, options?: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}:${currency}:${JSON.stringify(options ?? {})}`
  if (!formatterCache.has(key)) {
    formatterCache.set(key, new Intl.NumberFormat(locale, { style: 'currency', currency, ...options }))
  }
  return formatterCache.get(key)!
}
```

---

## README must include

1. The classic floating point problem demo: `0.1 + 0.2 = 0.30000000000000004`
2. 5-line quick start
3. Full API reference with TypeScript signatures
4. Rounding mode comparison table with financial use cases
5. Currency conversion setup guide with all adapters
6. `allocate()` use case: splitting invoices, tax distribution, bill splitting
7. Serialization guide for Prisma / PostgreSQL / JSON APIs
8. Non-standard decimal currencies section (JPY, BHD, BTC)
9. Custom currency registration for internal/fictional currencies
10. Bundle size badge (target: <6kb gzipped, zero deps)

---

## What NOT to build in v0.1

- No streaming or observable price feeds
- No historical exchange rate lookup
- No currency formatting without an amount (use `Intl.NumberFormat` directly)
- No React hooks or framework integrations
- No CLI
- No automatic locale detection from `Accept-Language` headers (document how to pass it)
- No support for `number` output from arithmetic — always return `Money`. Users call `format()` to display.
