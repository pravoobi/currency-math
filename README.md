# currency-math

![npm](https://img.shields.io/npm/v/%40pravoobi%2Fcurrency-math)
![bundle size](https://img.shields.io/bundlephobia/minzip/%40pravoobi%2Fcurrency-math?label=gzipped&color=green)
![license](https://img.shields.io/npm/l/%40pravoobi%2Fcurrency-math)

Safe money arithmetic for JavaScript/TypeScript. Backed by `BigInt` — floating point bugs are impossible by design.

## The problem this solves

```ts
// Plain JavaScript
0.1 + 0.2 === 0.3          // false
0.1 + 0.2                  // 0.30000000000000004

1.005 * 100                // 100.49999999999999
19.99 * 3                  // 59.97000000000000... (sometimes)
```

```ts
// currency-math
import { money, add, multiply, format } from '@pravoobi/currency-math'

add(money(0.1, 'USD'), money(0.2, 'USD'))    // { amount: 30n, currency: 'USD' } ← exact
multiply(money(19.99, 'USD'), 3)             // { amount: 5997n, currency: 'USD' } ← exact
```

All values are stored as `BigInt` in the smallest currency unit (cents, paise, satoshi). No floats ever touch the internal representation.

---

## Quick start

```bash
npm install @pravoobi/currency-math
```

```ts
import { money, add, multiply, format, allocate } from '@pravoobi/currency-math'

const price   = money(19.99, 'USD')
const qty     = multiply(price, 3)               // $59.97
const tax     = multiply(qty, 0.08)              // $4.80
const total   = add(qty, tax)                    // $64.77
const [a, b]  = allocate(total, [70, 30])        // [$45.34, $19.43]
console.log(format(total, 'en-US'))              // "$64.77"
```

---

## API reference

### Construction

```ts
money(value: number | string | bigint, currency: string): Money
```

- `money(19.99, 'USD')` → `{ amount: 1999n, currency: 'USD' }`
- `money('19.99', 'USD')` → `{ amount: 1999n, currency: 'USD' }`
- `money(1999n, 'USD')` → `{ amount: 1999n, currency: 'USD' }` (raw subunits, no conversion)
- Throws `UnknownCurrencyError` for unrecognised currency codes.
- Throws `InvalidAmountError` if a string has more decimal places than the currency supports.

### Arithmetic

```ts
add(a: Money, b: Money): Money
subtract(a: Money, b: Money): Money
multiply(a: Money, factor: number | string | bigint, options?: RoundingOptions): Money
divide(a: Money, divisor: number | string | bigint, options?: RoundingOptions): Money
abs(a: Money): Money
negate(a: Money): Money
```

`add` and `subtract` throw `CurrencyMismatchError` if currencies differ. `divide` by zero throws `DivisionByZeroError`. All operations return a new `Money` — inputs are never mutated.

### Comparisons

```ts
eq(a: Money, b: Money): boolean
gt(a: Money, b: Money): boolean
lt(a: Money, b: Money): boolean
gte(a: Money, b: Money): boolean
lte(a: Money, b: Money): boolean
isZero(a: Money): boolean
isPositive(a: Money): boolean
isNegative(a: Money): boolean
min(...amounts: Money[]): Money
max(...amounts: Money[]): Money
```

All two-argument comparison functions throw `CurrencyMismatchError` if currencies differ.

### Formatting

```ts
format(amount: Money, locale?: string, options?: Intl.NumberFormatOptions): string
```

Uses the native `Intl.NumberFormat` API — zero bundled locale data. Locale defaults to the system locale if omitted. `Intl.NumberFormat` instances are cached by `locale:currency:options` key.

```ts
format(money(123456789n, 'USD'), 'en-US')                                // "$1,234,567.89"
format(money(123456789n, 'EUR'), 'de-DE')                                // "1.234.567,89 €"
format(money(123456789n, 'EUR'), 'fr-FR')                                // "1 234 567,89 €"
format(money(1999n, 'JPY'), 'ja-JP')                                     // "¥1,999"
format(money(1000n, 'BHD'), 'ar-BH')                                     // "1,000 د.ب.‏"
format(money(100000000n, 'BTC'), 'en-US')                                // "₿1.00000000"
format(money(123456789n, 'USD'), 'en-US', { currencyDisplay: 'name' })   // "1,234,567.89 US dollars"
format(money(123456789n, 'USD'), 'en-US', { notation: 'compact' })       // "$1.2M"
```

### Allocation

```ts
allocate(amount: Money, ratios: number[]): Money[]
```

Splits an amount by ratio. The total of all parts **always** equals the original — no pennies created or lost. Remainder is distributed one subunit at a time from the first share.

### Conversion

```ts
setConverter(fn: ConverterFn): void
convert(amount: Money, toCurrency: string): Promise<Money>
withCache(fn: ConverterFn, options: { ttlSeconds: number }): ConverterFn

type ConverterFn = (from: string, to: string) => Promise<number>
```

### Config

```ts
setConfig(config: Partial<CurrencyMathConfig>): void
getConfig(): Readonly<CurrencyMathConfig>
```

### Currency registry

```ts
currencyInfo(code: string): CurrencyInfo   // throws UnknownCurrencyError if unknown
isCurrency(code: string): boolean
registerCurrency(info: CurrencyInfo): void
```

### Serialization

```ts
serialize(m: Money): SerializedMoney               // { amount: string, currency: string }
deserialize(data: SerializedMoney): Money
toStorageInt(m: Money): bigint                     // for BIGINT DB columns
toStorageString(m: Money): string                  // for TEXT/VARCHAR DB columns
fromStorageInt(amount: bigint, currency: string): Money
fromStorageString(amount: string, currency: string): Money
```

---

## Rounding modes

| Mode | Description | Example (÷10) | Use case |
|---|---|---|---|
| `HALF_EVEN` | Banker's rounding — ties go to even | 2.5→2, 3.5→4 | **Default.** Financial aggregations, eliminates systematic bias |
| `HALF_UP` | Standard school rounding | 2.5→3, 3.5→4 | Consumer-facing prices |
| `HALF_DOWN` | Ties round toward zero | 2.5→2, 3.5→3 | Rare; some commodities |
| `FLOOR` | Always toward −∞ | 2.9→2, −2.1→−3 | Calculating fees (conservative) |
| `CEILING` | Always toward +∞ | 2.1→3, −2.9→−2 | Charging upward (defensive billing) |
| `TRUNCATE` | Drop fraction, toward zero | 2.9→2, −2.9→−2 | Displaying truncated amounts |

Pass `{ rounding: RoundingMode.HALF_UP }` as the third argument to `multiply()` or `divide()`, or set a global default with `setConfig({ rounding: RoundingMode.HALF_UP })`.

---

## Currency conversion

### Frankfurter (free, ECB rates, no API key)

```ts
import { setConverter } from '@pravoobi/currency-math'
import { frankfurterAdapter } from '@pravoobi/currency-math/adapters'

setConverter(frankfurterAdapter())

const eur = await convert(money(100, 'USD'), 'EUR')
```

### Open Exchange Rates

```ts
import { openExchangeAdapter } from '@pravoobi/currency-math/adapters'

setConverter(openExchangeAdapter({ appId: 'YOUR_APP_ID' }))
```

### Adding a TTL cache

```ts
import { withCache } from '@pravoobi/currency-math/adapters'
import { frankfurterAdapter } from '@pravoobi/currency-math/adapters'

setConverter(withCache(frankfurterAdapter(), { ttlSeconds: 3600 }))
```

### Custom adapter

Any function `(from: string, to: string) => Promise<number>` qualifies:

```ts
setConverter(async (from, to) => {
  const res = await fetch(`https://your-rates-api.com/rate?from=${from}&to=${to}`)
  const data = await res.json()
  return data.rate
})
```

---

## Allocation — penny-perfect splitting

`allocate()` guarantees `sum(parts) === original`. Remainders are distributed one subunit at a time to shares from left to right.

```ts
// Invoice: split $10.00 three ways
const [a, b, c] = allocate(money(10, 'USD'), [1, 1, 1])
format(a, 'en-US')  // "$3.34"
format(b, 'en-US')  // "$3.33"
format(c, 'en-US')  // "$3.33"
// $3.34 + $3.33 + $3.33 = $10.00 ✓

// Bill-splitting: unequal shares
const [alice, bob] = allocate(money(100, 'USD'), [70, 30])
// alice: $70.00, bob: $30.00

// Tax distribution across 3 cost centres by headcount [12, 8, 5]
const [cc1, cc2, cc3] = allocate(taxAmount, [12, 8, 5])

// Indivisible penny
const [x, y] = allocate(money(0.01, 'USD'), [1, 1])
// x: $0.01, y: $0.00  ← 1 cent stays whole
```

---

## Serialization — Prisma / PostgreSQL / JSON APIs

### JSON API (REST / tRPC)

```ts
import { serialize, deserialize } from '@pravoobi/currency-math'

// Outgoing response
const payload = serialize(money(19.99, 'USD'))
// { amount: "1999", currency: "USD" }
// BigInt serialised as decimal string — JSON-safe

// Incoming request
const m = deserialize({ amount: "1999", currency: "USD" })
```

### PostgreSQL / Prisma (BIGINT column)

```ts
import { toStorageInt, fromStorageInt } from '@pravoobi/currency-math'

// Write
await prisma.order.create({
  data: { totalAmount: toStorageInt(total), totalCurrency: total.currency }
})

// Read
const order = await prisma.order.findUnique({ where: { id } })
const total = fromStorageInt(BigInt(order.totalAmount), order.totalCurrency)
```

### TEXT / VARCHAR column

```ts
import { toStorageString, fromStorageString } from '@pravoobi/currency-math'

const str = toStorageString(money(19.99, 'USD')) // "1999"
const m   = fromStorageString('1999', 'USD')
```

---

## Non-standard decimal currencies

Most currencies have 2 decimal places, but several don't. `@pravoobi/currency-math` handles all of them correctly.

### Zero-decimal currencies (amount IS the smallest unit)

| Currency | Code | Example |
|---|---|---|
| Japanese Yen | JPY | `money(1999, 'JPY')` → ¥1,999 |
| South Korean Won | KRW | `money(10000, 'KRW')` |
| Vietnamese Đồng | VND | `money(25000, 'VND')` |
| Chilean Peso | CLP | `money(5000, 'CLP')` |
| Icelandic Króna | ISK | `money(500, 'ISK')` |

### Three-decimal currencies

| Currency | Code | Subunit | Example |
|---|---|---|---|
| Bahraini Dinar | BHD | fils | `money('1.500', 'BHD')` → BD 1.500 |
| Kuwaiti Dinar | KWD | fils | `money('2.345', 'KWD')` |
| Omani Rial | OMR | baisa | `money('0.500', 'OMR')` |
| Iraqi Dinar | IQD | fils | `money('1000.000', 'IQD')` |
| Tunisian Dinar | TND | millime | `money('5.250', 'TND')` |

### Crypto

| Asset | Code | Decimals | Subunit |
|---|---|---|---|
| Bitcoin | BTC | 8 | satoshi |
| Ethereum | ETH | 18 | wei |
| USD Coin | USDC | 6 | — |
| Tether | USDT | 6 | — |

```ts
const btc = money('0.00100000', 'BTC')   // 100000 satoshi
const eth = money('1', 'ETH')            // 1000000000000000000n wei
```

ETH's 18-decimal precision stays exact as `BigInt` — it is never stored as a float.

---

## Custom currencies

Register any currency code not in the built-in registry:

```ts
import { registerCurrency, money, format } from '@pravoobi/currency-math'

registerCurrency({
  code: 'ACME',
  decimals: 4,
  symbol: 'Ȧ',
  name: 'Acme Internal Credit',
})

const credit = money('1.0050', 'ACME')
console.log(format(credit, 'en-US'))
```

Use this for internal accounting units, loyalty points, or fictional currencies in tests.

---

## Zero dependencies

`@pravoobi/currency-math` has no runtime dependencies. It uses native `BigInt` for arithmetic and native `Intl.NumberFormat` for formatting.
