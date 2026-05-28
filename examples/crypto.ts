import {
  money,
  add,
  multiply,
  allocate,
  format,
  currencyInfo,
  registerCurrency,
  serialize,
} from '../src/index'

// BTC — 8 decimal places (satoshi)
const btc = money('0.00100000', 'BTC')
console.log('BTC amount:', format(btc, 'en-US'))   // ₿0.00100000
console.log('In satoshi:', btc.amount.toString())   // 100000

// ETH — 18 decimal places (wei)
const ethInfo = currencyInfo('ETH')
console.log('\nETH decimals:', ethInfo.decimals) // 18

// 1 ETH in wei
const oneEth = money('1', 'ETH')
console.log('1 ETH in wei:', oneEth.amount.toString()) // 1000000000000000000

// 0.001 ETH (1 finney)
const finney = money('0.001', 'ETH')
console.log('1 finney in wei:', finney.amount.toString()) // 1000000000000000

// Arithmetic stays exact at any scale
const fee = multiply(oneEth, '0.003') // 0.3% fee
console.log('\n0.3% fee on 1 ETH:', fee.amount.toString()) // 3000000000000000 wei

const afterFee = add(oneEth, fee)
console.log('1 ETH + fee in wei:', afterFee.amount.toString())

// Split BTC payment among 5 participants — penny-perfect in satoshi
const payment = money('0.05', 'BTC') // 5000000 satoshi
const shares = allocate(payment, [1, 1, 1, 1, 1])
console.log('\n0.05 BTC split 5 ways:')
shares.forEach((s, i) => console.log(`  Participant ${i + 1}: ${format(s, 'en-US')}`))

// Serialise ETH for a DB that stores bigint as string
const storedEth = serialize(oneEth)
console.log('\nStored 1 ETH:', JSON.stringify(storedEth))
// {"amount":"1000000000000000000","currency":"ETH"}

// Register a custom token (e.g. an internal game currency)
registerCurrency({ code: 'GEM', decimals: 0, symbol: '💎', name: 'Game Gem' })
const gems = money(1000n, 'GEM')
console.log('\nGame gems:', gems.amount.toString()) // 1000
