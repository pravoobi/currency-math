import {
  money,
  add,
  format,
  convert,
  setConverter,
  withCache,
} from '../src/index'

// Register a mock converter (swap with frankfurterAdapter() in production)
setConverter(
  withCache(
    async (from, to) => {
      // Hardcoded rates for demo — replace with a real adapter
      const rates: Record<string, number> = {
        'USD:EUR': 0.9234,
        'USD:GBP': 0.7891,
        'EUR:USD': 1.0829,
        'GBP:USD': 1.2672,
      }
      const rate = rates[`${from}:${to}`]
      if (!rate) throw new Error(`No rate for ${from}→${to}`)
      return rate
    },
    { ttlSeconds: 300 },
  ),
)

async function main() {
  const usd = money(100, 'USD')
  const eur = money(200, 'EUR')

  // Display in multiple locales
  console.log(format(usd, 'en-US')) // $100.00
  console.log(format(eur, 'de-DE')) // 200,00 €
  console.log(format(eur, 'fr-FR')) // 200,00 €

  // Convert USD → EUR
  const usdToEur = await convert(usd, 'EUR')
  console.log('\n$100 USD →', format(usdToEur, 'en-US', { currency: 'EUR', currencyDisplay: 'code' }))

  // Convert EUR → USD
  const eurToUsd = await convert(eur, 'USD')
  console.log('€200 EUR →', format(eurToUsd, 'en-US'))

  // Same-currency convert is a no-op (no API call)
  const same = await convert(usd, 'USD')
  console.log('\nSame-currency convert returns identical object:', same === usd) // true

  // Aggregate multi-currency totals by converting to a common base
  const expenses = [
    money(50, 'USD'),
    money(80, 'EUR'),
    money(30, 'GBP'),
  ]

  let totalUSD = money(0, 'USD')
  for (const expense of expenses) {
    const inUSD = await convert(expense, 'USD')
    totalUSD = add(totalUSD, inUSD)
  }
  console.log('\nTotal expenses (USD):', format(totalUSD, 'en-US'))
}

main().catch(console.error)
